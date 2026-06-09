const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletWithdrawal = require('../models/WalletWithdrawal');
const { AppError, asyncHandler } = require('../middleware/error');

exports.getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!wallet) throw new AppError('Wallet not found.', 404);
  res.json({ success: true, data: { wallet } });
});

exports.getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
  const filter = { userId: req.user._id, tenantId: req.tenantId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    WalletTransaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { transactions, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
  });
});

exports.transferFunds = asyncHandler(async (req, res) => {
  const { recipientEmail, amount, description } = req.body;
  if (!recipientEmail || !amount || amount <= 0) throw new AppError('Invalid transfer details.', 400);

  const senderWallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!senderWallet) throw new AppError('Sender wallet not found.', 404);

  const canWithdraw = senderWallet.canWithdraw(amount);
  if (!canWithdraw.allowed) throw new AppError(canWithdraw.reason, 400);

  const recipient = await User.findOne({ email: recipientEmail, tenantId: req.tenantId });
  if (!recipient) throw new AppError('Recipient not found.', 404);

  const recipientWallet = await Wallet.findOne({ userId: recipient._id, tenantId: req.tenantId });
  if (!recipientWallet) throw new AppError('Recipient wallet not found.', 404);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    senderWallet.balance -= amount;
    senderWallet.dailyUsed += amount;
    senderWallet.monthlyUsed += amount;
    await senderWallet.save({ session });

    recipientWallet.balance += amount;
    await recipientWallet.save({ session });

    await WalletTransaction.create([{
      walletId: senderWallet._id,
      userId: req.user._id,
      tenantId: req.tenantId,
      type: 'transfer_out',
      amount,
      balanceBefore: senderWallet.balance + amount,
      balanceAfter: senderWallet.balance,
      description: description || `Transfer to ${recipientEmail}`,
      status: 'completed',
    }], { session });

    await WalletTransaction.create([{
      walletId: recipientWallet._id,
      userId: recipient._id,
      tenantId: req.tenantId,
      type: 'transfer_in',
      amount,
      balanceBefore: recipientWallet.balance - amount,
      balanceAfter: recipientWallet.balance,
      description: `Transfer from ${req.user.email}`,
      status: 'completed',
    }], { session });

    await session.commitTransaction();
    res.json({ success: true, data: { message: 'Transfer successful', balance: senderWallet.balance } });
  } catch (error) {
    await session.abortTransaction();
    throw new AppError('Transfer failed. Please try again.', 500);
  } finally {
    session.endSession();
  }
});

exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, method, accountDetails } = req.body;
  if (!amount || amount < 100) throw new AppError('Minimum withdrawal is 100.', 400);

  const wallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!wallet) throw new AppError('Wallet not found.', 404);

  const canWithdraw = wallet.canWithdraw(amount);
  if (!canWithdraw.allowed) throw new AppError(canWithdraw.reason, 400);

  const fee = amount * 0.02;
  const withdrawal = await WalletWithdrawal.create({
    walletId: wallet._id,
    userId: req.user._id,
    tenantId: req.tenantId,
    amount,
    fee,
    netAmount: amount - fee,
    currency: wallet.currency,
    method,
    accountDetails,
  });

  res.status(201).json({ success: true, data: { withdrawal } });
});

exports.getWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await WalletWithdrawal.find({ userId: req.user._id, tenantId: req.tenantId })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { withdrawals } });
});

exports.processWithdrawal = asyncHandler(async (req, res) => {
  const { status, failureReason } = req.body;
  const withdrawal = await WalletWithdrawal.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!withdrawal) throw new AppError('Withdrawal not found.', 404);

  if (status === 'completed') {
    const wallet = await Wallet.findById(withdrawal.walletId);
    wallet.balance -= withdrawal.amount;
    wallet.dailyUsed += withdrawal.amount;
    wallet.monthlyUsed += withdrawal.amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      userId: withdrawal.userId,
      tenantId: req.tenantId,
      type: 'withdrawal',
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      netAmount: withdrawal.netAmount,
      balanceBefore: wallet.balance + withdrawal.amount,
      balanceAfter: wallet.balance,
      description: `Withdrawal via ${withdrawal.method}`,
      reference: withdrawal.reference,
      status: 'completed',
    });
  }

  withdrawal.status = status;
  withdrawal.failureReason = failureReason;
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  res.json({ success: true, data: { withdrawal } });
});

exports.getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!wallet) throw new AppError('Wallet not found.', 404);
  res.json({ success: true, data: { balance: wallet.balance, escrowBalance: wallet.escrowBalance, currency: wallet.currency } });
});

const User = require('../models/User');
const mongoose = require('mongoose');

exports.generateWalletStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { userId: req.user._id, tenantId: req.tenantId, status: 'completed' };
  if (startDate) filter.createdAt = { $gte: new Date(startDate) };
  if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

  const transactions = await WalletTransaction.find(filter).sort({ createdAt: -1 }).limit(100);
  const wallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });

  res.json({
    success: true,
    data: {
      statement: transactions,
      summary: {
        currentBalance: wallet.balance,
        totalTransactions: transactions.length,
      },
    },
  });
});

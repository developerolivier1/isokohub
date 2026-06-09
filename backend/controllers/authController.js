const crypto = require('crypto');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Wallet = require('../models/Wallet');
const { AppError, asyncHandler } = require('../middleware/error');
const { generateToken, generateRefreshToken, setTokenCookie, clearTokenCookie } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const { sendOTP } = require('../utils/sms');
const logger = require('../utils/logger');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, tenantSlug } = req.body;

  let tenantId = req.tenantId;
  if (tenantSlug) {
    const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
    if (!tenant) throw new AppError('Invalid tenant.', 404, 'TENANT_NOT_FOUND');
    tenantId = tenant._id;
  }
  if (!tenantId) throw new AppError('Tenant context required.', 400);

  const existingUser = await User.findOne({ email, tenantId });
  if (existingUser) throw new AppError('User already exists with this email.', 409, 'DUPLICATE_EMAIL');

  const user = await User.create({ name, email, password, phone, tenantId });

  await Wallet.create({ userId: user._id, tenantId });

  const token = generateToken(user._id, tenantId, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setTokenCookie(res, token);

  try {
    const tenant = await Tenant.findById(tenantId);
    await sendWelcomeEmail(user, tenant?.name);
  } catch (emailError) {
    logger.warn(`Welcome email failed: ${emailError.message}`);
  }

  res.status(201).json({
    success: true,
    data: { user: user.toPublicProfile(), token, refreshToken },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');

  if (!user.isActive) throw new AppError('Account deactivated. Contact support.', 401, 'ACCOUNT_INACTIVE');

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.tenantId, user.role);
  const refreshToken = generateRefreshToken(user._id);
  setTokenCookie(res, token);

  res.json({
    success: true,
    data: { user: user.toPublicProfile(), token, refreshToken },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('tenantId', 'name logo slug');
  res.json({ success: true, data: { user: user.toPublicProfile() } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, preferences } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.json({ success: true, data: { user: user.toPublicProfile() } });
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Current and new password required.', 400);

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401, 'WRONG_PASSWORD');

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id, user.tenantId, user.role);
  setTokenCookie(res, token);

  res.json({ success: true, data: { message: 'Password updated successfully', token } });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, tenantId: req.tenantId });
  if (!user) throw new AppError('No user found with this email.', 404);

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, resetToken);
    res.json({ success: true, data: { message: 'Password reset email sent' } });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Try again.', 500);
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Invalid or expired reset token.', 400, 'INVALID_RESET_TOKEN');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const jwtToken = generateToken(user._id, user.tenantId, user.role);
  setTokenCookie(res, jwtToken);

  res.json({ success: true, data: { message: 'Password reset successful', token: jwtToken } });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required.', 400);

  try {
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User not found.', 404);

    const token = generateToken(user._id, user.tenantId, user.role);
    setTokenCookie(res, token);

    res.json({ success: true, data: { token } });
  } catch (error) {
    throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }
});

exports.sendPhoneOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = req.user;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  user.meta.set('phoneOtpHash', otpHash);
  user.meta.set('phoneOtpExpire', Date.now() + 10 * 60 * 1000);
  user.meta.set('pendingPhone', phone);
  await user.save();

  try {
    await sendOTP(phone, otp);
    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error) {
    throw new AppError('Failed to send OTP. Try again.', 500);
  }
});

exports.verifyPhoneOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = req.user;

  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const storedHash = user.meta.get('phoneOtpHash');
  const expire = user.meta.get('phoneOtpExpire');

  if (otpHash !== storedHash || Date.now() > expire) {
    throw new AppError('Invalid or expired OTP.', 400, 'INVALID_OTP');
  }

  user.phone = user.meta.get('pendingPhone');
  user.phoneVerified = true;
  user.meta.delete('phoneOtpHash');
  user.meta.delete('phoneOtpExpire');
  user.meta.delete('pendingPhone');
  await user.save();

  res.json({ success: true, data: { message: 'Phone verified successfully', user: user.toPublicProfile() } });
});

exports.registerTenantAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, tenantName, tenantSlug } = req.body;

  const existingTenant = await Tenant.findOne({ slug: tenantSlug });
  if (existingTenant) throw new AppError('Tenant slug already taken.', 409);

  const tenant = await Tenant.create({
    name: tenantName,
    slug: tenantSlug,
    createdBy: null,
  });

  const user = await User.create({
    name,
    email,
    password,
    phone,
    tenantId: tenant._id,
    role: 'tenant_admin',
  });

  tenant.createdBy = user._id;
  await tenant.save();

  await Wallet.create({ userId: user._id, tenantId: tenant._id });

  const token = generateToken(user._id, tenant._id, user.role);
  setTokenCookie(res, token);

  try {
    await sendWelcomeEmail(user, tenantName);
  } catch (e) { logger.warn(`Welcome email failed: ${e.message}`); }

  res.status(201).json({
    success: true,
    data: { user: user.toPublicProfile(), tenant, token },
  });
});

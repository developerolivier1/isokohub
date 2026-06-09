import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Send } from 'lucide-react';
import { walletAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [amount, setAmount] = useState('');

  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions({ limit: 10 }),
      ]);
      setWallet(walletRes.data.data?.wallet || walletRes.data.data);
      setTransactions(txRes.data.data?.transactions || txRes.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Wallet</h1>

      <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="flex items-center gap-3 mb-4">
          <WalletIcon className="h-8 w-8 text-white/80" />
          <div>
            <p className="text-sm text-white/70">Available Balance</p>
            <p className="text-3xl font-bold">{wallet?.balance?.toLocaleString() || 0} RWF</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowTopUp(true)}>
            <Plus className="h-4 w-4" /> Top Up
          </Button>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" onClick={() => setShowTransfer(true)}>
            <Send className="h-4 w-4" /> Transfer
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4 text-green-600" /> : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description || tx.type}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount?.toLocaleString()} RWF
                  </p>
                  <Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showTopUp} onClose={() => setShowTopUp(false)} title="Top Up Wallet" size="sm">
        <div className="space-y-4">
          <Input label="Amount (RWF)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
          <Button className="w-full" onClick={() => { toast.success('Top-up initiated (mock)'); setShowTopUp(false); }}>Proceed to Payment</Button>
        </div>
      </Modal>

      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer Funds" size="sm">
        <div className="space-y-4">
          <Input label="Recipient Email or Phone" placeholder="Enter recipient" />
          <Input label="Amount (RWF)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
          <Button className="w-full" onClick={() => { toast.success('Transfer initiated (mock)'); setShowTransfer(false); }}>Send</Button>
        </div>
      </Modal>
    </div>
  );
}

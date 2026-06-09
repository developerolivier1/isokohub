import { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowUpRight, Clock } from 'lucide-react';
import { walletAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Payouts() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      walletAPI.getWallet().catch(() => ({ data: { data: {} } })),
      walletAPI.getWithdrawals().catch(() => ({ data: { data: { withdrawals: [] } } })),
    ])
      .then(([walletRes, wdRes]) => {
        setWallet(walletRes.data.data?.wallet || walletRes.data.data);
        setWithdrawals(wdRes.data.data?.withdrawals || wdRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Payouts</h1>

      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-white/80" />
            <div>
              <p className="text-sm text-white/70">Available Balance</p>
              <p className="text-3xl font-bold">{wallet?.balance?.toLocaleString() || 0} RWF</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">Withdraw</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No withdrawals yet</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((wd) => (
              <div key={wd._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{wd.method || 'Bank Transfer'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(wd.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{wd.amount?.toLocaleString()} RWF</p>
                  <Badge variant={wd.status === 'completed' ? 'success' : wd.status === 'pending' ? 'warning' : 'danger'}>{wd.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, MousePointerClick, TrendingUp, Copy, Check } from 'lucide-react';
import { affiliateAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    Promise.all([
      affiliateAPI.getDashboard().catch(() => ({ data: { data: {} } })),
      affiliateAPI.getCommissions().catch(() => ({ data: { data: { commissions: [] } } })),
    ])
      .then(([affRes, commRes]) => {
        setAffiliate(affRes.data.data?.affiliate || affRes.data.data);
        setCommissions(commRes.data.data?.commissions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const referralLink = affiliate?.referralCode
    ? `${window.location.origin}/register?ref=${affiliate.referralCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    try {
      await affiliateAPI.withdraw({ amount: parseFloat(withdrawAmount) });
      setWithdrawAmount('');
      const { data } = await affiliateAPI.getDashboard();
      setAffiliate(data.data?.affiliate || data.data);
    } catch (e) {}
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const stats = [
    { icon: DollarSign, label: 'Current Balance', value: `RWF ${(affiliate?.currentBalance || 0).toLocaleString()}`, color: 'text-green-600 bg-green-50' },
    { icon: TrendingUp, label: 'Total Earned', value: `RWF ${(affiliate?.totalEarned || 0).toLocaleString()}`, color: 'text-blue-600 bg-blue-50' },
    { icon: Users, label: 'Total Referrals', value: affiliate?.totalReferrals || 0, color: 'text-purple-600 bg-purple-50' },
    { icon: MousePointerClick, label: 'Total Clicks', value: affiliate?.totalClicks || 0, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Affiliate Dashboard</h1>
        <p className="text-gray-500">Earn commissions by referring customers</p>
      </div>

      {!affiliate && (
        <Card className="text-center py-8">
          <p className="text-gray-500 mb-4">You haven't joined the affiliate program yet</p>
          <Button onClick={async () => { try { const { data } = await affiliateAPI.register({}); setAffiliate(data.data?.affiliate || data.data); } catch (e) {} }}>
            Join Affiliate Program
          </Button>
        </Card>
      )}

      {affiliate && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <Card key={stat.label}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Your Referral Link</h3>
            <div className="flex items-center gap-2">
              <input value={referralLink} readOnly className="flex-1 input-field text-sm bg-gray-50" />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Withdraw Funds</h3>
              <p className="text-sm text-gray-500 mb-3">
                Available balance: <strong>RWF {(affiliate.currentBalance || 0).toLocaleString()}</strong>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 input-field"
                  max={affiliate.currentBalance || 0}
                />
                <Button onClick={handleWithdraw} disabled={!withdrawAmount || parseFloat(withdrawAmount) > (affiliate.currentBalance || 0)}>
                  Withdraw
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Recent Commissions</h3>
              {commissions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No commissions yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {commissions.slice(0, 10).map(c => (
                    <div key={c._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">RWF {c.amount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{c.description || 'Commission'}</p>
                      </div>
                      <Badge variant={c.status === 'paid' ? 'success' : c.status === 'pending' ? 'warning' : 'default'}>
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, ShoppingBag, DollarSign, Store, TrendingUp } from 'lucide-react';
import { reportAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const metrics = [
    { icon: DollarSign, label: 'Total Revenue', value: stats?.revenue || 0, prefix: 'RWF', color: 'text-green-600 bg-green-50' },
    { icon: Store, label: 'Tenants', value: stats?.totalTenants || 0, color: 'text-blue-600 bg-blue-50' },
    { icon: Users, label: 'Users', value: stats?.totalUsers || 0, color: 'text-purple-600 bg-purple-50' },
    { icon: ShoppingBag, label: 'Orders', value: stats?.totalOrders || 0, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className={`p-2.5 rounded-lg w-fit mb-3 ${m.color}`}><m.icon className="h-5 w-5" /></div>
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {m.prefix && <span className="text-sm font-normal text-gray-500 mr-1">{m.prefix}</span>}
              {m.value?.toLocaleString?.() || m.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="h-72 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400">
            Chart will render here (Chart.js)
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'New tenant registered', time: '5 minutes ago', type: 'tenant' },
              { action: 'Order #ORD-001 completed', time: '1 hour ago', type: 'order' },
              { action: 'New vendor application', time: '2 hours ago', type: 'vendor' },
              { action: 'Payment received', time: '3 hours ago', type: 'payment' },
              { action: 'Subscription upgraded', time: '5 hours ago', type: 'subscription' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'tenant' ? 'bg-blue-500' :
                  activity.type === 'order' ? 'bg-green-500' :
                  activity.type === 'vendor' ? 'bg-purple-500' :
                  activity.type === 'payment' ? 'bg-blue-500' : 'bg-primary-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Users, Eye } from 'lucide-react';
import { reportAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Analytics() {
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
    { icon: DollarSign, label: 'Total Revenue', value: stats?.revenue || 0, prefix: 'RWF', change: '+12.5%', positive: true },
    { icon: ShoppingBag, label: 'Total Orders', value: stats?.totalOrders || 0, change: '+8.2%', positive: true },
    { icon: Users, label: 'Customers', value: stats?.totalCustomers || 0, change: '+15.3%', positive: true },
    { icon: Eye, label: 'Product Views', value: stats?.totalViews || 0, change: '-3.1%', positive: false },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-primary-50 rounded-lg"><m.icon className="h-5 w-5 text-primary-600" /></div>
              <span className={`text-sm font-medium ${m.positive ? 'text-green-600' : 'text-red-600'}`}>{m.change}</span>
            </div>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Chart will render here (Chart.js)</p>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Product {i + 1}</p>
                    <p className="text-xs text-gray-500">{100 - i * 15} sold</p>
                  </div>
                </div>
                <p className="text-sm font-bold">{(50000 - i * 5000)?.toLocaleString()} RWF</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

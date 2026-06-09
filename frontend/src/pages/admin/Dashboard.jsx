import { useState, useEffect } from 'react';
import { Users, ShoppingBag, DollarSign, Package, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];

  const metrics = [
    { icon: DollarSign, label: 'Total Revenue', value: stats.totalRevenue || 0, prefix: 'RWF', color: 'text-green-600 bg-green-50' },
    { icon: Package, label: 'Products', value: stats.totalProducts || 0, color: 'text-blue-600 bg-blue-50' },
    { icon: Users, label: 'Customers', value: stats.totalCustomers || 0, color: 'text-purple-600 bg-purple-50' },
    { icon: ShoppingBag, label: 'Orders', value: stats.totalOrders || 0, color: 'text-blue-600 bg-blue-50' },
  ];

  const statusColor = {
    pending: 'warning', confirmed: 'info', processing: 'primary',
    shipped: 'primary', delivered: 'success', cancelled: 'danger',
  };

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Orders this month</span>
              <span className="text-lg font-bold">{stats.monthOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Revenue this month</span>
              <span className="text-lg font-bold">{(stats.monthRevenue || 0).toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Vendors</span>
              <span className="text-lg font-bold">{stats.totalVendors || 0}</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order._id} to={`/admin/orders`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.orderNumber || `ORD-${order._id?.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-500">{order.userId?.name || 'Unknown'} &middot; {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={statusColor[order.status] || 'default'}>{order.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

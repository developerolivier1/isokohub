import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, DollarSign, TrendingUp, Eye, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportAPI, orderAPI, productAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.getDashboard().catch(() => ({ data: { data: {} } })),
      orderAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: { orders: [] } } })),
    ])
      .then(([statsRes, ordersRes]) => {
        setStats(statsRes.data.data);
        setRecentOrders(ordersRes.data.data?.orders || ordersRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const statCards = [
    { icon: DollarSign, label: 'Total Revenue', value: stats?.revenue || 0, color: 'text-green-600 bg-green-50', prefix: 'RWF' },
    { icon: ShoppingBag, label: 'Total Orders', value: stats?.totalOrders || 0, color: 'text-blue-600 bg-blue-50' },
    { icon: Package, label: 'Products', value: stats?.totalProducts || 0, color: 'text-purple-600 bg-purple-50' },
    { icon: Eye, label: 'Today Views', value: stats?.todayViews || 0, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stat.prefix && <span className="text-sm font-normal text-gray-500 mr-1">{stat.prefix}</span>}
              {stat.value?.toLocaleString?.() || stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order._id} to={`/vendor/orders/${order._id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{order.items?.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{order.total?.toLocaleString()} RWF</p>
                    <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'}>{order.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link to="/vendor/products/add" className="block p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">
              <p className="font-medium text-primary-700">Add New Product</p>
              <p className="text-sm text-primary-600/70">List a new product on your store</p>
            </Link>
            <Link to="/vendor/products" className="block p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
              <p className="font-medium text-purple-700">Manage Inventory</p>
              <p className="text-sm text-purple-600/70">Update stock levels and prices</p>
            </Link>
            <Link to="/vendor/analytics" className="block p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <p className="font-medium text-green-700">View Analytics</p>
              <p className="text-sm text-green-600/70">Check your store performance</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

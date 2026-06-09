import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, Wallet, User, ShoppingBag, Clock, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const statusVariants = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  packed: 'primary', shipped: 'primary', delivered: 'success', cancelled: 'danger', returned: 'default',
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    orderAPI.getAll({ limit: 5 })
      .then(({ data }) => setOrders(data.data?.orders || data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500">Manage your account and orders</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { icon: Package, label: 'My Orders', value: orders.length || 0, to: '/account/orders', color: 'text-blue-600 bg-blue-50' },
          { icon: Heart, label: 'Wishlist', to: '/account/wishlist', color: 'text-red-600 bg-red-50' },
          { icon: Wallet, label: 'Wallet', to: '/account/wallet', color: 'text-green-600 bg-green-50' },
          { icon: User, label: 'Profile', to: '/account/profile', color: 'text-purple-600 bg-purple-50' },
        ].map((item) => (
          <Link key={item.label} to={item.to} className="card p-4 hover:shadow-soft transition-shadow">
            <div className={`p-2.5 rounded-lg w-fit mb-3 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-gray-500">{item.label}</p>
            {item.value !== undefined && <p className="text-xl font-bold text-gray-900">{item.value}</p>}
          </Link>
        ))}
        <button onClick={handleLogout} className="card p-4 hover:shadow-soft transition-shadow text-left">
          <div className="p-2.5 rounded-lg w-fit mb-3 text-red-600 bg-red-50">
            <LogOut className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500">Sign Out</p>
        </button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/account/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No orders yet</p>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order._id} to={`/account/orders/${order._id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Package className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{order.total?.toLocaleString()} RWF</p>
                  <Badge variant={statusVariants[order.status] || 'default'}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

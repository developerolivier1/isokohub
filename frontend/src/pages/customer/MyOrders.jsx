import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Search } from 'lucide-react';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';

const statusVariants = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  packed: 'primary', shipped: 'primary', delivered: 'success', cancelled: 'danger', returned: 'default',
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    orderAPI.getAll({ page, limit: 10, search })
      .then(({ data }) => {
        const result = data.data;
        setOrders(result.orders || result || []);
        setTotalPages(result.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, it will appear here"
        actionLabel="Start Shopping"
        actionTo="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">My Orders</h1>
        <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." className="w-64" />
      </div>

      <Card padding={false}>
        <div className="divide-y">
          {orders.map((order) => (
            <Link key={order._id} to={`/account/orders/${order._id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>{order.items?.length || 0} item(s)</span>
                    <span className="font-medium text-gray-900">{order.total?.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
              <Badge variant={statusVariants[order.status] || 'default'}>{order.status}</Badge>
            </Link>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}

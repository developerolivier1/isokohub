import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const statusVariants = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  packed: 'primary', shipped: 'primary', delivered: 'success', cancelled: 'danger',
};

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    orderAPI.getAll({ page, limit: 10, status: filter || undefined })
      .then(({ data }) => {
        const result = data.data;
        setOrders(result.orders || result || []);
        setTotalPages(result.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
        <div className="flex gap-2">
          {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <EmptyState title="No orders found" description="Orders from customers will appear here" />
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <Link key={order._id} to={`/vendor/orders/${order._id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">{order.items?.length} items - {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.total?.toLocaleString()} RWF</p>
                  <Badge variant={statusVariants[order.status] || 'default'}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}

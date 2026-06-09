import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';

const statusVariants = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  packed: 'primary', shipped: 'primary', delivered: 'success', cancelled: 'danger',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    orderAPI.getAll({ page, limit: 15, status: filter || undefined })
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
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Date'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/admin/orders/${order._id}`} className="font-medium text-primary-600 hover:text-primary-700">
                        #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.userId?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{order.userId?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 font-medium">{order.total?.toLocaleString()} RWF</td>
                    <td className="px-6 py-4"><Badge variant={statusVariants[order.status] || 'default'}>{order.status}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>{order.paymentStatus}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}

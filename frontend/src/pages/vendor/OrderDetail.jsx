import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, CreditCard } from 'lucide-react';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const statusOptions = ['confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function VendorOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = () => {
    orderAPI.getById(id)
      .then(({ data }) => setOrder(data.data?.order || data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleUpdateStatus = async (status) => {
    setUpdating(true);
    try {
      await orderAPI.updateStatus(id, status);
      toast.success(`Order ${status}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  const currentIdx = statusOptions.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link to="/vendor/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</h1>
          <Badge variant="default">{order.status}</Badge>
        </div>
        <div className="flex gap-2">
          {currentIdx >= 0 && currentIdx < statusOptions.length - 1 && (
            <Button onClick={() => handleUpdateStatus(statusOptions[currentIdx + 1])} loading={updating}>
              Mark as {statusOptions[currentIdx + 1]}
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button variant="danger" onClick={() => handleUpdateStatus('cancelled')} loading={updating}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Items</h2>
            <div className="divide-y">
              {(order.items || []).map((item) => (
                <div key={item._id} className="flex items-center gap-4 py-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={item.productId?.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productId?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} x {item.price?.toLocaleString()} RWF</p>
                  </div>
                  <p className="font-bold">{(item.price * item.quantity)?.toLocaleString()} RWF</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {order.shippingAddress && (
            <Card>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" /> Shipping
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" /> Payment
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="capitalize">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>{order.paymentStatus}</Badge></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{order.total?.toLocaleString()} RWF</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

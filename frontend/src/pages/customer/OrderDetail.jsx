import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ChevronLeft, MapPin, CreditCard, Clock } from 'lucide-react';
import { orderAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const statusVariants = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  packed: 'primary', shipped: 'primary', delivered: 'success', cancelled: 'danger', returned: 'default',
};

const statusSteps = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderAPI.getById(id)
      .then(({ data }) => setOrder(data.data?.order || data.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderAPI.cancel(id, 'Cancelled by customer');
      toast.success('Order cancelled');
      const { data } = await orderAPI.getById(id);
      setOrder(data.data?.order || data.data);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" /> {new Date(order.createdAt).toLocaleDateString()}
            <Badge variant={statusVariants[order.status] || 'default'}>{order.status?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        {['pending', 'confirmed'].includes(order.status) && (
          <Button variant="danger" onClick={handleCancel} loading={cancelling}>Cancel Order</Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {statusSteps.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= currentStepIndex ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{i + 1}</div>
            {i < statusSteps.length - 1 && <div className={`w-8 h-1 ${i < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="divide-y">
              {(order.items || []).map((item) => (
                <div key={item._id || item.productId} className="flex items-center gap-4 py-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.productId?.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productId?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">{(item.price * item.quantity)?.toLocaleString()} RWF</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{order.subtotal?.toLocaleString()} RWF</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingFee ? `${order.shippingFee.toLocaleString()} RWF` : 'Free'}</span></div>
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{order.total?.toLocaleString()} RWF</span></div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {order.shippingAddress && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" /> Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                <p>{order.shippingAddress.phone}</p>
              </div>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" /> Payment
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium capitalize">{order.paymentMethod || order.payment?.method}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>{order.paymentStatus}</Badge></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

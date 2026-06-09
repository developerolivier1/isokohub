import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Wallet, Building2, Smartphone, Truck, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, paymentAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const paymentMethods = [
  { id: 'wallet', name: 'Wallet', icon: Wallet, description: 'Pay with ISOKOHUB wallet' },
  { id: 'stripe', name: 'Card Payment', icon: CreditCard, description: 'Visa, Mastercard, Amex' },
  { id: 'mtn', name: 'MTN Mobile Money', icon: Smartphone, description: 'Pay with MoMo' },
  { id: 'airtel', name: 'Airtel Money', icon: Smartphone, description: 'Pay with Airtel Money' },
  { id: 'paypal', name: 'PayPal', icon: Building2, description: 'Pay with PayPal' },
  { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when you receive' },
];

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('shipping');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    province: '',
    notes: '',
  });

  const handlePlaceOrder = async () => {
    if (!paymentMethod) { toast.error('Please select a payment method'); return; }
    setLoading(true);
    try {
      const { data } = await orderAPI.create({
        items: cart.items.map(i => ({
          productId: i.productId?._id || i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        shippingAddress: address,
        paymentMethod,
      });
      if (paymentMethod !== 'cod') {
        await paymentAPI.processPayment(data.data.order?._id, paymentMethod);
      }
      await clearCart();
      toast.success('Order placed successfully!');
      navigate('/account/orders');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items?.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="page-container py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Back to Cart
      </Link>

      <h1 className="text-2xl font-display font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={address.fullName} onChange={(e) => setAddress({...address, fullName: e.target.value})} required />
              <Input label="Phone Number" value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} required />
              <div className="sm:col-span-2">
                <Input label="Street Address" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} required />
              </div>
              <Input label="City" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} required />
              <Input label="Province" value={address.province} onChange={(e) => setAddress({...address, province: e.target.value})} required />
              <div className="sm:col-span-2">
                <Input label="Delivery Notes (optional)" value={address.notes} onChange={(e) => setAddress({...address, notes: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === method.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900">{method.name}</p>
                    <p className="text-xs text-gray-500">{method.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            <div className="space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.productId?._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.productId?.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{item.productId?.name}</p>
                    <p className="text-gray-500">x{item.quantity}</p>
                  </div>
                  <span className="font-medium">{(item.price * item.quantity)?.toLocaleString()} RWF</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{cart.subtotal?.toLocaleString()} RWF</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">Free</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span><span>{cart.total?.toLocaleString()} RWF</span>
              </div>
            </div>
            <Button onClick={handlePlaceOrder} loading={loading} size="lg" className="w-full">
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

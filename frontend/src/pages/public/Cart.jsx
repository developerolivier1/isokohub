import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Cart() {
  const { cart, loading, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="page-container py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your cart"
          description="Please sign in to see items you've added to your cart"
          actionLabel="Sign In"
          actionTo="/auth/login"
        />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="page-container py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet"
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gray-900">Shopping Cart ({itemCount} items)</h1>
        <button onClick={clearCart} className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium">Clear Cart</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
        <div className="flex-1 space-y-3 sm:space-y-4">
          {cart.items.map((item) => (
            <div key={`${item.productId?._id || item.productId}-${item.variantId || ''}`} className="bg-white rounded-xl shadow-sm flex gap-3 sm:gap-4 p-3 sm:p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.productId?.images?.[0]?.url || item.productId?.images?.[0] || '/placeholder.svg'}
                  alt={item.productId?.name || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId?._id}`} className="text-sm sm:text-base font-medium text-gray-900 hover:text-primary-600 line-clamp-1">
                  {item.productId?.name || 'Product'}
                </Link>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{item.productId?.category?.name || ''}</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 sm:mt-2">{item.price?.toLocaleString()} RWF</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.productId?._id, item.variantId)} className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <div className="flex items-center border rounded-lg">
                  <button onClick={() => updateQuantity(item.productId?._id, Math.max(1, item.quantity - 1), item.variantId)} className="p-1 sm:p-1.5 hover:bg-gray-50"><Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></button>
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId?._id, item.quantity + 1, item.variantId)} className="p-1 sm:p-1.5 hover:bg-gray-50"><Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-80 xl:w-96">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-3 sm:space-y-4 lg:sticky lg:top-24">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Order Summary</h2>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{cart.subtotal?.toLocaleString()} RWF</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">Free</span></div>
              {cart.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-600">-{cart.discount?.toLocaleString()} RWF</span></div>}
              <div className="border-t pt-2 flex justify-between font-semibold text-base sm:text-lg">
                <span>Total</span><span>{cart.total?.toLocaleString()} RWF</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button size="lg" className="w-full text-sm">Proceed to Checkout</Button>
            </Link>
            <Link to="/products" className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-primary-600">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { wishlistAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const fetchWishlist = () => {
    wishlistAPI.getWishlist()
      .then(({ data }) => setItems(data.data?.wishlist?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (productId, variantId) => {
    try {
      await wishlistAPI.removeItem(productId, variantId);
      setItems(prev => prev.filter(i => (i.productId?._id || i.productId) !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed to remove'); }
  };

  const handleAddToCart = async (item) => {
    try {
      await addItem({ productId: item.productId?._id || item.productId, quantity: 1, price: item.price });
      toast.success('Added to cart');
    } catch { toast.error('Failed to add'); }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Save items you love to your wishlist"
        actionLabel="Browse Products"
        actionTo="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const product = item.productId || {};
          return (
            <div key={item._id} className="card p-4">
              <div className="flex gap-4">
                <Link to={`/products/${product._id}`} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product._id}`} className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2">{product.name}</Link>
                  <p className="text-lg font-bold text-gray-900 mt-1">{item.price?.toLocaleString()} RWF</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => handleAddToCart(item)} className="btn-primary btn-sm flex-1">
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <button onClick={() => handleRemove(product._id, item.variantId)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

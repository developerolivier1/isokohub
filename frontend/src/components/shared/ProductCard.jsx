import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    setAdding(true);
    try {
      await addItem({ productId: product._id, quantity: 1, price: product.price });
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const imageUrl = product?.images?.[0]?.url || product?.images?.[0] || '/placeholder.svg';
  const avgRating = product?.ratings?.average || product?.averageRating || 0;
  const reviewCount = product?.ratings?.count || product?.reviewCount || 0;
  const discount = product?.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  return (
    <div className="bg-white p-2 xs:p-2.5 sm:p-3 md:p-4">
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-square bg-white overflow-hidden mb-1 sm:mb-2 md:mb-3">
          <img
            src={imgError ? '/placeholder.svg' : imageUrl}
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
        <h3 className="text-[11px] xs:text-xs sm:text-sm text-gray-800 hover:text-blue-600 line-clamp-2 mb-0.5 sm:mb-1 leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < Math.round(avgRating) ? 'fill-blue-400 text-blue-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500">{reviewCount > 0 ? reviewCount : ''}</span>
        </div>
        <div className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">RWF</div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
            {product.price?.toLocaleString().replace(/,/g, ',')}
          </span>
          {discount > 0 && (
            <span className="text-[10px] sm:text-xs text-gray-500 line-through">
              {product.compareAtPrice?.toLocaleString()}
            </span>
          )}
        </div>
        {discount > 0 && (
          <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">List Price: <span className="line-through">{product.compareAtPrice?.toLocaleString()}</span></p>
        )}
      </Link>
      <button
        onClick={handleAddToCart}
        disabled={adding}
        className="w-full mt-1.5 sm:mt-2 md:mt-3 bg-blue-500 hover:bg-blue-600 text-white text-[11px] xs:text-xs py-1 sm:py-1.5 rounded-full font-medium transition-colors disabled:opacity-50"
      >
        Add to Cart
      </button>
    </div>
  );
}

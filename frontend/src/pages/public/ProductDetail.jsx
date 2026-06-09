import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Share2, Star, Minus, Plus, ChevronLeft, Truck, Shield } from 'lucide-react';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ReviewStars from '../../components/shared/ReviewStars';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    productAPI.getById(id)
      .then(({ data }) => {
        setProduct(data.data?.product || data.data);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>;

  const images = product.images?.map(i => i.url || i) || ['/placeholder.svg'];
  const discount = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in first'); return; }
    setAdding(true);
    try {
      await addItem({ productId: product._id, quantity, price: product.price });
      toast.success('Added to cart');
    } catch { toast.error('Failed to add'); }
    finally { setAdding(false); }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <nav className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-primary-600 shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <Link to="/products" className="hover:text-primary-600 shrink-0">Products</Link>
        <span className="shrink-0">/</span>
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-12">
        <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
          <div className="aspect-square bg-gray-100 rounded-xl sm:rounded-2xl overflow-hidden">
            <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-primary-600' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/2">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-primary-600 font-medium mb-0.5 sm:mb-1">{product.category?.name || product.category || 'General'}</p>
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900 leading-tight">{product.name}</h1>
            </div>
            <button className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <ReviewStars rating={product.ratings?.average || 0} count={product.ratings?.count || 0} size="sm" />
          </div>

          <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
            <span className="text-2xl xs:text-3xl font-bold text-gray-900">{product.price?.toLocaleString()} RWF</span>
            {discount > 0 && (
              <>
                <span className="text-sm sm:text-lg text-gray-400 line-through">{product.compareAtPrice?.toLocaleString()} RWF</span>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">{product.description}</p>
          )}

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center border rounded-lg self-start xs:self-auto">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 sm:p-2.5 hover:bg-gray-50"><Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
              <span className="px-3 sm:px-4 py-2 sm:py-2.5 font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center text-sm sm:text-base">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 sm:p-2.5 hover:bg-gray-50"><Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></button>
            </div>
            <Button onClick={handleAddToCart} loading={adding} size="lg" className="flex-1 text-sm">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" /> Add to Cart
            </Button>
          </div>

          {product.variants?.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Variants</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.variants.map((v, i) => (
                  <button key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm hover:border-primary-600 hover:text-primary-600 transition-colors">{v.name || v}</button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 sm:pt-6 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 shrink-0" />
              <span>Free delivery on orders over 50,000 RWF</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 shrink-0" />
              <span>Secure payment - Pay with MTN, Airtel, Card or Wallet</span>
            </div>
          </div>

          {product.vendor && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <p className="text-xs sm:text-sm text-gray-500">Sold by</p>
              <Link to={`/vendors/${product.vendor._id}`} className="font-medium text-gray-900 hover:text-primary-600 text-sm sm:text-base">{product.vendor.storeName || product.vendor.name}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="page-container py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-primary-600' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-primary-600 font-medium mb-1">{product.category?.name || product.category || 'General'}</p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">{product.name}</h1>
            </div>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <ReviewStars rating={product.ratings?.average || 0} count={product.ratings?.count || 0} size="md" />
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">{product.price?.toLocaleString()} RWF</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{product.compareAtPrice?.toLocaleString()} RWF</span>
                <Badge variant="danger">-{discount}%</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-gray-50"><Minus className="h-4 w-4" /></button>
              <span className="px-4 py-2.5 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-gray-50"><Plus className="h-4 w-4" /></button>
            </div>
            <Button onClick={handleAddToCart} loading={adding} size="lg" className="flex-1">
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
          </div>

          {product.variants?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Variants</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button key={i} className="px-4 py-2 border rounded-lg text-sm hover:border-primary-600 hover:text-primary-600 transition-colors">{v.name || v}</button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="h-5 w-5 text-primary-600" />
              <span>Free delivery on orders over 50,000 RWF</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-primary-600" />
              <span>Secure payment - Pay with MTN, Airtel, Card or Wallet</span>
            </div>
          </div>

          {product.vendor && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Sold by</p>
              <Link to={`/vendors/${product.vendor._id}`} className="font-medium text-gray-900 hover:text-primary-600">{product.vendor.storeName || product.vendor.name}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

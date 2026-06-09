import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Star, MapPin, Package } from 'lucide-react';
import { vendorAPI, productAPI } from '../../services/api';
import ProductCard from '../../components/shared/ProductCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function VendorStorefront() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vendorAPI.getById(id),
      productAPI.getAll({ vendor: id }),
    ])
      .then(([vendorRes, productRes]) => {
        setVendor(vendorRes.data.data?.vendor || vendorRes.data.data);
        setProducts(productRes.data.data?.products || productRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!vendor) return <div className="text-center py-20 text-gray-500">Vendor not found</div>;

  return (
    <div className="page-container py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <span className="text-gray-900">{vendor.storeName}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <Store className="h-10 w-10 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">{vendor.storeName}</h1>
            <p className="text-gray-600 mb-3">{vendor.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {vendor.ratings?.average > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-blue-400 text-blue-400" /> {vendor.ratings.average.toFixed(1)} ({vendor.ratings.count})</span>
              )}
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {vendor.address?.city}, {vendor.address?.country}</span>
              <span className="flex items-center gap-1"><Package className="h-4 w-4 text-gray-400" /> {vendor.productCount || products.length} products</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Products</h2>
      {products.length === 0 ? (
        <p className="text-gray-500">No products from this vendor yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

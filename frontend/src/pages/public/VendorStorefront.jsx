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
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <nav className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-primary-600 shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <span className="text-gray-900 truncate">{vendor.storeName}</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col xs:flex-row items-start gap-4 xs:gap-6">
          <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
            <Store className="h-7 w-7 xs:h-8 xs:w-8 sm:h-10 sm:w-10 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl xs:text-2xl font-display font-bold text-gray-900 mb-1">{vendor.storeName}</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{vendor.description}</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              {vendor.ratings?.average > 0 && (
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-blue-400 text-blue-400" /> {vendor.ratings.average.toFixed(1)} ({vendor.ratings.count})</span>
              )}
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" /> {vendor.address?.city}, {vendor.address?.country}</span>
              <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" /> {vendor.productCount || products.length} products</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg xs:text-xl font-display font-bold text-gray-900 mb-3 sm:mb-4">Products</h2>
      {products.length === 0 ? (
        <p className="text-sm sm:text-base text-gray-500">No products from this vendor yet.</p>
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

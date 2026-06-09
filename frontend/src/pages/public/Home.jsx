import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import ProductCard from '../../components/shared/ProductCard';
import HeroSlider from '../../components/layout/HeroSlider';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const categories = [
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80', slug: 'electronics' },
  { name: 'Smartphones', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80', slug: 'smartphones' },
  { name: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80', slug: 'laptops' },
  { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80', slug: 'clothing-fashion' },
  { name: 'Home & Living', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80', slug: 'home-living' },
  { name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80', slug: 'beauty' },
];

const deals = [
  { title: 'Up to 50% off', subtitle: 'Electronics', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&q=80', link: '/products?category=electronics' },
  { title: 'Starting at 15,000 RWF', subtitle: 'Fashion finds', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80', link: '/products?category=clothing-fashion' },
  { title: 'Great savings', subtitle: 'Home decor', image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=300&q=80', link: '/products?category=home-living' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getFeatured()
      .then(({ data }) => {
        const products = data.data?.products || data.data || [];
        setFeatured(Array.isArray(products) ? products : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <HeroSlider />

      <div className="max-w-[1500px] mx-auto px-2 sm:px-4 -mt-4 xs:-mt-6 sm:-mt-12 md:-mt-16 lg:-mt-24 relative z-10">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
          {deals.map((deal) => (
            <Link key={deal.title} to={deal.link} className="bg-white p-3 xs:p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">{deal.title}</h3>
              <p className="text-[11px] xs:text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{deal.subtitle}</p>
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img src={deal.image} alt={deal.subtitle} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <p className="text-[11px] xs:text-xs sm:text-sm text-primary-600 hover:text-blue-600 mt-1 sm:mt-2 font-medium">Shop now</p>
            </Link>
          ))}
          <div className="bg-white p-3 xs:p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm xs:text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Sign in for the best experience</h3>
            <Link to="/auth/login" className="block w-full bg-blue-500 hover:bg-blue-600 text-center text-white text-[11px] xs:text-xs py-1.5 sm:py-2 rounded-full font-medium mb-2 sm:mb-4">
              Sign in securely
            </Link>
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80" alt="Shopping" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 sm:py-12"><LoadingSpinner size="lg" /></div>
        ) : featured.length > 0 ? (
          <div className="bg-white shadow-sm mb-4 sm:mb-6 p-3 xs:p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
              <Link to="/products?featured=true" className="text-[11px] xs:text-xs sm:text-sm md:text-base text-primary-600 hover:text-blue-600 font-medium">
                See all offers
              </Link>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 sm:gap-2">
              {featured.slice(0, 12).map((product) => (
                <div key={product._id} className="border border-gray-200 hover:border-gray-400 transition-colors">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && (
          <div className="bg-white shadow-sm mb-4 sm:mb-6 p-3 xs:p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
              <Link to="/products" className="text-[11px] xs:text-xs sm:text-sm md:text-base text-primary-600 hover:text-blue-600 font-medium">
                Shop all
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
              {categories.map((cat) => (
                <Link key={cat.name} to={`/products?category=${cat.slug}`} className="group text-center">
                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-sm mb-1 sm:mb-2">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <p className="text-[11px] xs:text-xs sm:text-sm text-gray-800 hover:text-blue-600">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t mt-4 sm:mt-6">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-4 py-6 sm:py-8 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">See personalized recommendations</p>
          <Link to="/auth/login" className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-xs px-12 sm:px-16 py-2 rounded-full font-medium">
            Sign in
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            New customer? <Link to="/auth/register" className="text-primary-600 hover:text-blue-600">Start here.</Link>
          </p>
        </div>
      </div>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="block w-full bg-[#1e293b] hover:bg-[#334155] text-white text-center text-xs py-3 sm:py-3.5 font-medium transition-colors">
        Back to top
      </button>
    </div>
  );
}

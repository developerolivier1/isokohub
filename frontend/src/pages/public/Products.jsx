import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, List, X } from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import ProductCard from '../../components/shared/ProductCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data?.categories || data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20, sort };
    if (activeCategory) params.category = activeCategory;
    if (searchQuery) params.search = searchQuery;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    productAPI.getAll(params)
      .then(({ data }) => {
        const result = data.data;
        setProducts(result.products || result || []);
        setTotalPages(result.pagination?.totalPages || result.totalPages || 1);
        setTotal(result.pagination?.total || result.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, sort, activeCategory, searchQuery, minPrice, maxPrice]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-lg xs:text-xl sm:text-2xl font-display font-bold text-gray-900">
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory : 'All Products'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">{total} products found</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn-ghost btn-sm flex items-center gap-1.5 lg:hidden text-xs sm:text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Filters
          </button>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input-field py-1.5 text-sm w-auto">
            <option value="-createdAt">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-ratings.average">Top Rated</option>
            <option value="-sold">Best Selling</option>
          </select>
          <div className="hidden sm:flex border rounded-lg">
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`${filtersOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} lg:block lg:relative lg:w-64 flex-shrink-0`}>
          <div className={`${filtersOpen ? 'bg-white p-6 w-80 h-full overflow-y-auto' : 'bg-white p-4 rounded-xl border'} ${!filtersOpen && 'lg:sticky lg:top-24'}`}>
            {filtersOpen && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setFiltersOpen(false)}><X className="h-5 w-5" /></button>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-3">Categories</h4>
                <div className="space-y-1">
                  <button onClick={() => updateParam('category', '')} className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${!activeCategory ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>All Categories</button>
                  {categories.map((cat) => (
                    <button key={cat._id} onClick={() => updateParam('category', cat.name || cat.slug)} className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${activeCategory === (cat.name || cat.slug) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} className="input-field py-1.5 text-sm w-full" />
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="input-field py-1.5 text-sm w-full" />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
               <div className={view === 'grid'
                ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-6'
                : 'space-y-4'
              }>
                {products.map((product) => (
                  view === 'grid' ? <ProductCard key={product._id} product={product} />
                    : <div key={product._id} className="card flex gap-4 p-4">{product.name}</div>
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

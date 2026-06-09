import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { productAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll({ page, limit: 15, search })
      .then(({ data }) => {
        const result = data.data;
        setProducts(result.products || result || []);
        setTotalPages(result.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Products</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="max-w-md" />

      <Card padding={false}>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={product.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || product.category}</td>
                    <td className="px-6 py-4 font-medium">{product.price?.toLocaleString()} RWF</td>
                    <td className="px-6 py-4">
                      <Badge variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>{product.stock || 0}</Badge>
                    </td>
                    <td className="px-6 py-4"><Badge variant={product.status === 'active' ? 'success' : 'default'}>{product.status}</Badge></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/products/${product._id}`} className="p-1.5 text-gray-400 hover:text-primary-600"><Eye className="h-4 w-4" /></Link>
                        <button onClick={() => handleDelete(product._id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}

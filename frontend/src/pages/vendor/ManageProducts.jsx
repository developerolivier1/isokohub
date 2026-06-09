import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { productAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import DataTable from '../../components/ui/DataTable';
import toast from 'react-hot-toast';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll({ page, limit: 10, search, vendor: 'mine' })
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

  const columns = [
    {
      key: 'name', label: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img src={row.images?.[0]?.url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.category?.name || row.category}</p>
          </div>
        </div>
      ),
    },
    { key: 'price', label: 'Price', render: (row) => `${row.price?.toLocaleString()} RWF` },
    {
      key: 'stock', label: 'Stock',
      render: (row) => (
        <Badge variant={row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'}>
          {row.stock || 0}
        </Badge>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'default'}>{row.status}</Badge>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/products/${row._id}`} className="p-1.5 text-gray-400 hover:text-primary-600"><Eye className="h-4 w-4" /></Link>
          <Link to={`/vendor/products/${row._id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></Link>
          <button onClick={() => handleDelete(row._id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500">{products.length} products</p>
        </div>
        <Link to="/vendor/products/add">
          <Button><Plus className="h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="max-w-md" />

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No products yet. Start by adding your first product."
        />
      </Card>
    </div>
  );
}

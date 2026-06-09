import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', compareAtPrice: '',
    category: '', stock: '', sku: '', tags: '', status: 'active',
  });

  useEffect(() => {
    Promise.all([
      productAPI.getById(id),
      categoryAPI.getAll(),
    ])
      .then(([productRes, catRes]) => {
        const product = productRes.data.data?.product || productRes.data.data;
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          compareAtPrice: product.compareAtPrice || '',
          category: product.category?._id || product.category || '',
          stock: product.stock || '',
          sku: product.sku || '',
          tags: (product.tags || []).join(', '),
          status: product.status || 'active',
        });
        setCategories(catRes.data.data?.categories || catRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productAPI.update(id, {
        ...form,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        stock: parseInt(form.stock),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Product updated');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input label="Product Name" name="name" value={form.name} onChange={handleChange} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (RWF)" name="price" type="number" value={form.price} onChange={handleChange} required />
              <Input label="Compare at Price" name="compareAtPrice" type="number" value={form.compareAtPrice} onChange={handleChange} />
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} />
            <Input label="SKU" name="sku" value={form.sku} onChange={handleChange} />
            <Input label="Tags" name="tags" value={form.tags} onChange={handleChange} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </Card>
        <div className="flex gap-3">
          <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Update Product</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/vendor/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

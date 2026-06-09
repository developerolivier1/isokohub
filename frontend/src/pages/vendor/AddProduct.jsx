import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { productAPI, categoryAPI, uploadAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';

export default function AddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', compareAtPrice: '', category: '',
    stock: '', sku: '', tags: '',
  });

  useEffect(() => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.data?.categories || data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productAPI.create({
        ...form,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        stock: parseInt(form.stock),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Product created');
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-500">List a new product on your store</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input label="Product Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Wireless Bluetooth Headphones" />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="input-field" placeholder="Describe your product..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (RWF)" name="price" type="number" value={form.price} onChange={handleChange} required placeholder="25000" />
              <Input label="Compare at Price (RWF)" name="compareAtPrice" type="number" value={form.compareAtPrice} onChange={handleChange} placeholder="30000" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field" required>
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="Stock Quantity" name="stock" type="number" value={form.stock} onChange={handleChange} required placeholder="100" />
            <Input label="SKU" name="sku" value={form.sku} onChange={handleChange} placeholder="PROD-001" />
            <Input label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="wireless, bluetooth, audio" />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
          <FileUpload
            onUpload={async (file) => {
              try {
                const { data } = await uploadAPI.uploadSingle(file);
                toast.success('Image uploaded');
              } catch { toast.error('Upload failed'); }
            }}
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} size="lg"><Save className="h-4 w-4" /> Save Product</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/vendor/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import { categoryAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    categoryAPI.getAll()
      .then(({ data }) => setCategories(data.data?.categories || data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await categoryAPI.update(editing._id, form);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete');
    }
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Categories</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat._id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 rounded-lg">
                  <Layers className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500">{cat.productCount || 0} products</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="input-field" />
          </div>
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update' : 'Create'} Category</Button>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Tag, Percent, Calendar, Check, X } from 'lucide-react';
import { couponAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [validateCode, setValidateCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', maxUses: '', expiresAt: '',
  });

  useEffect(() => {
    couponAPI.getAll()
      .then(({ data }) => setCoupons(data.data?.coupons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await couponAPI.create({
        ...form,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxUses: parseInt(form.maxUses) || null,
      });
      setCoupons(prev => [...prev, data.data.coupon]);
      setShowModal(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
      toast.success('Coupon created');
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to create coupon');
    }
  };

  const handleValidate = async () => {
    if (!validateCode.trim()) return;
    try {
      const { data } = await couponAPI.validate(validateCode.toUpperCase(), 10000);
      setValidationResult(data.data);
    } catch (e) {
      setValidationResult({ valid: false, reason: 'Coupon not found or invalid' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4 mr-1" /> New Coupon</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {coupons.length === 0 ? (
            <Card><p className="text-gray-500 text-center py-8">No coupons created yet</p></Card>
          ) : (
            coupons.map(coupon => (
              <Card key={coupon._id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-primary-50">
                      <Tag className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-gray-900">{coupon.code}</span>
                        <Badge variant={coupon.isActive ? 'success' : 'default'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% off`
                          : `RWF ${coupon.discountValue?.toLocaleString()} off`}
                        {coupon.minOrderAmount > 0 && ` • Min: RWF ${coupon.minOrderAmount?.toLocaleString()}`}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Uses: {coupon.currentUses || 0}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</span>
                        {coupon.expiresAt && <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Validate Coupon</h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter coupon code"
                value={validateCode}
                onChange={e => setValidateCode(e.target.value)}
                icon={Tag}
              />
              <Button className="w-full" onClick={handleValidate} disabled={!validateCode.trim()}>
                Validate
              </Button>
              {validationResult && (
                <div className={`p-3 rounded-lg text-sm ${validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span className="font-medium">
                      {validationResult.valid ? `Valid! Discount: RWF ${validationResult.discount?.toLocaleString()}` : validationResult.reason}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Coupon">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Coupon Code" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" required />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Discount Type</label>
              <select
                value={form.discountType}
                onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                className="input-field"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder="20" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Order Amount" type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="0" />
            <Input label="Max Uses" type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

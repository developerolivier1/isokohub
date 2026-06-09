import { useState, useEffect } from 'react';
import { Save, Globe, Shield, Mail, Bell } from 'lucide-react';
import { tenantAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'ISOKOHUB',
    supportEmail: 'support@isokohub.com',
    defaultCurrency: 'RWF',
    taxPercentage: '18',
    platformCommission: '5',
    defaultLanguage: 'en',
  });

  useEffect(() => {
    tenantAPI.getSettings()
      .then(({ data }) => {
        const s = data.data?.settings || data.data || {};
        setSettings(prev => ({ ...prev, ...s }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantAPI.updateSetting(settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-600" /> General
        </h2>
        <div className="space-y-4">
          <Input label="Site Name" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} />
          <Input label="Support Email" type="email" value={settings.supportEmail} onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Default Currency</label>
              <select value={settings.defaultCurrency} onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})} className="input-field">
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Default Language</label>
              <select value={settings.defaultLanguage} onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})} className="input-field">
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
                <option value="fr">French</option>
                <option value="sw">Swahili</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary-600" /> Platform Fees
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tax Percentage (%)" type="number" value={settings.taxPercentage} onChange={(e) => setSettings({...settings, taxPercentage: e.target.value})} />
          <Input label="Platform Commission (%)" type="number" value={settings.platformCommission} onChange={(e) => setSettings({...settings, platformCommission: e.target.value})} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary-600" /> Notifications
        </h2>
        <div className="space-y-3">
          {[
            { label: 'New order notifications', key: 'orderNotifications' },
            { label: 'New vendor registration', key: 'vendorNotifications' },
            { label: 'Payment notifications', key: 'paymentNotifications' },
            { label: 'System alerts', key: 'systemAlerts' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} loading={saving} size="lg">
        <Save className="h-4 w-4" /> Save Settings
      </Button>
    </div>
  );
}

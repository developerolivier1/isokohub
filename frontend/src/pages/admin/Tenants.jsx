import { useState, useEffect } from 'react';
import { Store, Search, MoreVertical, Check, X } from 'lucide-react';
import { tenantAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    tenantAPI.getTenant() // This is a simplified endpoint - full tenant list would need a superadmin endpoint
      .then(({ data }) => {
        const result = data.data;
        setTenants(result.tenants || result || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Tenants</h1>
        <Button>Add Tenant</Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search tenants..." className="max-w-md" />

      <Card padding={false}>
        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tenants found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Tenant', 'Plan', 'Status', 'Vendors', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg"><Store className="h-5 w-5 text-primary-600" /></div>
                        <div>
                          <p className="font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-sm text-gray-500">{tenant.domain || tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge variant="primary">{tenant.plan || tenant.subscription?.plan}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={tenant.status === 'active' ? 'success' : 'danger'}>{tenant.status}</Badge></td>
                    <td className="px-6 py-4">{tenant.vendorCount || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600"><MoreVertical className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

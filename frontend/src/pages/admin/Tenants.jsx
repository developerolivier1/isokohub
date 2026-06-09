import { useState, useEffect } from 'react';
import { Store, Globe, Calendar, Shield, Users, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tenantAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Tenants() {
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tenantAPI.getTenant(),
      tenantAPI.getStats().catch(() => ({ data: { data: {} } })),
    ])
      .then(([tenantRes, statsRes]) => {
        setTenant(tenantRes.data.data?.tenant || tenantRes.data.data);
        setStats(statsRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (!tenant) return <div className="text-center py-12"><p className="text-gray-500">Tenant not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Tenant</h1>
        <Link to="/auth/register">
          <Button variant="outline">Register New Tenant</Button>
        </Link>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-50 rounded-xl"><Building2 className="h-8 w-8 text-primary-600" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{tenant.name}</h2>
              <Badge variant={tenant.isActive === false ? 'danger' : 'success'}>{tenant.isActive === false ? 'Inactive' : 'Active'}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Slug:</span> {tenant.slug}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Plan:</span> {tenant.plan || tenant.subscription?.plan || 'N/A'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Created:</span> {new Date(tenant.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Vendors:</span> {stats?.totalVendors || 0}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500 mb-1">Products</p>
          <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Orders</p>
          <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString?.() || 0} RWF</p>
        </Card>
      </div>
    </div>
  );
}

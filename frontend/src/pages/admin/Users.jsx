import { useState, useEffect } from 'react';
import { Users as UsersIcon, MoreVertical, Shield } from 'lucide-react';
import { authAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';

const roleVariants = {
  customer: 'default',
  vendor: 'primary',
  tenant_admin: 'purple',
  superadmin: 'danger',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // This would need a proper admin users endpoint
    authAPI.getMe()
      .then(({ data }) => {
        setUsers(data.data?.users || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Users</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="max-w-md" />

      <Card padding={false}>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">{user.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4"><Badge variant={roleVariants[user.role] || 'default'}>{user.role}</Badge></td>
                    <td className="px-6 py-4"><Badge variant={user.isActive === false ? 'danger' : 'success'}>{user.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
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

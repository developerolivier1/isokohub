import { useState, useEffect, useCallback } from 'react';
import { Users as UsersIcon, Shield } from 'lucide-react';
import { usersAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search.trim()) params.search = search.trim();
    usersAPI.getAll(params)
      .then(({ data }) => {
        setUsers(data.data?.users || []);
        setTotalPages(data.data?.pagination?.total ? Math.ceil(data.data.pagination.total / 15) : 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = (userId, currentStatus) => {
    setActionLoading(userId);
    usersAPI.updateStatus(userId, !currentStatus)
      .then(() => fetchUsers())
      .catch(() => {})
      .finally(() => setActionLoading(null));
  };

  const handleRoleChange = (userId, role) => {
    setActionLoading(userId);
    usersAPI.updateRole(userId, role)
      .then(() => fetchUsers())
      .catch(() => {})
      .finally(() => setActionLoading(null));
  };

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
                      <div className="flex items-center gap-1">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={user.role === 'superadmin'}
                          className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white disabled:opacity-50"
                        >
                          {['customer', 'vendor', 'delivery_driver', 'support'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          disabled={user.role === 'superadmin' || actionLoading === user._id}
                          className={`p-1.5 rounded text-xs font-medium ${user.isActive === false ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'} disabled:opacity-50`}
                        >
                          {user.isActive === false ? 'Activate' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}

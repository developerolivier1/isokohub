import { useState } from 'react';
import { User, Mail, Phone, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.data?.user || data.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Profile</h1>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input label="Full Name" icon={User} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          <Input label="Email" type="email" icon={Mail} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
          <Input label="Phone" type="tel" icon={Phone} value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
          <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save Changes</Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} required />
          <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} required />
          <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required />
          <Button type="submit" loading={savingPassword}>Update Password</Button>
        </form>
      </Card>
    </div>
  );
}

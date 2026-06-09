import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError('');
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      if (user.role === 'vendor') navigate('/vendor');
      else if (['tenant_admin', 'superadmin'].includes(user.role)) navigate('/admin');
      else navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Create account</h2>
      <p className="text-gray-500 mb-8">Join ISOKOHUB as a buyer or seller</p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" icon={User} error={fieldErrors.name} required />
        <Input label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" icon={Mail} error={fieldErrors.email} required />
        <Input label="Phone Number" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+250 7XX XXX XXX" icon={Phone} error={fieldErrors.phone} required />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        <Input label="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" icon={Lock} error={fieldErrors.confirmPassword} required />

        <Button type="submit" loading={loading} className="w-full">Create Account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
      </p>
    </div>
  );
}

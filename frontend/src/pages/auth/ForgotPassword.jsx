import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="bg-green-50 text-green-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-green-600">We've sent a password reset link to <strong>{email}</strong></p>
        </div>
        <Link to="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>

      <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Reset password</h2>
      <p className="text-gray-500 mb-8">Enter your email and we'll send you a reset link</p>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" icon={Mail} required />
        <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
      </form>
    </div>
  );
}

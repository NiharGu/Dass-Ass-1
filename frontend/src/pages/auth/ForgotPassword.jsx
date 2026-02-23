import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If an account exists, a reset link has been sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-gray-50 rounded p-8 shadow shadow -200 border border-gray-200 border">
        <h1 className="text-xl font-bold text-black text-center mb-2">Reset Password</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Enter your email to receive a reset link.
        </p>

        {sent ? (
          <div className="text-center">
            <p className="text-black mb-4">Check your email for the reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5  ">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-black font-medium hover:text-gray-600 ">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

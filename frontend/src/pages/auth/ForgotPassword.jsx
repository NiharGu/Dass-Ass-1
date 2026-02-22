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
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e14] px-4">
      <div className="w-full max-w-md bg-[#12141d] rounded-2xl p-8 shadow-2xl shadow-black/40 border border-[#1e2030]">
        <h1 className="text-xl font-bold text-white text-center mb-2">Reset Password</h1>
        <p className="text-[#6b7394] text-center mb-8 text-sm">
          Enter your email to receive a reset link.
        </p>

        {sent ? (
          <div className="text-center">
            <p className="text-[#34d399] mb-4">Check your email for the reset link.</p>
            <Link to="/login" className="text-[#818cf8] hover:text-[#a5b4fc] text-sm transition">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#6b7394]">
          <Link to="/login" className="text-[#818cf8] hover:text-[#a5b4fc] transition">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

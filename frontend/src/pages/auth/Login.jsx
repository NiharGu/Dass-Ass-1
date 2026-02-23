import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getCaptchaToken = () => {
    return new Promise((resolve) => {
      if (window.grecaptcha && window.grecaptcha.execute) {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' }).then(resolve);
      } else {
        resolve(null);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken();
      const user = await login(email, password, captchaToken);
      toast.success('Login successful!');
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'organizer') navigate('/organizer/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold  text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-black font-medium">f</span>elicity
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Event Management Platform</p>
        </div>

        <div className="bg-gray-50 rounded p-8 border border-gray-200 border shadow shadow -200">
          <h2 className="text-xl font-semibold text-black mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5  ">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5  ">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p><Link to="/forgot-password" className="text-black font-medium hover:text-gray-600 ">Forgot password?</Link></p>
            <p className="text-gray-500">No account? <Link to="/register" className="text-black font-medium hover:text-gray-600 ">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

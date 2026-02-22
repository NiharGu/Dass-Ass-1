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
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e14] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-[#818cf8]">f</span>elicity
          </h1>
          <p className="text-[#6b7394] mt-2 text-sm">Event Management Platform</p>
        </div>

        <div className="bg-[#12141d] rounded-2xl p-8 border border-[#1e2030] shadow-2xl shadow-black/40">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-[#6b7394] text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30"
                placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p><Link to="/forgot-password" className="text-[#818cf8] hover:text-[#a5b4fc] transition">Forgot password?</Link></p>
            <p className="text-[#6b7394]">No account? <Link to="/register" className="text-[#818cf8] hover:text-[#a5b4fc] transition">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

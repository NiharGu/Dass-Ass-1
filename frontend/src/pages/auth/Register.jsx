import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    participantType: 'iiit', collegeOrOrgName: '', contactNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const getCaptchaToken = () => {
    return new Promise((resolve) => {
      if (window.grecaptcha && window.grecaptcha.execute) {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'register' }).then(resolve);
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
      await register({ ...form, captchaToken });
      toast.success('Registration successful!');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30";
  const labelClass = "block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0e14] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-[#818cf8]">f</span>elicity
          </h1>
          <p className="text-[#6b7394] mt-2 text-sm">Create your participant account</p>
        </div>

        <div className="bg-[#12141d] rounded-2xl p-8 border border-[#1e2030] shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input type="text" required value={form.firstName} onChange={set('firstName')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input type="text" required value={form.lastName} onChange={set('lastName')} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Participant Type</label>
              <select value={form.participantType} onChange={set('participantType')} className={inputClass}>
                <option value="iiit">IIIT Student</option>
                <option value="non-iiit">Non-IIIT Participant</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder={form.participantType === 'iiit' ? 'yourname@iiit.ac.in' : 'you@example.com'}
                className={inputClass} />
              {form.participantType === 'iiit' && (
                <p className="text-xs text-[#3d4162] mt-1">Must use IIIT-issued email ID</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input type="password" required value={form.password} onChange={set('password')} minLength={6}
                className={inputClass} placeholder="Min 6 characters" />
            </div>

            {form.participantType !== 'iiit' && (
              <div>
                <label className={labelClass}>College / Organization</label>
                <input type="text" required value={form.collegeOrOrgName} onChange={set('collegeOrOrgName')} className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass}>Contact Number</label>
              <input type="tel" required value={form.contactNumber} onChange={set('contactNumber')}
                pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number"
                title="Must be exactly 10 digits"
                className={inputClass} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7394]">
            Already have an account? <Link to="/login" className="text-[#818cf8] hover:text-[#a5b4fc] transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

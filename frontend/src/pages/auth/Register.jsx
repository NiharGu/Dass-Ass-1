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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5  ";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold  text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-black font-medium">f</span>elicity
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Create your participant account</p>
        </div>

        <div className="bg-gray-50 rounded p-8 border border-gray-200 border shadow shadow -200">
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
                <p className="text-xs text-gray-400 mt-1">Must use IIIT-issued email ID</p>
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
              className="w-full py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-black font-medium hover:text-gray-600 ">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    participantType: 'iiit', collegeOrOrgName: '', contactNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful!');
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Create Account</h1>
        <p className="text-gray-400 text-center mb-8">Register as a participant</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">First Name</label>
              <input type="text" required value={form.firstName} onChange={set('firstName')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Last Name</label>
              <input type="text" required value={form.lastName} onChange={set('lastName')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Participant Type</label>
            <select value={form.participantType} onChange={set('participantType')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="iiit">IIIT Student</option>
              <option value="non-iiit">Non-IIIT Participant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={set('email')}
              placeholder={form.participantType === 'iiit' ? 'yourname@iiit.ac.in' : 'you@example.com'}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {form.participantType === 'iiit' && (
              <p className="text-xs text-gray-500 mt-1">Must use IIIT-issued email ID</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={set('password')} minLength={6}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">College / Organization</label>
            <input type="text" required value={form.collegeOrOrgName} onChange={set('collegeOrOrgName')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Contact Number</label>
            <input type="tel" required value={form.contactNumber} onChange={set('contactNumber')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

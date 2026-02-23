import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 rounded p-8 shadow border border-gray-800">
        <h1 className="text-2xl font-bold text-black text-center mb-6">Set New Password</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded text-black focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gray-200 hover:bg-gray-400 disabled:opacity-50 text-black font-medium rounded cursor-pointer ">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/login" className="text-black font-semibold hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

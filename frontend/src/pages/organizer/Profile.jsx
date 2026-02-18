import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function OrganizerProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [resetForm, setResetForm] = useState({ reason: '', newPassword: '', confirmPassword: '' });
  const [submittingReset, setSubmittingReset] = useState(false);

  const disabled = user?.isApproved === false;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile');
      setProfile(res.data);
      setForm({
        organizerName: res.data.organizerName || '',
        category: res.data.category || '',
        description: res.data.description || '',
        contact: res.data.contact || '',
        discordWebhookUrl: res.data.discordWebhookUrl || '',
      });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (disabled) return toast.error('Your account is disabled');
    setSaving(true);
    try {
      const res = await API.patch('/profile', form);
      setProfile(res.data.user);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (resetForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSubmittingReset(true);
    try {
      await API.post('/auth/request-password-reset', {
        reason: resetForm.reason,
        newPassword: resetForm.newPassword,
      });
      toast.success('Password reset request submitted to admin');
      setResetForm({ reason: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmittingReset(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Organizer Profile</h1>

      {disabled && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          Your account is disabled. You cannot edit your profile until an admin re-enables it.
        </div>
      )}

      {/* Profile Info */}
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Profile Info</h2>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input type="text" value={profile?.email || ''} disabled
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 opacity-60" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Club / Organizer Name</label>
          <input type="text" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={disabled} rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Contact (email or phone)</label>
          <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
            disabled={disabled} placeholder="e.g., club@example.com or 9876543210"
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Discord Webhook URL</label>
          <input type="url" value={form.discordWebhookUrl} onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })}
            disabled={disabled} placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <button type="submit" disabled={saving || disabled}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Password Reset Request */}
      <form onSubmit={handleResetRequest} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Request Password Reset</h2>
        <p className="text-sm text-gray-400">As an organizer, your password reset must be approved by an admin.</p>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Reason</label>
          <textarea value={resetForm.reason} onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
            rows={2} required placeholder="Why do you need a password reset?"
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">New Password</label>
          <input type="password" value={resetForm.newPassword} onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
            required minLength={6}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
          <input type="password" value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <button type="submit" disabled={submittingReset}
          className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
          {submittingReset ? 'Submitting...' : 'Submit Reset Request'}
        </button>
      </form>
    </div>
  );
}

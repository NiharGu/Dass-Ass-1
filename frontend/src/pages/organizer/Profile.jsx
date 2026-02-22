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

  useEffect(() => { fetchProfile(); }, []);

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

  const inputClass = "w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30";
  const disabledClass = "w-full px-4 py-2.5 bg-[#0c0e14]/50 border border-[#1e2030] rounded-xl text-[#3d4162] cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider";

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      <form onSubmit={handleSave} className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Club Info</h2>

        <div>
          <label className={labelClass}>Email</label>
          <input type="text" value={profile?.email || ''} disabled className={disabledClass} />
        </div>

        <div>
          <label className={labelClass}>Club Name</label>
          <input type="text" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <input type="text" value={Array.isArray(form.category) ? form.category.join(', ') : form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Contact</label>
          <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="email or 10-digit phone" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Discord Webhook</label>
          <input type="url" value={form.discordWebhookUrl} onChange={(e) => setForm({ ...form, discordWebhookUrl: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..." className={inputClass} />
        </div>

        <button type="submit" disabled={saving}
          className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handleResetRequest} className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Request Password Reset</h2>
        <p className="text-xs text-[#6b7394]">As an organizer, your password reset must be approved by an admin.</p>

        <div>
          <label className={labelClass}>Reason</label>
          <textarea value={resetForm.reason} onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
            rows={2} required placeholder="Why do you need a password reset?" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>New Password</label>
          <input type="password" value={resetForm.newPassword} onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
            required minLength={6} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Confirm Password</label>
          <input type="password" value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
            required className={inputClass} />
        </div>

        <button type="submit" disabled={submittingReset}
          className="px-6 py-2.5 bg-[#78350f]/50 hover:bg-[#78350f]/70 text-[#fbbf24] font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
          {submittingReset ? 'Submitting...' : 'Submit Reset Request'}
        </button>
      </form>
    </div>
  );
}

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
        category: res.data.category || [],
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
      // Ensure category is an array of trimmed strings if it was ever typed as a comma string
      let categoryArray = form.category;
      if (typeof form.category === 'string') {
        categoryArray = form.category.split(',').map(c => c.trim()).filter(Boolean);
      }

      const res = await API.patch('/profile', { ...form, category: categoryArray });
      setProfile(res.data.user);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const CATEGORY_OPTIONS = ['Sports', 'Cultural', 'Technical', 'Music', 'Dance', 'Drama', 'Art', 'Literature', 'Social', 'Other'];

  const toggleCategory = (cat) => {
    let current = form.category;
    if (typeof current === 'string') current = current.split(',').map(c => c.trim()).filter(Boolean);
    if (!Array.isArray(current)) current = [];

    if (current.includes(cat)) {
      setForm({ ...form, category: current.filter(c => c !== cat) });
    } else {
      setForm({ ...form, category: [...current, cat] });
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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";
  const disabledClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-gray-400 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5  ";

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-black">Profile</h1>

      <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 border rounded p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Club Info</h2>

        <div>
          <label className={labelClass}>Email</label>
          <input type="text" value={profile?.email || ''} disabled className={disabledClass} />
        </div>

        <div>
          <label className={labelClass}>Club Name</label>
          <input type="text" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Categories</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CATEGORY_OPTIONS.map(cat => {
              const isSelected = Array.isArray(form.category)
                ? form.category.includes(cat)
                : typeof form.category === 'string' && form.category.includes(cat);

              return (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded text-sm cursor-pointer  ${isSelected
                    ? 'bg-black text-white-important text-white shadow shadow -200'
                    : 'bg-white text-gray-500 border border-gray-200 border hover:border-gray-300 border'
                    }`}>
                  {cat}
                </button>
              );
            })}
          </div>
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
          className="px-6 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form onSubmit={handleResetRequest} className="bg-gray-50 border border-gray-200 border rounded p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Request Password Reset</h2>
        <p className="text-xs text-gray-500">As an organizer, your password reset must be approved by an admin.</p>

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
          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300/70 text-black font-medium rounded cursor-pointer  ">
          {submittingReset ? 'Submitting...' : 'Submit Reset Request'}
        </button>
      </form>
    </div>
  );
}

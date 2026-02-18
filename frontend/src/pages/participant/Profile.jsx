import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const INTERESTS = ['Sports', 'Cultural', 'Technical', 'Music', 'Dance', 'Drama', 'Art', 'Literature', 'Social', 'Other'];

export default function ParticipantProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/profile').then(res => {
      setForm(res.data);
      setLoading(false);
    });
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleInterest = (interest) => {
    const current = form.selectedInterests || [];
    setForm({
      ...form,
      selectedInterests: current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest]
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { firstName, lastName, contactNumber, collegeOrOrgName, selectedInterests, followedClubs } = form;
      const res = await API.patch('/profile', { firstName, lastName, contactNumber, collegeOrOrgName, selectedInterests, followedClubs });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match');
    try {
      await API.post('/profile/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success('Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input type="text" value={form.firstName || ''} onChange={set('firstName')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input type="text" value={form.lastName || ''} onChange={set('lastName')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} disabled
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Participant Type</label>
            <input type="text" value={form.participantType || ''} disabled
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed capitalize" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Contact Number</label>
            <input type="tel" value={form.contactNumber || ''} onChange={set('contactNumber')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">College / Organization</label>
            <input type="text" value={form.collegeOrOrgName || ''} onChange={set('collegeOrOrgName')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                    (form.selectedInterests || []).includes(interest)
                      ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input type="password" placeholder="Current password" required
            value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" placeholder="New password" required minLength={6}
            value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="password" placeholder="Confirm new password" required
            value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

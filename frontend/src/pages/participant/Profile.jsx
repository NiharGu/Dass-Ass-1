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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";
  const disabledClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-gray-400 cursor-not-allowed";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5  ";

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-black">Profile</h1>

      <div className="bg-gray-50 border border-gray-200 border rounded p-6">
        <h2 className="text-base font-semibold text-black mb-5">Personal Information</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" value={form.firstName || ''} onChange={set('firstName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" value={form.lastName || ''} onChange={set('lastName')} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email || ''} disabled className={disabledClass} />
          </div>

          <div>
            <label className={labelClass}>Participant Type</label>
            <input type="text" value={form.participantType || ''} disabled className={`${disabledClass} capitalize`} />
          </div>

          <div>
            <label className={labelClass}>Contact Number</label>
            <input type="tel" value={form.contactNumber || ''} onChange={set('contactNumber')}
              pattern="[0-9]{10}" maxLength={10} placeholder="10-digit number"
              title="Must be exactly 10 digits"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>College / Organization</label>
            {form.participantType === 'iiit' ? (
              <input type="text" value="IIIT Hyderabad" disabled className={disabledClass} />
            ) : (
              <input type="text" value={form.collegeOrOrgName || ''} onChange={set('collegeOrOrgName')} className={inputClass} />
            )}
          </div>

          <div>
            <label className={labelClass}>Interests</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {INTERESTS.map(interest => (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded text-sm cursor-pointer  ${(form.selectedInterests || []).includes(interest)
                      ? 'bg-black text-white-important text-white shadow shadow -200'
                      : 'bg-white text-gray-500 border border-gray-200 border hover:border-gray-300 border'
                    }`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Followed Clubs */}
          {form.followedClubs && form.followedClubs.length > 0 && (
            <div>
              <label className={labelClass}>Following</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(form.populatedFollowedClubs || []).map(club => (
                  <span key={club._id} className="px-3 py-1.5 bg-gray-100 text-black font-medium text-sm rounded border border-gray-300/30">
                    {club.organizerName}
                  </span>
                ))}
                {(!form.populatedFollowedClubs || form.populatedFollowedClubs.length === 0) && (
                  <span className="text-gray-400 text-sm">{form.followedClubs.length} club(s) followed</span>
                )}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 border rounded p-6">
        <h2 className="text-base font-semibold text-black mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input type="password" placeholder="Current password" required
            value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
            className={inputClass} />
          <input type="password" placeholder="New password" required minLength={6}
            value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
            className={inputClass} />
          <input type="password" placeholder="Confirm new password" required
            value={passForm.confirm} onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
            className={inputClass} />
          <button type="submit"
            className="px-6 py-2.5 bg-black text-white-important hover:bg-gray-900 text-white font-medium rounded cursor-pointer  ">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

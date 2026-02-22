import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function ManageOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ organizerName: '', category: [], description: '', contact: '' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => { fetchOrganizers(); }, [filter]);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await API.get('/admin/organizers', { params });
      setOrganizers(res.data);
    } catch {
      toast.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await API.post('/admin/organizers', createForm);
      setCreated(res.data);
      toast.success('Organizer created');
      setCreateForm({ organizerName: '', category: [], description: '', contact: '' });
      fetchOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id, isApproved) => {
    try {
      if (isApproved) {
        await API.patch(`/admin/organizers/${id}/disable`);
        toast.success('Organizer disabled');
      } else {
        await API.patch(`/admin/organizers/${id}/enable`);
        toast.success('Organizer enabled');
      }
      fetchOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this organizer? This cannot be undone.')) return;
    try {
      await API.delete(`/admin/organizers/${id}`);
      toast.success('Organizer deleted');
      fetchOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30";
  const labelClass = "block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Clubs</h1>
        <button onClick={() => { setShowCreate(!showCreate); setCreated(null); }}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#818cf8] text-white rounded-lg text-sm cursor-pointer transition-all">
          {showCreate ? 'Cancel' : '+ Create'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-6 mb-6">
          {created ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#34d399]">Organizer Created!</h3>
              <div className="bg-[#0c0e14] border border-[#1e2030] rounded-xl p-4 text-sm space-y-1">
                <p className="text-[#8b8fad]">Email: <span className="text-white font-mono">{created.credentials.email}</span></p>
                <p className="text-[#8b8fad]">Password: <span className="text-white font-mono">{created.credentials.password}</span></p>
              </div>
              <p className="text-[#fbbf24] text-xs">Save these credentials — the password won't be shown again.</p>
              <button onClick={() => { setCreated(null); setShowCreate(false); }}
                className="px-4 py-2 bg-[#1e2030] hover:bg-[#252839] text-white rounded-lg text-sm cursor-pointer transition-all">Done</button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-base font-semibold text-white">Create New Organizer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Club Name *</label>
                  <input type="text" required value={createForm.organizerName} onChange={(e) => setCreateForm({ ...createForm, organizerName: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select multiple value={createForm.category} onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setCreateForm({ ...createForm, category: values });
                  }}
                    className={`${inputClass} py-1.5`} size="4">
                    {["Sports", "Cultural", "Technical", "Music", "Dance", "Drama", "Art", "Literature", "Social", "Other"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#3d4162] mt-1">Hold Ctrl/Cmd to multi-select</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact *</label>
                <input type="text" required value={createForm.contact} onChange={(e) => setCreateForm({ ...createForm, contact: e.target.value })}
                  placeholder="email or 10-digit phone" className={inputClass} />
              </div>
              <button type="submit" disabled={creating}
                className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                {creating ? 'Creating...' : 'Create Organizer'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        {['', 'enabled', 'disabled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all capitalize ${filter === f
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                : 'bg-[#12141d] text-[#6b7394] hover:bg-[#1e2030] border border-[#1e2030]'
              }`}>
            {f === '' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div>
      ) : organizers.length === 0 ? (
        <div className="text-center text-[#3d4162] py-16">No organizers found</div>
      ) : (
        <div className="space-y-3">
          {organizers.map(org => (
            <div key={org._id} className="bg-[#12141d] border border-[#1e2030] rounded-xl p-4 flex items-center justify-between hover:border-[#2a2d48] transition-all">
              <div>
                <h3 className="text-white font-medium text-sm">{org.organizerName || org.email}</h3>
                <p className="text-xs text-[#6b7394] mt-0.5">{org.email} {org.category && org.category.length > 0 && `• ${org.category.join(", ")}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${org.isApproved ? 'bg-[#065f46]/30 text-[#34d399]' : 'bg-[#7f1d1d]/30 text-[#f87171]'
                  }`}>
                  {org.isApproved ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => toggleStatus(org._id, org.isApproved)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${org.isApproved
                      ? 'bg-[#78350f]/30 text-[#fbbf24] hover:bg-[#78350f]/50'
                      : 'bg-[#065f46]/30 text-[#34d399] hover:bg-[#065f46]/50'
                    }`}>
                  {org.isApproved ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(org._id)}
                  className="px-3 py-1.5 bg-[#7f1d1d]/30 text-[#f87171] hover:bg-[#7f1d1d]/50 text-xs font-medium rounded-lg cursor-pointer transition-all">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

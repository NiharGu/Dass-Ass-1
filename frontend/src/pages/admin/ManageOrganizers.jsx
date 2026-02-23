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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5  ";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">Manage Clubs</h1>
        <button onClick={() => { setShowCreate(!showCreate); setCreated(null); }}
          className="px-4 py-2 bg-black text-white-important hover:bg-gray-900 text-white rounded text-sm cursor-pointer ">
          {showCreate ? 'Cancel' : '+ Create'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 border border-gray-200 border rounded p-6 mb-6">
          {created ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-black">Organizer Created!</h3>
              <div className="bg-white border border-gray-200 border rounded p-4 text-sm space-y-1">
                <p className="text-gray-600">Email: <span className="text-black font-mono">{created.credentials.email}</span></p>
                <p className="text-gray-600">Password: <span className="text-black font-mono">{created.credentials.password}</span></p>
              </div>
              <p className="text-black text-xs">Save these credentials — the password won't be shown again.</p>
              <button onClick={() => { setCreated(null); setShowCreate(false); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-300 text-black rounded text-sm cursor-pointer ">Done</button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-base font-semibold text-black">Create New Organizer</h3>
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
                  <p className="text-[10px] text-gray-400 mt-1">Hold Ctrl/Cmd to multi-select</p>
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
                className="px-6 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
                {creating ? 'Creating...' : 'Create Organizer'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        {['', 'enabled', 'disabled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded text-sm font-medium cursor-pointer  capitalize ${filter === f
                ? 'bg-black text-white-important text-white shadow shadow -200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-300 border border-gray-200 border'
              }`}>
            {f === '' ? 'All' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div>
      ) : organizers.length === 0 ? (
        <div className="text-center text-gray-400 py-16">No organizers found</div>
      ) : (
        <div className="space-y-3">
          {organizers.map(org => (
            <div key={org._id} className="bg-gray-50 border border-gray-200 border rounded p-4 flex items-center justify-between hover:border-gray-200 border ">
              <div>
                <h3 className="text-black font-medium text-sm">{org.organizerName || org.email}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{org.email} {org.category && org.category.length > 0 && `• ${org.category.join(", ")}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded font-medium  tracking-wide ${org.isApproved ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                  }`}>
                  {org.isApproved ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => toggleStatus(org._id, org.isApproved)}
                  className={`px-3 py-1.5 text-xs font-medium rounded cursor-pointer  ${org.isApproved
                      ? 'bg-gray-100 text-black hover:bg-gray-400'
                      : 'bg-gray-100 text-black hover:bg-gray-400'
                    }`}>
                  {org.isApproved ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(org._id)}
                  className="px-3 py-1.5 bg-gray-100 text-black hover:bg-gray-400 text-xs font-medium rounded cursor-pointer ">
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

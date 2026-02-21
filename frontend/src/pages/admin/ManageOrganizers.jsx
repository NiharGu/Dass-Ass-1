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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Organizers</h1>
        <button onClick={() => { setShowCreate(!showCreate); setCreated(null); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm cursor-pointer transition">
          {showCreate ? 'Cancel' : '+ Create Organizer'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          {created ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-400">Organizer Created!</h3>
              <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-1">
                <p className="text-gray-300">Email: <span className="text-white font-mono">{created.credentials.email}</span></p>
                <p className="text-gray-300">Password: <span className="text-white font-mono">{created.credentials.password}</span></p>
              </div>
              <p className="text-yellow-400 text-xs">Save these credentials — the password won't be shown again.</p>
              <button onClick={() => { setCreated(null); setShowCreate(false); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm cursor-pointer transition">Done</button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Create New Organizer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Club / Organizer Name *</label>
                  <input type="text" required value={createForm.organizerName} onChange={(e) => setCreateForm({ ...createForm, organizerName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select multiple value={createForm.category} onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setCreateForm({ ...createForm, category: values });
                  }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    size="4">
                    {["Sports", "Cultural", "Technical", "Music", "Dance", "Drama", "Art", "Literature", "Social", "Other"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact (email or phone) *</label>
                <input type="text" required value={createForm.contact} onChange={(e) => setCreateForm({ ...createForm, contact: e.target.value })}
                  placeholder="e.g., club@example.com or 9876543210"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" disabled={creating}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
                {creating ? 'Creating...' : 'Create Organizer'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'enabled', 'disabled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : organizers.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No organizers found</div>
      ) : (
        <div className="space-y-3">
          {organizers.map(org => (
            <div key={org._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{org.organizerName || org.email}</h3>
                <p className="text-sm text-gray-400">{org.email} {org.category && org.category.length > 0 && `• ${org.category.join(", ")}`}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${org.isApproved ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {org.isApproved ? 'Enabled' : 'Disabled'}
                </span>
                <button onClick={() => toggleStatus(org._id, org.isApproved)}
                  className={`px-3 py-1.5 text-sm rounded-lg cursor-pointer transition ${org.isApproved ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                  {org.isApproved ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(org._id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg cursor-pointer transition">
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

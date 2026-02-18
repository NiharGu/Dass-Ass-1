import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/events/${id}`);
        const e = res.data;
        setEvent(e);
        setForm({
          Name: e.Name || '',
          Description: e.Description || '',
          Type: e.Type || 'normal',
          eligibility: e.eligibility || 'open',
          registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline).toISOString().slice(0, 10) : '',
          StartDate: e.StartDate ? new Date(e.StartDate).toISOString().slice(0, 10) : '',
          EndDate: e.EndDate ? new Date(e.EndDate).toISOString().slice(0, 10) : '',
          registrationLimit: e.registrationLimit || 100,
          registrationFee: e.registrationFee || 0,
          Tags: e.Tags?.join(', ') || '',
        });
      } catch {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const isDraft = event?.status === 'draft';
  const isPublished = event?.status === 'published';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Date validation
    const { StartDate, EndDate, registrationDeadline } = form;
    if (!StartDate || !EndDate || !registrationDeadline) {
      toast.error('All date fields are required');
      return;
    }
    if (StartDate > EndDate) {
      toast.error('Start Date cannot be after End Date');
      return;
    }
    if (registrationDeadline > EndDate) {
      toast.error('Registration Deadline cannot be after End Date');
      return;
    }
    setSaving(true);
    try {
      const body = {};
      if (isDraft) {
        Object.assign(body, form, {
          registrationLimit: Number(form.registrationLimit),
          registrationFee: Number(form.registrationFee),
          Tags: form.Tags ? form.Tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });
      } else if (isPublished) {
        body.Description = form.Description;
        body.registrationDeadline = form.registrationDeadline;
        body.registrationLimit = Number(form.registrationLimit);
        body.StartDate = form.StartDate;
        body.EndDate = form.EndDate;
      }
      await API.put(`/events/${id}`, body);
      toast.success('Event updated!');
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;
  if (!event) return <div className="text-center text-gray-400 py-20">Event not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(`/organizer/events/${id}`)} className="text-sm text-indigo-400 hover:underline mb-4 cursor-pointer">← Back</button>
      <h1 className="text-2xl font-bold text-white mb-2">Edit Event</h1>
      {isPublished && (
        <p className="text-yellow-400 text-sm mb-4">Published events: only Description, Registration Deadline, Registration Limit, and Dates can be edited.</p>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Event Name</label>
          <input type="text" value={form.Name} onChange={set('Name')} disabled={!isDraft}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea value={form.Description} onChange={set('Description')} rows={4}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <input type="text" value={form.Type} disabled
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white opacity-50" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Eligibility</label>
            <select value={form.eligibility} onChange={set('eligibility')} disabled={!isDraft}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="open">Open</option>
              <option value="iiit-only">IIIT Only</option>
              <option value="non-iiit">Non-IIIT</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
            <input type="date" value={form.StartDate} onChange={set('StartDate')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Date</label>
            <input type="date" value={form.EndDate} onChange={set('EndDate')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Registration Deadline</label>
            <input type="date" value={form.registrationDeadline} onChange={set('registrationDeadline')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Registration Limit</label>
            <input type="number" min={1} value={form.registrationLimit} onChange={set('registrationLimit')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fee (₹)</label>
            <input type="number" min={0} value={form.registrationFee} onChange={set('registrationFee')} disabled={!isDraft}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags</label>
            <input type="text" value={form.Tags} onChange={set('Tags')} disabled={!isDraft}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

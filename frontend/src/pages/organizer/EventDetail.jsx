import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const evtRes = await API.get(`/events/${id}`);
      setEvent(evtRes.data);
    } catch (err) {
      toast.error('Failed to load event');
    }
    try {
      const partRes = await API.get(`/events/${id}/participants`);
      setParticipants(partRes.data.participants || []);
    } catch {
      setParticipants([]);
    }
    try {
      const dashRes = await API.get('/events/organizer/dashboard');
      const stat = dashRes.data.events?.find(e => e.eventId === id);
      setAnalytics(stat || null);
    } catch {
      setAnalytics(null);
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    try {
      await API.patch(`/events/${id}/publish`);
      toast.success('Event published!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleClose = async () => {
    try {
      await API.patch(`/events/${id}/close`);
      toast.success('Event closed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await API.get(`/events/${id}/participants/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participants-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error('CSV export failed');
    }
  };

  const filteredParticipants = participants.filter(p => {
    const nameMatch = !search || p.participantName?.toLowerCase().includes(search.toLowerCase()) ||
      p.participantEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.ticketId?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = !statusFilter || p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;
  if (!event) return <div className="text-center text-gray-400 py-20">Event not found</div>;

  const statusColors = { draft: 'bg-yellow-900 text-yellow-300', published: 'bg-green-900 text-green-300', closed: 'bg-red-900 text-red-300' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/organizer')} className="text-sm text-indigo-400 hover:underline mb-2 cursor-pointer">← Back</button>
          <h1 className="text-2xl font-bold text-white">{event.Name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[event.status]}`}>{event.status}</span>
        </div>
        <div className="flex gap-2">
          {event.status === 'draft' && (
            <>
              <button onClick={handlePublish} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm cursor-pointer transition">Publish</button>
              <button
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to delete this draft event?")) return;
                  try {
                    await API.delete(`/events/${id}`);
                    toast.success("Draft event deleted.");
                    navigate("/organizer");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to delete event");
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm cursor-pointer transition"
              >Delete</button>
            </>
          )}
          {event.status === 'published' && (
            <button onClick={handleClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm cursor-pointer transition">Close</button>
          )}
          {(event.status === 'draft' || event.status === 'published') && (
            <button onClick={() => navigate(`/organizer/events/${id}/edit`)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm cursor-pointer transition">Edit</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6">
        {['overview', 'participants', 'analytics'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium cursor-pointer transition ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Type:</span> <span className="text-white ml-2">{event.Type}</span></div>
            <div><span className="text-gray-400">Eligibility:</span> <span className="text-white ml-2">{event.eligibility}</span></div>
            <div><span className="text-gray-400">Start:</span> <span className="text-white ml-2">{new Date(event.StartDate).toLocaleString()}</span></div>
            <div><span className="text-gray-400">End:</span> <span className="text-white ml-2">{new Date(event.EndDate).toLocaleString()}</span></div>
            <div><span className="text-gray-400">Deadline:</span> <span className="text-white ml-2">{new Date(event.registrationDeadline).toLocaleString()}</span></div>
            <div><span className="text-gray-400">Fee:</span> <span className="text-white ml-2">₹{event.registrationFee}</span></div>
            <div><span className="text-gray-400">Limit:</span> <span className="text-white ml-2">{event.registrationLimit}</span></div>
            <div><span className="text-gray-400">Tags:</span> <span className="text-white ml-2">{event.Tags?.join(', ') || '—'}</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Description</h3>
            <p className="text-white text-sm whitespace-pre-wrap">{event.Description}</p>
          </div>
          {event.customForm?.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Custom Form Fields</h3>
              <div className="space-y-1">
                {event.customForm.map((f, i) => (
                  <div key={i} className="text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded-lg">
                    <span className="font-medium">{f.label || f.name}</span> — {f.type} {f.required && <span className="text-red-400">*</span>}
                    {f.options?.length > 0 && <span className="text-gray-500 ml-2">({f.options.join(', ')})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {event.merchandiseDetails?.items?.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Merchandise Items</h3>
              <div className="grid gap-2">
                {event.merchandiseDetails.items.map((item, i) => (
                  <div key={i} className="text-sm text-gray-300 bg-gray-800 px-3 py-2 rounded-lg flex justify-between">
                    <span>{item.name} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}</span>
                    <span>Stock: {item.stock} | Limit: {item.purchaseLimit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Participants */}
      {tab === 'participants' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="text" placeholder="Search by name, email, ticket..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none">
              <option value="">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={handleExportCSV} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition whitespace-nowrap">
              Export CSV
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No participants found</td></tr>
                ) : filteredParticipants.map(p => (
                  <tr key={p.registrationId} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-white">{p.participantName}</td>
                    <td className="px-4 py-3 text-gray-300">{p.participantEmail}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.ticketId}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'registered' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics */}
      {tab === 'analytics' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{analytics.totalRegistrations}</p>
                <p className="text-xs text-gray-400 mt-1">Registrations</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">₹{analytics.totalRevenue}</p>
                <p className="text-xs text-gray-400 mt-1">Revenue</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{analytics.merchandiseSales || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Merch Sales</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{analytics.totalRegistrations}/{event.registrationLimit}</p>
                <p className="text-xs text-gray-400 mt-1">Capacity</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No analytics available yet</p>
          )}
        </div>
      )}
    </div>
  );
}

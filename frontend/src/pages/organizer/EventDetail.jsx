import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import DiscussionForum from '../../components/DiscussionForum';

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
  const [showForum, setShowForum] = useState(false);

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

  const statusColors = { draft: 'bg-gray-200 text-black', published: 'bg-gray-200 text-black', closed: 'bg-gray-200 text-black' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate('/organizer')} className="text-sm text-black font-semibold hover:underline mb-2 cursor-pointer">← Back</button>
          <h1 className="text-2xl font-bold text-black">{event.Name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded ${statusColors[event.status]}`}>{event.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.status === 'draft' && (
            <>
              <button onClick={handlePublish} className="px-4 py-2 bg-white border border-black cursor-pointer hover:bg-gray-300 text-black rounded text-sm cursor-pointer ">Publish</button>
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
                className="px-4 py-2 bg-white border border-gray-400 cursor-pointer hover:bg-gray-300 text-black rounded text-sm cursor-pointer "
              >Delete</button>
            </>
          )}
          {event.status === 'published' && (
            <>
              <button onClick={() => navigate(`/organizer/events/${id}/attendance`)} className="px-4 py-2 bg-gray-200 hover:bg-gray-400 text-black rounded text-sm cursor-pointer ">Scan Attendance</button>
              <button onClick={handleClose} className="px-4 py-2 bg-white border border-gray-400 cursor-pointer hover:bg-gray-300 text-black rounded text-sm cursor-pointer ">Close</button>
            </>
          )}
          {(event.status === 'draft' || event.status === 'published') && (
            <button onClick={() => navigate(`/organizer/events/${id}/edit`)} className="px-4 py-2 bg-gray-200 hover:bg-gray-400 text-black rounded text-sm cursor-pointer ">Edit</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded p-1 mb-6">
        {['overview', 'participants', 'analytics', 'forum'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded text-sm font-medium cursor-pointer  ${tab === t ? 'bg-gray-200 text-black' : 'text-gray-400 hover:text-black'}`}>
            {t === 'forum' ? 'Forum' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Type:</span> <span className="text-black ml-2">{event.Type}</span></div>
            <div><span className="text-gray-400">Eligibility:</span> <span className="text-black ml-2">{event.eligibility}</span></div>
            <div><span className="text-gray-500">Start:</span> <span className="text-gray-900 ml-2">{new Date(event.StartDate).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">End:</span> <span className="text-gray-900 ml-2">{new Date(event.EndDate).toLocaleDateString()}</span></div>
            <div><span className="text-gray-500">Deadline:</span> <span className="text-gray-900 ml-2">{new Date(event.registrationDeadline).toLocaleDateString()}</span></div>
            <div><span className="text-gray-400">Fee:</span> <span className="text-black ml-2">₹{event.registrationFee}</span></div>
            <div><span className="text-gray-400">Limit:</span> <span className="text-black ml-2">{event.registrationLimit}</span></div>
            <div><span className="text-gray-400">Tags:</span> <span className="text-black ml-2">{event.Tags?.join(', ') || '—'}</span></div>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm mb-1">Description</h3>
            <p className="text-black text-sm whitespace-pre-wrap">{event.Description}</p>
          </div>
          {event.customForm?.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Custom Form Fields</h3>
              <div className="space-y-1">
                {event.customForm.map((f, i) => (
                  <div key={i} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded">
                    <span className="font-medium text-black">{f.label || f.name}</span> — {f.type} {f.required && <span className="text-red-500">*</span>}
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
                  <div key={i} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center">
                    <span className="font-medium text-black">{item.name} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}</span>
                    <span className="text-gray-500">Stock: {item.stock} | Limit: {item.purchaseLimit}</span>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search by name, email, ticket..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded text-black text-sm focus:outline-none focus:border-black" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded text-black text-sm focus:outline-none focus:border-black">
              <option value="">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white border border-black cursor-pointer hover:bg-gray-300 text-black text-sm rounded cursor-pointer  whitespace-nowrap">
              Export CSV
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-left bg-gray-50">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Reg Date</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Payment</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Team</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Attendance</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No participants found</td></tr>
                ) : filteredParticipants.map(p => (
                  <tr key={p.registrationId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-black whitespace-nowrap">{p.participantName}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.participantEmail}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(p.registrationDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-black text-sm">₹{p.payment || 0}</td>
                    <td className="px-4 py-3 text-black font-medium text-sm">{p.teamName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${p.attended ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {p.attended ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'registered' ? 'bg-gray-200 text-black' : 'bg-gray-200 text-black'}`}>
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
        <div className="bg-white border border-gray-200 rounded p-6">
          {analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                <p className="text-2xl font-bold text-black">{analytics.totalRegistrations}</p>
                <p className="text-xs text-gray-500 mt-1">Registrations</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                <p className="text-2xl font-bold text-black">{analytics.attendance || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Attendance</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                <p className="text-2xl font-bold text-black">₹{analytics.revenue}</p>
                <p className="text-xs text-gray-500 mt-1">Revenue</p>
              </div>
              {event.isTeamEvent && (
                <>
                  <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                    <p className="text-2xl font-bold text-black">{analytics.completedTeams || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Complete Teams</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                    <p className="text-2xl font-bold text-black">{analytics.formingTeams || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Forming Teams</p>
                  </div>
                </>
              )}
              <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                <p className="text-2xl font-bold text-black">{analytics.merchandiseSales || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Merch Sales</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-4 text-center">
                <p className="text-2xl font-bold text-black">{analytics.totalRegistrations}/{event.registrationLimit}</p>
                <p className="text-xs text-gray-500 mt-1">Capacity</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No analytics available yet</p>
          )}
        </div>
      )}

      {/* Forum */}
      {tab === 'forum' && (
        <DiscussionForum eventId={id} isOrganizer={true} />
      )}
    </div>
  );
}

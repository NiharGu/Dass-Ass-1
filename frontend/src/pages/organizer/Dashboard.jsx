import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function OrganizerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/events/organizer/dashboard'),
      API.get('/events/organizer')
    ]).then(([dashRes, evRes]) => {
      setDashboard(dashRes.data);
      setEvents(evRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;

  const stats = [
    { label: 'Events', value: dashboard?.summary?.totalEvents || 0, color: '#818cf8' },
    { label: 'Published', value: dashboard?.summary?.publishedEvents || 0, color: '#34d399' },
    { label: 'Registrations', value: dashboard?.summary?.totalRegistrations || 0, color: '#60a5fa' },
    { label: 'Revenue', value: `₹${dashboard?.summary?.totalRevenue || 0}`, color: '#fbbf24' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#12141d] border border-[#1e2030] rounded-xl p-5">
            <p className="text-xs text-[#6b7394] uppercase tracking-wider font-medium">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Recent Events</h2>
        <Link to="/organizer/create-event"
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm font-medium rounded-lg transition-all">
          + Create
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-[#3d4162] text-center py-16">No events yet. Create your first event!</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {events.map(ev => (
            <div key={ev._id} className="min-w-[260px] bg-[#12141d] border border-[#1e2030] rounded-xl p-5 hover:border-[#2a2d48] transition-all shrink-0 relative group card-hover">
              <Link to={`/organizer/events/${ev._id}`} className="block">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold truncate mr-2 text-sm">{ev.Name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium uppercase tracking-wide ${ev.status === 'draft' ? 'bg-[#78350f]/30 text-[#fbbf24]'
                      : ev.status === 'published' ? 'bg-[#065f46]/30 text-[#34d399]'
                        : 'bg-[#1e2030] text-[#6b7394]'
                    }`}>{ev.status}</span>
                </div>
                <p className="text-xs text-[#6b7394] capitalize">{ev.Type}</p>
                <p className="text-xs text-[#3d4162] mt-2">{new Date(ev.StartDate).toLocaleDateString()}</p>
              </Link>
              {ev.status === 'draft' && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!window.confirm('Delete this draft event?')) return;
                    try {
                      await API.delete(`/events/${ev._id}`);
                      setEvents(prev => prev.filter(e => e._id !== ev._id));
                      toast.success('Draft deleted');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to delete');
                    }
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs px-2 py-1 rounded-lg transition cursor-pointer"
                  title="Delete draft"
                >Delete</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analytics Table */}
      {dashboard?.events?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-white mb-4">Analytics</h2>
          <div className="overflow-x-auto bg-[#12141d] border border-[#1e2030] rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2030] text-[#6b7394] text-left text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Registrations</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Merch</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.events.map(ev => (
                  <tr key={ev.eventId} className="border-b border-[#1e2030]/50">
                    <td className="px-4 py-3 text-white text-sm">{ev.eventName}</td>
                    <td className="px-4 py-3 capitalize text-[#6b7394] text-sm">{ev.status}</td>
                    <td className="px-4 py-3 text-[#8b8fad] text-sm">{ev.totalRegistrations}/{ev.registrationLimit}</td>
                    <td className="px-4 py-3 text-[#fbbf24] text-sm">₹{ev.revenue}</td>
                    <td className="px-4 py-3 text-[#8b8fad] text-sm">{ev.merchandiseSales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

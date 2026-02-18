import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function OrganizerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      API.get('/events/organizer/dashboard'),
      API.get('/events/organizer')
    ]).then(([dashRes, evRes]) => {
      setDashboard(dashRes.data);
      setEvents(evRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><p className="text-gray-400">Loading...</p></div>;

  const disabled = user?.isApproved === false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {disabled && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl p-4 mb-6">
          Your account is disabled. You can view data but cannot create or edit events.
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-6">Organizer Dashboard</h1>

      {/* Summary Stats */}
      {dashboard?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: dashboard.summary.totalEvents },
            { label: 'Published', value: dashboard.summary.publishedEvents },
            { label: 'Total Registrations', value: dashboard.summary.totalRegistrations },
            { label: 'Total Revenue', value: `₹${dashboard.summary.totalRevenue}` },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events Carousel */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">My Events</h2>
        {!disabled && (
          <Link to="/organizer/create-event"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
            + Create Event
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No events yet. Create your first event!</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {events.map(ev => (
            <div key={ev._id} className="min-w-[280px] bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition shrink-0 relative group">
              <Link to={`/organizer/events/${ev._id}`}
                className="block">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold truncate mr-2">{ev.Name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    ev.status === 'draft' ? 'bg-yellow-900/40 text-yellow-400'
                    : ev.status === 'published' ? 'bg-green-900/40 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                  }`}>{ev.status}</span>
                </div>
                <p className="text-sm text-gray-400 capitalize">{ev.Type}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(ev.StartDate).toLocaleDateString()}</p>
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
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-700 hover:bg-red-800 text-white text-xs px-2 py-1 rounded transition"
                  title="Delete draft"
                >Delete</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Event Analytics Table */}
      {dashboard?.events?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Event Analytics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Registrations</th>
                  <th className="pb-3 pr-4">Revenue</th>
                  <th className="pb-3">Merch Sales</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.events.map(ev => (
                  <tr key={ev.eventId} className="border-b border-gray-800/50">
                    <td className="py-3 pr-4 text-white">{ev.eventName}</td>
                    <td className="py-3 pr-4 capitalize text-gray-400">{ev.status}</td>
                    <td className="py-3 pr-4 text-gray-300">{ev.totalRegistrations}/{ev.registrationLimit}</td>
                    <td className="py-3 pr-4 text-gray-300">₹{ev.revenue}</td>
                    <td className="py-3 text-gray-300">{ev.merchandiseSales}</td>
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

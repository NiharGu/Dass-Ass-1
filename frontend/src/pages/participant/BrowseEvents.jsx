import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ eventType: '', eligibility: '', startDate: '', endDate: '', followedClubs: false });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.eligibility) params.set('eligibility', filters.eligibility);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.followedClubs && user?.followedClubs?.length) {
      params.set('followedClubs', user.followedClubs.join(','));
    }
    API.get(`/events?${params}`).then(res => {
      setEvents(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchEvents();
    API.get('/events/trending').then(res => setTrending(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const setFilter = (key) => (e) => {
    const val = e.target ? e.target.value : e;
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Browse Events</h1>

      {trending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">🔥 Trending</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trending.map(ev => (
              <Link key={ev._id} to={`/events/${ev._id}`}
                className="min-w-[250px] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-800/50 rounded-xl p-4 hover:border-indigo-600 transition">
                <p className="text-white font-semibold truncate">{ev.Name}</p>
                <p className="text-sm text-gray-400 mt-1">{ev.registrationCount} registrations</p>
                <p className="text-xs text-gray-500 mt-1">{ev.organizer?.organizerName}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events or organizers..."
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" />
        <div className="flex flex-wrap gap-3">
          <select value={filters.eventType} onChange={setFilter('eventType')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="merchandise">Merchandise</option>
          </select>
          <select value={filters.eligibility} onChange={setFilter('eligibility')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
            <option value="">All Eligibility</option>
            <option value="open">Open</option>
            <option value="iiit-only">IIIT Only</option>
            <option value="non-iiit">Non-IIIT</option>
          </select>
          <input type="date" value={filters.startDate} onChange={setFilter('startDate')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none" />
          <input type="date" value={filters.endDate} onChange={setFilter('endDate')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={filters.followedClubs}
              onChange={(e) => setFilters(prev => ({ ...prev, followedClubs: e.target.checked }))}
              className="rounded" />
            Followed Clubs
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No events found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold group-hover:text-indigo-400 transition truncate mr-2">{ev.Name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  ev.Type === 'merchandise' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'
                }`}>
                  {ev.Type}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ev.Description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{ev.organizer?.organizerName || 'Unknown'}</span>
                <span>{new Date(ev.StartDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span className="capitalize">{ev.eligibility}</span>
                <span>₹{ev.registrationFee}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

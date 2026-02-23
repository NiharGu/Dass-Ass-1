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
  const [myRegs, setMyRegs] = useState({});
  const [myTeams, setMyTeams] = useState({});
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
    API.get('/events/trending').then(res => setTrending(res.data)).catch(() => { });

    if (user) {
      API.get('/registration/my-registrations').then(res => {
        const regMap = {};
        (res.data || []).forEach(r => { regMap[r.event?._id || r.event] = r.status; });
        setMyRegs(regMap);
      }).catch(() => { });

      API.get('/teams/my-teams').then(res => {
        const teamMap = {};
        (res.data || []).forEach(t => {
          const evId = t.event?._id || t.event;
          teamMap[evId] = t.name;
        });
        setMyTeams(teamMap);
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const setFilter = (key) => (e) => {
    const val = e.target ? e.target.value : e;
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const selectClass = "px-3 py-2 bg-white border border-gray-200 border rounded text-sm text-gray-600 focus:outline-none focus:border-black";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">Browse Events</h1>

      {trending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-black font-medium   mb-3"> Trending</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {trending.map(ev => (
              <Link key={ev._id} to={`/events/${ev._id}`}
                className="min-w-[240px] bg-white border border-gray-200 border rounded p-4 hover:border-black/50  ">
                <p className="text-black font-semibold truncate text-sm">{ev.Name}</p>
                <p className="text-xs text-gray-500 mt-1">{ev.registrationCount} registrations</p>
                <p className="text-xs text-gray-400 mt-1">{ev.organizer?.organizerName}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 border rounded p-4 mb-6">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events or organizers..."
          className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30 mb-3" />
        <div className="flex flex-wrap gap-3">
          <select value={filters.eventType} onChange={setFilter('eventType')} className={selectClass}>
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="merchandise">Merchandise</option>
          </select>
          <select value={filters.eligibility} onChange={setFilter('eligibility')} className={selectClass}>
            <option value="">All Eligibility</option>
            <option value="open">Open</option>
            <option value="iiit-only">IIIT Only</option>
            <option value="non-iiit">Non-IIIT</option>
          </select>
          <input type="date" value={filters.startDate} onChange={setFilter('startDate')} className={selectClass} />
          <input type="date" value={filters.endDate} onChange={setFilter('endDate')} className={selectClass} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={filters.followedClubs}
              onChange={(e) => setFilters(prev => ({ ...prev, followedClubs: e.target.checked }))}
              className="rounded accent-[#6366f1]" />
            Following
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No events found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`}
              className="bg-gray-50 border border-gray-200 border rounded p-5 hover:border-gray-200 border   ">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-black font-semibold -hover:text-black font-medium  truncate mr-2 text-[15px]">{ev.Name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 font-medium  tracking-wide ${ev.Type === 'merchandise' ? 'bg-gray-100 text-black' : 'bg-gray-100/30 text-black'
                  }`}>
                  {ev.Type}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{ev.Description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{ev.organizer?.organizerName || 'Unknown'}</span>
                <span>{new Date(ev.StartDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                <span className="capitalize">{ev.eligibility}</span>
                {ev.registrationFee > 0 && <span className="text-black font-medium">₹{ev.registrationFee}</span>}
                {ev.registrationFee === 0 && <span className="text-black">Free</span>}
              </div>
              {/* Participation status & team name */}
              {user && (myRegs[ev._id] || myTeams[ev._id]) && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {myRegs[ev._id] === 'registered' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-black font-medium">Registered</span>
                  )}
                  {myRegs[ev._id] === 'cancelled' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-black font-medium">Cancelled</span>
                  )}
                  {myTeams[ev._id] && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100/30 text-black font-medium font-medium">Team: {myTeams[ev._id]}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

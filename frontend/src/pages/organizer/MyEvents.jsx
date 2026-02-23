import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const TABS = ['all', 'ongoing', 'upcoming', 'past', 'draft'];

export default function OrganizerMyEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');

    useEffect(() => {
        API.get('/events/organizer')
            .then(res => setEvents(res.data))
            .catch(() => toast.error('Failed to load events'))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();

    const filtered = events.filter(ev => {
        if (tab === 'all') return true;
        if (tab === 'draft') return ev.status === 'draft';
        if (tab === 'ongoing') return ev.status === 'published' && new Date(ev.StartDate) <= now && new Date(ev.EndDate) >= now;
        if (tab === 'upcoming') return ev.status === 'published' && new Date(ev.StartDate) > now;
        if (tab === 'past') return ev.status === 'closed' || (ev.status === 'published' && new Date(ev.EndDate) < now);
        return true;
    });

    if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-black">My Events</h1>
                <Link to="/organizer/create-event"
                    className="px-4 py-2 bg-black text-white-important hover:bg-gray-900 text-white text-sm font-medium rounded ">
                    + Create
                </Link>
            </div>

            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap cursor-pointer  capitalize ${tab === t
                            ? 'bg-black text-white-important text-white shadow shadow -200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-300 border border-gray-200 border'
                            }`}>
                        {t}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-gray-400 text-center py-16">No events found</p>
            ) : (
                <div className="space-y-3">
                    {filtered.map(ev => (
                        <Link key={ev._id} to={`/organizer/events/${ev._id}`}
                            className="block bg-gray-50 border border-gray-200 border hover:border-gray-200 border rounded p-5  ">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-black font-semibold text-[15px]">{ev.Name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(ev.StartDate).toLocaleDateString()} — {new Date(ev.EndDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 capitalize">{ev.Type} • {ev.eligibility}</p>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded font-medium  tracking-wide ${ev.status === 'draft' ? 'bg-gray-100 text-black'
                                    : ev.status === 'published' ? 'bg-gray-100 text-black'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>{ev.status}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

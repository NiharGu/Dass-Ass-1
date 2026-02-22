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

    if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">My Events</h1>
                <Link to="/organizer/create-event"
                    className="px-4 py-2 bg-[#6366f1] hover:bg-[#818cf8] text-white text-sm font-medium rounded-lg transition-all">
                    + Create
                </Link>
            </div>

            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all capitalize ${tab === t
                            ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                            : 'bg-[#12141d] text-[#6b7394] hover:bg-[#1e2030] border border-[#1e2030]'
                            }`}>
                        {t}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-[#3d4162] text-center py-16">No events found</p>
            ) : (
                <div className="space-y-3">
                    {filtered.map(ev => (
                        <Link key={ev._id} to={`/organizer/events/${ev._id}`}
                            className="block bg-[#12141d] border border-[#1e2030] hover:border-[#2a2d48] rounded-xl p-5 transition-all card-hover">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-white font-semibold text-[15px]">{ev.Name}</h3>
                                    <p className="text-xs text-[#6b7394] mt-1">
                                        {new Date(ev.StartDate).toLocaleDateString()} — {new Date(ev.EndDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-[#3d4162] mt-1 capitalize">{ev.Type} • {ev.eligibility}</p>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${ev.status === 'draft' ? 'bg-[#78350f]/30 text-[#fbbf24]'
                                    : ev.status === 'published' ? 'bg-[#065f46]/30 text-[#34d399]'
                                        : 'bg-[#1e2030] text-[#6b7394]'
                                    }`}>{ev.status}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [form, setForm] = useState({ eventId: '', teamName: '', maxSize: 4 });
    const [joinCode, setJoinCode] = useState('');
    const [events, setEvents] = useState([]);

    useEffect(() => { fetchTeams(); fetchEvents(); }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await API.get('/teams/my-teams');
            setTeams(res.data);
        } catch { toast.error('Failed to load teams'); }
        finally { setLoading(false); }
    };

    const fetchEvents = async () => {
        try {
            const res = await API.get('/events');
            // Only show team-based published events
            setEvents(res.data.filter(ev => ev.isTeamEvent && ev.status === 'published'));
        } catch { }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/teams', form);
            toast.success('Team created! Share your invite code.');
            setShowCreate(false);
            setForm({ eventId: '', teamName: '', maxSize: 4 });
            fetchTeams();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create team');
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            await API.post('/teams/join', { inviteCode: joinCode.trim() });
            toast.success('Joined team!');
            setShowJoin(false);
            setJoinCode('');
            fetchTeams();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join team');
        }
    };

    const handleLeave = async (teamId) => {
        if (!window.confirm('Leave this team?')) return;
        try {
            await API.patch(`/teams/${teamId}/leave`);
            toast.success('Left team');
            fetchTeams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to leave'); }
    };

    const handleCancel = async (teamId) => {
        if (!window.confirm('Cancel this team? This cannot be undone.')) return;
        try {
            await API.patch(`/teams/${teamId}/cancel`);
            toast.success('Team cancelled');
            fetchTeams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
    };

    const statusColors = {
        forming: 'bg-yellow-900/40 text-yellow-400',
        complete: 'bg-green-900/40 text-green-400',
        cancelled: 'bg-red-900/40 text-red-400'
    };

    if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">My Teams</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg cursor-pointer transition">
                        Create Team
                    </button>
                    <button onClick={() => setShowJoin(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition">
                        Join Team
                    </button>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-white mb-4">Create Team</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Event</label>
                                <select required value={form.eventId} onChange={e => setForm({ ...form, eventId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Select a team event...</option>
                                    {events.map(ev => <option key={ev._id} value={ev._id}>{ev.Name} (team size: {ev.minTeamSize}-{ev.maxTeamSize})</option>)}
                                </select>
                                {events.length === 0 && <p className="text-xs text-gray-500 mt-1">No team-based events available.</p>}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                                <input type="text" required value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            {form.eventId && (
                                <p className="text-xs text-gray-400">Team size: {events.find(e => e._id === form.eventId)?.minTeamSize || 2} – {events.find(e => e._id === form.eventId)?.maxTeamSize || 4} members (set by the organizer)</p>
                            )}
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition">Create</button>
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowJoin(false)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-white mb-4">Join Team</h2>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Invite Code</label>
                                <input type="text" required value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter invite code"
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest text-center text-lg" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition">Join</button>
                                <button type="button" onClick={() => setShowJoin(false)} className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team List */}
            {teams.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-gray-900 border border-gray-800 rounded-2xl">
                    No teams yet. Create or join a team for hackathon events.
                </div>
            ) : (
                <div className="space-y-4">
                    {teams.map(team => (
                        <div key={team._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{team.name}</h3>
                                    <p className="text-gray-400 text-sm">{team.event?.Name || 'Unknown Event'}</p>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[team.status]}`}>
                                    {team.status}
                                </span>
                            </div>

                            {/* Invite Code */}
                            {team.status === 'forming' && (
                                <div className="bg-gray-800 rounded-lg p-3 mb-3">
                                    <p className="text-xs text-gray-400 mb-1">Invite Code (share with teammates)</p>
                                    <div className="flex items-center gap-2">
                                        <code className="text-indigo-400 font-mono text-lg tracking-widest">{team.inviteCode}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(team.inviteCode); toast.success('Copied!'); }}
                                            className="text-xs text-gray-400 hover:text-white cursor-pointer">Copy</button>
                                    </div>
                                </div>
                            )}

                            {/* Members */}
                            <div className="mb-3">
                                <p className="text-xs text-gray-400 mb-2">Members ({team.members.length}/{team.maxSize})</p>
                                <div className="flex flex-wrap gap-2">
                                    {team.members.map(m => (
                                        <span key={m._id} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                            {m.firstName} {m.lastName}
                                            {m._id === team.leader?._id && <span className="text-yellow-400 ml-1">★</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {team.status === 'forming' && (
                                <div className="flex gap-2">
                                    {team.leader?._id !== (JSON.parse(localStorage.getItem('user'))?.id) ? (
                                        <button onClick={() => handleLeave(team._id)}
                                            className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm rounded-lg cursor-pointer transition">
                                            Leave Team
                                        </button>
                                    ) : (
                                        <button onClick={() => handleCancel(team._id)}
                                            className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm rounded-lg cursor-pointer transition">
                                            Cancel Team
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

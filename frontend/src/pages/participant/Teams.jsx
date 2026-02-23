import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [form, setForm] = useState({ eventId: '', teamName: '' });
    const [joinCode, setJoinCode] = useState('');
    const [events, setEvents] = useState([]);
    const [registeringTeamId, setRegisteringTeamId] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

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
            setEvents(res.data.filter(ev => ev.isTeamEvent && ev.status === 'published'));
        } catch { }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/teams', form);
            toast.success('Team created! Share your invite code.');
            setShowCreate(false);
            setForm({ eventId: '', teamName: '' });
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

    const handleRegisterTeam = async (team) => {
        // If event has required custom form fields, redirect to event page
        const eventId = team.event?._id || team.event;
        try {
            const eventRes = await API.get(`/events/${eventId}`);
            const eventData = eventRes.data;
            const hasRequiredFields = eventData.customForm?.some(f => f.required);
            if (hasRequiredFields) {
                toast('This event has required form fields. Redirecting to event page...');
                navigate(`/events/${eventId}`);
                return;
            }
        } catch { /* proceed anyway */ }

        setRegisteringTeamId(team._id);
        try {
            await API.post(`/teams/${team._id}/register`);
            toast.success('Team registered! QR code sent to your email.');
            fetchTeams();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setRegisteringTeamId(null);
        }
    };

    const statusColors = {
        forming: 'bg-gray-100 text-black',
        complete: 'bg-gray-100 text-black',
        cancelled: 'bg-gray-100 text-black'
    };

    const statusLabels = {
        forming: 'Forming',
        complete: 'Registered',
        cancelled: 'Cancelled'
    };

    if (loading) return <div className="text-center text-gray-500 py-20">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-black">My Teams</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-black text-white-important hover:bg-gray-900 text-white text-sm rounded cursor-pointer ">
                        Create Team
                    </button>
                    <button onClick={() => setShowJoin(true)}
                        className="px-4 py-2 bg-white border border-gray-200 border hover:border-black text-black text-sm rounded cursor-pointer ">
                        Join Team
                    </button>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
                    <div className="bg-gray-50 border border-gray-200 border rounded p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-black mb-4">Create Team</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Event</label>
                                <select required value={form.eventId} onChange={e => setForm({ ...form, eventId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black focus:outline-none focus:ring-2 focus:ring-[#6366f1]">
                                    <option value="">Select a team event...</option>
                                    {events.map(ev => <option key={ev._id} value={ev._id}>{ev.Name} ({ev.minTeamSize}–{ev.maxTeamSize} members)</option>)}
                                </select>
                                {events.length === 0 && <p className="text-xs text-gray-400 mt-1">No team-based events available.</p>}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Team Name</label>
                                <input type="text" required value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })}
                                    placeholder="Enter team name..."
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black focus:outline-none focus:ring-2 focus:ring-[#6366f1]" />
                            </div>
                            {form.eventId && (
                                <p className="text-xs text-gray-500">Team size: {events.find(e => e._id === form.eventId)?.minTeamSize || 2} – {events.find(e => e._id === form.eventId)?.maxTeamSize || 4} members (set by the organizer)</p>
                            )}
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 text-white rounded cursor-pointer ">Create</button>
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-300 text-gray-600 rounded cursor-pointer ">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoin && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowJoin(false)}>
                    <div className="bg-gray-50 border border-gray-200 border rounded p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-black mb-4">Join Team</h2>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Invite Code</label>
                                <input type="text" required value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter invite code"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black focus:outline-none focus:ring-2 focus:ring-[#6366f1]  tracking-widest text-center text-lg font-mono" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 text-white rounded cursor-pointer ">Join</button>
                                <button type="button" onClick={() => setShowJoin(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-300 text-gray-600 rounded cursor-pointer ">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team List */}
            {teams.length === 0 ? (
                <div className="text-center text-gray-400 py-12 bg-gray-50 border border-gray-200 border rounded">
                    No teams yet. Create or join a team for team events.
                </div>
            ) : (
                <div className="space-y-4">
                    {teams.map(team => {
                        const isLeader = team.leader?._id === user?.id;
                        const minSize = team.event?.minTeamSize || 2;
                        const canRegister = isLeader && team.status === 'forming' && team.members.length >= minSize;

                        return (
                            <div key={team._id} className="bg-gray-50 border border-gray-200 border rounded p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-black font-semibold text-lg">{team.name}</h3>
                                        <p className="text-gray-500 text-sm">{team.event?.Name || 'Unknown Event'}</p>
                                    </div>
                                    <span className={`text-xs px-3 py-1 rounded font-medium ${statusColors[team.status]}`}>
                                        {statusLabels[team.status] || team.status}
                                    </span>
                                </div>

                                {/* Invite Code */}
                                {team.status === 'forming' && (
                                    <div className="bg-white border border-gray-200 border rounded p-3 mb-3">
                                        <p className="text-[10px] text-gray-500   mb-1">Invite Code (share with teammates)</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-black font-medium font-mono text-lg font-bold tracking-widest">{team.inviteCode}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(team.inviteCode); toast.success('Copied!'); }}
                                                className="text-xs text-gray-500 hover:text-black cursor-pointer ">Copy</button>
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                <div className="mb-4">
                                    <p className="text-[10px] text-gray-500   mb-2">
                                        Members ({team.members.length}/{team.maxSize}) — Min: {minSize}
                                    </p>
                                    <div className="space-y-1">
                                        {team.members.map(m => (
                                            <div key={m._id} className="flex items-center justify-between text-sm py-1.5 px-3 bg-white rounded">
                                                <span className="text-black">{m.firstName} {m.lastName}</span>
                                                <span className="text-[10px] text-gray-400">
                                                    {m._id === team.leader?._id ? 'Leader' : 'Member'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                {team.status === 'forming' && (
                                    <div className="flex gap-2">
                                        {isLeader ? (
                                            <>
                                                <button
                                                    onClick={() => handleRegisterTeam(team)}
                                                    disabled={!canRegister || registeringTeamId === team._id}
                                                    className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-40 text-white font-medium rounded cursor-pointer  text-sm"
                                                >
                                                    {registeringTeamId === team._id
                                                        ? 'Registering...'
                                                        : `Register Team (${team.members.length}/${minSize} min)`}
                                                </button>
                                                <button onClick={() => handleCancel(team._id)}
                                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-400 text-black font-medium rounded cursor-pointer  text-sm">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleLeave(team._id)}
                                                className="px-4 py-2.5 bg-gray-100/20 hover:bg-gray-300/40 text-black text-sm rounded cursor-pointer ">
                                                Leave Team
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Registered confirmation */}
                                {team.status === 'complete' && (
                                    <div className="bg-gray-100/10 border border-gray-300 rounded p-3 text-center">
                                        <p className="text-black text-sm font-medium">Team registered successfully</p>
                                        {isLeader && <p className="text-[10px] text-gray-500 mt-1">QR code was sent to your email</p>}
                                        {!isLeader && <p className="text-[10px] text-gray-500 mt-1">Your team leader has the QR code for entry</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

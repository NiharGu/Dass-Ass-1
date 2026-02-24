import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DiscussionForum from '../../components/DiscussionForum';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [merchSelections, setMerchSelections] = useState([]);
  const [showForum, setShowForum] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [uploading, setUploading] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  // Team state
  const [myTeam, setMyTeam] = useState(null);
  const [teamMode, setTeamMode] = useState(null); // 'create' | 'join' | null
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/events/${id}`).then(res => {
      setEvent(res.data);
      if (res.data.Type === 'merchandise' && res.data.merchandiseDetails?.items) {
        setMerchSelections(res.data.merchandiseDetails.items.map(item => ({
          itemName: item.name, size: item.size, color: item.color, quantity: 0
        })));
      }
    }).catch(() => toast.error('Event not found'))
      .finally(() => setLoading(false));

    if (user?.role === 'participant') {
      API.get('/registration/my-registrations').then(res => {
        const reg = res.data.find(r => r.event?._id === id && r.status === 'registered');
        setMyRegistration(reg || null);
      }).catch(() => { });

      // Check if user has a team for this event
      API.get('/teams/my-teams').then(res => {
        const team = res.data.find(t => (t.event?._id === id || t.event === id));
        setMyTeam(team || null);
      }).catch(() => { });
    }
  }, [id]);

  const deadlinePassed = event && new Date() > new Date(event.registrationDeadline);
  const isPublished = event?.status === 'published';

  // File upload handler for custom form file fields
  const handleFileUpload = async (fieldName, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [fieldName]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormResponses(prev => ({ ...prev, [fieldName]: res.data.url }));
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Validate required custom form fields
  const validateFormFields = () => {
    if (!event?.customForm?.length) return true;
    for (const field of event.customForm) {
      if (field.required) {
        const val = formResponses[field.name];
        if (val === undefined || val === null || val === '' || val === false) {
          toast.error(`Please fill the required field: ${field.label || field.name}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleRegister = async () => {
    if (!user) return navigate('/login');
    if (!validateFormFields()) return;
    setRegistering(true);
    try {
      const body = {};
      if (event.Type === 'normal') body.formResponses = formResponses;
      if (event.Type === 'merchandise') {
        body.merchandiseSelections = merchSelections.filter(s => s.quantity > 0);
        if (body.merchandiseSelections.length === 0) {
          toast.error('Select at least one item');
          setRegistering(false);
          return;
        }
      }
      await API.post(`/registration/${id}/register`, body);
      toast.success('Registration successful! Check your email for the ticket.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const updateMerchQty = (idx, qty) => {
    setMerchSelections(prev => prev.map((s, i) => i === idx ? { ...s, quantity: Math.max(0, qty) } : s));
  };



  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;
  if (!event) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-500">Event not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-gray-50 border border-gray-200 border rounded p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">{event.Name}</h1>
            <p className="text-gray-500 mt-1 text-sm">{event.organizer?.organizerName || 'Unknown Organizer'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[10px] px-2.5 py-1 rounded font-medium  tracking-wide ${event.Type === 'merchandise' ? 'bg-gray-100 text-black' : 'bg-gray-100/30 text-black'
              }`}>{event.Type}</span>
            <span className={`text-[10px] px-2.5 py-1 rounded font-medium capitalize  tracking-wide ${event.eligibility === 'open' ? 'bg-gray-100 text-black' : 'bg-gray-100/30 text-black'
              }`}>{event.eligibility}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-6 whitespace-pre-wrap leading-relaxed">{event.Description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Start', value: new Date(event.StartDate).toLocaleDateString() },
            { label: 'End', value: new Date(event.EndDate).toLocaleDateString() },
            { label: 'Deadline', value: new Date(event.registrationDeadline).toLocaleDateString() },
            { label: 'Fee', value: event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 border rounded p-3">
              <p className="text-[10px] text-gray-400   font-medium">{item.label}</p>
              <p className="text-sm text-black mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {event.Tags?.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {event.Tags.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-white border border-gray-200 border text-gray-500 rounded">{tag}</span>
            ))}
          </div>
        )}

        {/* Registration Status */}
        {myRegistration && (
          <div className="bg-gray-100/10 border border-gray-300 rounded p-4 mb-6">
            <p className="text-black font-medium text-sm">You are registered</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
              <span>Status: <span className="text-black capitalize">{myRegistration.status}</span></span>
              <span>Attendance: <span className={`font-medium ${myRegistration.attended ? 'text-green-600' : 'text-gray-500'}`}>{myRegistration.attended ? 'Present' : 'Absent'}</span></span>
              {myRegistration.teamName && <span>Team: <span className="text-black font-medium">{myRegistration.teamName}</span></span>}
              <span>Ticket: <span className="font-mono text-black font-medium">{myRegistration.ticketId}</span></span>
            </div>
            {myRegistration.merchandiseSelections && myRegistration.merchandiseSelections.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Purchased:</p>
                {myRegistration.merchandiseSelections.map((item, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    {item.itemName} {item.size && `(${item.size})`} {item.color && `/ ${item.color}`} × {item.quantity}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}



        {/* Custom Form */}
        {event.customForm?.length > 0 && isPublished && !deadlinePassed && user?.role === 'participant' && !myRegistration && (
          <div className="border-t border-gray-200 border pt-6 mb-6">
            <h2 className="text-base font-semibold text-black mb-4">Registration Form</h2>
            <div className="space-y-4">
              {event.customForm.map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5  ">
                    {field.label || field.name} {field.required && <span className="text-black">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <select value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className={inputClass}>
                      <option value="">Select...</option>
                      {field.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={!!formResponses[field.name]}
                        onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.checked })}
                        className="accent-[#6366f1]" />
                      {field.label || field.name}
                    </label>
                  ) : field.type === 'textarea' ? (
                    <textarea value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className={inputClass} rows={3} />
                  ) : field.type === 'file' ? (
                    <div>
                      <div className="relative">
                        <input type="file"
                          onChange={(e) => handleFileUpload(field.name, e.target.files?.[0])}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-black text-white-important file:text-white file:text-xs file:cursor-pointer cursor-pointer focus:outline-none focus:border-black"
                          disabled={uploading[field.name]}
                        />
                        {uploading[field.name] && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded animate-spin" />
                          </div>
                        )}
                      </div>
                      {formResponses[field.name] && (
                        <p className="text-xs text-black mt-1.5">
                          Uploaded — <a href={formResponses[field.name]} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">View file</a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <input type={field.type || 'text'} value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merchandise */}
        {event.Type === 'merchandise' && event.merchandiseDetails?.items?.length > 0 && isPublished && !deadlinePassed && user?.role === 'participant' && (
          <div className="border-t border-gray-200 border pt-6 mb-6">
            <h2 className="text-base font-semibold text-black mb-4">Merchandise</h2>
            <div className="space-y-3">
              {event.merchandiseDetails.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-gray-200 border rounded p-4">
                  <div>
                    <p className="text-black font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`}
                      {' '}• ₹{item.price || 0} • Stock: {item.stock}
                      {item.purchaseLimit && ` • Max: ${item.purchaseLimit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) - 1)}
                      className="w-7 h-7 bg-gray-100 rounded text-black text-sm cursor-pointer hover:bg-gray-300 ">-</button>
                    <span className="w-6 text-center text-black text-sm">{merchSelections[i]?.quantity || 0}</span>
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) + 1)}
                      className="w-7 h-7 bg-gray-100 rounded text-black text-sm cursor-pointer hover:bg-gray-300 ">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register / Team Section */}
        {user?.role === 'participant' && isPublished && (
          <div className="border-t border-gray-200 border pt-6">
            {deadlinePassed ? (
              <p className="text-black text-center text-sm">Registration deadline has passed</p>
            ) : event.isTeamEvent && !myRegistration ? (
              /* ── Team Event Registration ── */
              <div>
                {myTeam ? (
                  /* Team Management Panel */
                  <div className="bg-white border border-gray-200 border rounded p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-black font-semibold text-sm">Team: {myTeam.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium  tracking-wide ${myTeam.status === 'complete' ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                        }`}>{myTeam.status === 'complete' ? 'Registered' : 'Forming'}</span>
                    </div>

                    {/* Invite Code */}
                    {myTeam.status === 'forming' && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-[10px] text-gray-500   mb-1">Invite Code</p>
                        <div className="flex items-center gap-2">
                          <code className="text-black font-medium font-mono text-lg font-bold tracking-widest">{myTeam.inviteCode}</code>
                          <button onClick={() => { navigator.clipboard.writeText(myTeam.inviteCode); toast.success('Code copied!'); }}
                            className="text-xs text-gray-500 hover:text-black cursor-pointer ">Copy</button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Share this code with teammates to join</p>
                      </div>
                    )}

                    {/* Members */}
                    <div>
                      <p className="text-[10px] text-gray-500   mb-2">
                        Members ({myTeam.members?.length || 0}/{myTeam.maxSize}) — Min: {event.minTeamSize}
                      </p>
                      <div className="space-y-1">
                        {myTeam.members?.map(m => (
                          <div key={m._id} className="flex items-center justify-between text-sm py-1.5 px-3 bg-gray-50 rounded">
                            <span className="text-black">{m.firstName} {m.lastName}</span>
                            <span className="text-[10px] text-gray-400">
                              {m._id === (myTeam.leader?._id || myTeam.leader) ? 'Leader' : 'Member'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Leader Actions */}
                    {myTeam.status === 'forming' && (myTeam.leader?._id || myTeam.leader) === user?.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!validateFormFields()) return;
                            setTeamLoading(true);
                            try {
                              await API.post(`/teams/${myTeam._id}/register`, { formResponses });
                              toast.success('Team registered! Check email for tickets.');
                              // Refresh data
                              const [regRes, teamRes] = await Promise.all([
                                API.get('/registration/my-registrations'),
                                API.get('/teams/my-teams')
                              ]);
                              const reg = regRes.data.find(r => r.event?._id === id && r.status === 'registered');
                              setMyRegistration(reg || null);
                              const updTeam = teamRes.data.find(t => (t.event?._id === id || t.event === id));
                              setMyTeam(updTeam || null);
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Registration failed');
                            } finally { setTeamLoading(false); }
                          }}
                          disabled={teamLoading || (myTeam.members?.length || 0) < event.minTeamSize}
                          className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-40 text-white font-medium rounded cursor-pointer  text-sm"
                        >
                          {teamLoading ? 'Registering...' : `Register Team (${myTeam.members?.length || 0}/${event.minTeamSize} min)`}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Cancel this team?')) return;
                            try {
                              await API.patch(`/teams/${myTeam._id}/cancel`);
                              setMyTeam(null);
                              toast.success('Team cancelled');
                            } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                          }}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-400 text-black font-medium rounded cursor-pointer  text-sm"
                        >Cancel</button>
                      </div>
                    )}

                    {/* Non-leader: leave option */}
                    {myTeam.status === 'forming' && (myTeam.leader?._id || myTeam.leader) !== user?.id && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Leave this team?')) return;
                          try {
                            await API.patch(`/teams/${myTeam._id}/leave`);
                            setMyTeam(null);
                            toast.success('Left team');
                          } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                        }}
                        className="w-full py-2 bg-gray-100/20 hover:bg-gray-300/40 text-black text-sm rounded cursor-pointer "
                      >Leave Team</button>
                    )}
                  </div>
                ) : (
                  /* Create or Join Team Options */
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      This is a team event ({event.minTeamSize}–{event.maxTeamSize} members)
                    </p>
                    {!teamMode ? (
                      <div className="flex gap-3">
                        <button onClick={() => setTeamMode('create')}
                          className="flex-1 py-3 bg-black text-white-important hover:bg-gray-900 text-white font-medium rounded cursor-pointer  text-sm">
                          Create Team
                        </button>
                        <button onClick={() => setTeamMode('join')}
                          className="flex-1 py-3 bg-white border border-gray-200 border hover:border-black text-black font-medium rounded cursor-pointer  text-sm">
                          Join Team
                        </button>
                      </div>
                    ) : teamMode === 'create' ? (
                      <div className="space-y-3">
                        <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                          placeholder="Enter team name..." className={inputClass} />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!teamName.trim()) return toast.error('Enter a team name');
                              setTeamLoading(true);
                              try {
                                const res = await API.post('/teams', { eventId: id, teamName: teamName.trim() });
                                setMyTeam(res.data);
                                setTeamMode(null);
                                toast.success('Team created! Share the invite code.');
                              } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                              finally { setTeamLoading(false); }
                            }}
                            disabled={teamLoading}
                            className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  text-sm"
                          >{teamLoading ? 'Creating...' : 'Create'}</button>
                          <button onClick={() => setTeamMode(null)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded cursor-pointer  text-sm hover:bg-gray-300"
                          >Back</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                          placeholder="Enter invite code..." className={`${inputClass} font-mono tracking-widest text-center text-lg`}
                          maxLength={8} />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!inviteCode.trim()) return toast.error('Enter the invite code');
                              setTeamLoading(true);
                              try {
                                const res = await API.post('/teams/join', { inviteCode: inviteCode.trim() });
                                // Refetch team with populated data
                                const teamRes = await API.get(`/teams/${res.data._id}`);
                                setMyTeam(teamRes.data);
                                setTeamMode(null);
                                toast.success('Joined team!');
                              } catch (err) { toast.error(err.response?.data?.message || 'Invalid code'); }
                              finally { setTeamLoading(false); }
                            }}
                            disabled={teamLoading}
                            className="flex-1 py-2.5 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  text-sm"
                          >{teamLoading ? 'Joining...' : 'Join'}</button>
                          <button onClick={() => setTeamMode(null)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded cursor-pointer  text-sm hover:bg-gray-300"
                          >Back</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : !myRegistration ? (
              /* Normal event register button */
              <button onClick={handleRegister} disabled={registering}
                className="w-full py-3 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
                {registering ? 'Registering...' : event.Type === 'merchandise' ? 'Purchase' : 'Register'}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Forum */}
      {user && isPublished && (
        <div className="mt-6">
          <button onClick={() => { setShowForum(!showForum); setUnreadCount(0); }}
            className="w-full py-3 bg-gray-50 border border-gray-200 border hover:border-gray-200 border text-black font-medium rounded cursor-pointer  text-sm relative">
            {showForum ? 'Hide Discussion' : 'Discussion Forum'}
            {!showForum && unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-black text-white-important text-white text-xs font-bold rounded animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          {showForum && (
            <div className="mt-4">
              <DiscussionForum
                eventId={id}
                isOrganizer={event.organizer?._id === user?.id}
                onNewMessage={(msg) => {
                  if (!showForum) {
                    setUnreadCount(prev => prev + 1);
                    const authorName = msg.author?.firstName || msg.author?.organizerName || 'Someone';
                    toast(`${authorName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`, {
                      duration: 3000,
                      style: { background: '#12141d', color: '#e2e4ef', border: '1px solid #1e2030' }
                    });
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  const handleRegister = async () => {
    if (!user) return navigate('/login');
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

  const handleDownloadICS = async () => {
    if (!myRegistration) return toast.error('You must be registered to add to calendar');
    try {
      const res = await API.get(`/registration/${myRegistration._id}/calendar`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.Name}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Calendar file downloaded');
    } catch { toast.error('Failed to download calendar file'); }
  };

  const getGoogleCalendarUrl = () => {
    if (!event) return '';
    const start = new Date(event.StartDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(event.EndDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.Name)}&dates=${start}/${end}&details=${encodeURIComponent(event.Description.substring(0, 200))}`;
  };

  const getOutlookCalendarUrl = () => {
    if (!event) return '';
    const start = new Date(event.StartDate).toISOString();
    const end = new Date(event.EndDate).toISOString();
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.Name)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(event.Description.substring(0, 200))}`;
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-white placeholder-[#3d4162] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/30";

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;
  if (!event) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-[#6b7394]">Event not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{event.Name}</h1>
            <p className="text-[#6b7394] mt-1 text-sm">{event.organizer?.organizerName || 'Unknown Organizer'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${event.Type === 'merchandise' ? 'bg-[#78350f]/30 text-[#fbbf24]' : 'bg-[#1e3a5f]/30 text-[#60a5fa]'
              }`}>{event.Type}</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium capitalize uppercase tracking-wide ${event.eligibility === 'open' ? 'bg-[#065f46]/30 text-[#34d399]' : 'bg-[#3b0764]/30 text-[#c084fc]'
              }`}>{event.eligibility}</span>
          </div>
        </div>

        <p className="text-[#8b8fad] mb-6 whitespace-pre-wrap leading-relaxed">{event.Description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Start', value: new Date(event.StartDate).toLocaleDateString() },
            { label: 'End', value: new Date(event.EndDate).toLocaleDateString() },
            { label: 'Deadline', value: new Date(event.registrationDeadline).toLocaleDateString() },
            { label: 'Fee', value: event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free' },
          ].map((item, i) => (
            <div key={i} className="bg-[#0c0e14] border border-[#1e2030] rounded-xl p-3">
              <p className="text-[10px] text-[#3d4162] uppercase tracking-wider font-medium">{item.label}</p>
              <p className="text-sm text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {event.Tags?.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {event.Tags.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-[#0c0e14] border border-[#1e2030] text-[#6b7394] rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Registration Status */}
        {myRegistration && (
          <div className="bg-[#065f46]/10 border border-[#065f46]/30 rounded-xl p-4 mb-6">
            <p className="text-[#34d399] font-medium text-sm">✓ You are registered</p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#8b8fad]">
              <span>Status: <span className="text-[#34d399] capitalize">{myRegistration.status}</span></span>
              {myRegistration.teamName && <span>Team: <span className="text-[#818cf8]">{myRegistration.teamName}</span></span>}
              <span>Ticket: <span className="font-mono text-[#818cf8]">{myRegistration.ticketId}</span></span>
            </div>
            {myRegistration.merchandiseSelections && myRegistration.merchandiseSelections.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-[#6b7394] mb-1">Purchased:</p>
                {myRegistration.merchandiseSelections.map((item, i) => (
                  <p key={i} className="text-xs text-[#8b8fad]">
                    {item.itemName} {item.size && `(${item.size})`} {item.color && `/ ${item.color}`} × {item.quantity}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        {myRegistration && (
          <div className="border-t border-[#1e2030] pt-4 mb-6">
            <p className="text-xs text-[#6b7394] mb-2 uppercase tracking-wider font-medium">Add to Calendar</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleDownloadICS}
                className="px-3 py-1.5 bg-[#0c0e14] border border-[#1e2030] hover:border-[#3d4162] text-[#8b8fad] text-xs rounded-lg cursor-pointer transition-all">
                📅 .ics
              </button>
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#0c0e14] border border-[#1e2030] hover:border-[#3d4162] text-[#8b8fad] text-xs rounded-lg transition-all">
                Google
              </a>
              <a href={getOutlookCalendarUrl()} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#0c0e14] border border-[#1e2030] hover:border-[#3d4162] text-[#8b8fad] text-xs rounded-lg transition-all">
                Outlook
              </a>
            </div>
          </div>
        )}

        {/* Custom Form */}
        {event.Type === 'normal' && event.customForm?.length > 0 && isPublished && !deadlinePassed && user?.role === 'participant' && (
          <div className="border-t border-[#1e2030] pt-6 mb-6">
            <h2 className="text-base font-semibold text-white mb-4">Registration Form</h2>
            <div className="space-y-4">
              {event.customForm.map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-[#8b8fad] mb-1.5 uppercase tracking-wider">
                    {field.label || field.name} {field.required && <span className="text-[#f87171]">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <select value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className={inputClass}>
                      <option value="">Select...</option>
                      {field.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-[#8b8fad] cursor-pointer">
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
                          className="w-full px-4 py-2.5 bg-[#0c0e14] border border-[#1e2030] rounded-xl text-sm text-[#8b8fad] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#6366f1] file:text-white file:text-xs file:cursor-pointer cursor-pointer focus:outline-none focus:border-[#6366f1]"
                          disabled={uploading[field.name]}
                        />
                        {uploading[field.name] && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {formResponses[field.name] && (
                        <p className="text-xs text-[#34d399] mt-1.5">
                          ✓ Uploaded — <a href={formResponses[field.name]} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#6ee7b7]">View file</a>
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
          <div className="border-t border-[#1e2030] pt-6 mb-6">
            <h2 className="text-base font-semibold text-white mb-4">Merchandise</h2>
            <div className="space-y-3">
              {event.merchandiseDetails.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0c0e14] border border-[#1e2030] rounded-xl p-4">
                  <div>
                    <p className="text-white font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-[#6b7394] mt-0.5">
                      {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`}
                      {' '}• ₹{item.price || 0} • Stock: {item.stock}
                      {item.purchaseLimit && ` • Max: ${item.purchaseLimit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) - 1)}
                      className="w-7 h-7 bg-[#1e2030] rounded-lg text-white text-sm cursor-pointer hover:bg-[#252839] transition">-</button>
                    <span className="w-6 text-center text-white text-sm">{merchSelections[i]?.quantity || 0}</span>
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) + 1)}
                      className="w-7 h-7 bg-[#1e2030] rounded-lg text-white text-sm cursor-pointer hover:bg-[#252839] transition">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register Button */}
        {user?.role === 'participant' && isPublished && (
          <div className="border-t border-[#1e2030] pt-6">
            {deadlinePassed ? (
              <p className="text-[#f87171] text-center text-sm">Registration deadline has passed</p>
            ) : (
              <button onClick={handleRegister} disabled={registering}
                className="w-full py-3 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-50 text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                {registering ? 'Registering...' : event.Type === 'merchandise' ? 'Purchase' : 'Register'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Forum */}
      {user && isPublished && (
        <div className="mt-6">
          <button onClick={() => setShowForum(!showForum)}
            className="w-full py-3 bg-[#12141d] border border-[#1e2030] hover:border-[#2a2d48] text-white font-medium rounded-2xl cursor-pointer transition-all text-sm">
            {showForum ? 'Hide Discussion' : '💬 Discussion Forum'}
          </button>
          {showForum && (
            <div className="mt-4">
              <DiscussionForum eventId={id} isOrganizer={event.organizer?._id === user?.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

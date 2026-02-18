import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [merchSelections, setMerchSelections] = useState([]);
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
  }, [id]);

  const deadlinePassed = event && new Date() > new Date(event.registrationDeadline);
  const isPublished = event?.status === 'published';

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
      const res = await API.post(`/registration/${id}/register`, body);
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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-400">Loading...</p></div>;
  if (!event) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-400">Event not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{event.Name}</h1>
            <p className="text-gray-400 mt-1">{event.organizer?.organizerName || 'Unknown Organizer'}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              event.Type === 'merchandise' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'
            }`}>{event.Type}</span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
              event.eligibility === 'open' ? 'bg-green-900/40 text-green-400' : 'bg-purple-900/40 text-purple-400'
            }`}>{event.eligibility}</span>
          </div>
        </div>

        <p className="text-gray-300 mb-6 whitespace-pre-wrap">{event.Description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Start</p>
            <p className="text-sm text-white">{new Date(event.StartDate).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">End</p>
            <p className="text-sm text-white">{new Date(event.EndDate).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="text-sm text-white">{new Date(event.registrationDeadline).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500">Fee</p>
            <p className="text-sm text-white">₹{event.registrationFee}</p>
          </div>
        </div>

        {event.Tags?.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {event.Tags.map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-gray-800 text-gray-400 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Custom Form for Normal Events */}
        {event.Type === 'normal' && event.customForm?.length > 0 && isPublished && !deadlinePassed && user?.role === 'participant' && (
          <div className="border-t border-gray-800 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Registration Form</h2>
            <div className="space-y-4">
              {event.customForm.map((field, i) => (
                <div key={i}>
                  <label className="block text-sm text-gray-300 mb-1">
                    {field.label || field.name} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <select value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select...</option>
                      {field.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={!!formResponses[field.name]}
                        onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.checked })} />
                      {field.label || field.name}
                    </label>
                  ) : field.type === 'textarea' ? (
                    <textarea value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3} />
                  ) : (
                    <input type={field.type || 'text'} value={formResponses[field.name] || ''}
                      onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merchandise Items */}
        {event.Type === 'merchandise' && event.merchandiseDetails?.items?.length > 0 && isPublished && !deadlinePassed && user?.role === 'participant' && (
          <div className="border-t border-gray-800 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Merchandise</h2>
            <div className="space-y-3">
              {event.merchandiseDetails.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.size && `Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                      {' '}• Stock: {item.stock}
                      {item.purchaseLimit && ` • Max: ${item.purchaseLimit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) - 1)}
                      className="w-8 h-8 bg-gray-700 rounded text-white text-lg cursor-pointer hover:bg-gray-600">-</button>
                    <span className="w-8 text-center text-white">{merchSelections[i]?.quantity || 0}</span>
                    <button onClick={() => updateMerchQty(i, (merchSelections[i]?.quantity || 0) + 1)}
                      className="w-8 h-8 bg-gray-700 rounded text-white text-lg cursor-pointer hover:bg-gray-600">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register Button */}
        {user?.role === 'participant' && isPublished && (
          <div className="border-t border-gray-800 pt-6">
            {deadlinePassed ? (
              <p className="text-red-400 text-center">Registration deadline has passed</p>
            ) : (
              <button onClick={handleRegister} disabled={registering}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition text-lg">
                {registering ? 'Registering...' : event.Type === 'merchandise' ? 'Purchase' : 'Register'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

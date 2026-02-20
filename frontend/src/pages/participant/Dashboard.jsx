import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'upcoming', label: 'Upcoming/Ongoing' },
  { key: 'normal', label: 'Normal' },
  { key: 'merchandise', label: 'Merchandise' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function ParticipantDashboard() {
  const [tab, setTab] = useState('upcoming');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get(`/registration/my-registrations?filter=${tab}`)
      .then(res => setRegistrations(res.data))
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, [tab]);

  const cancelRegistration = async (regId) => {
    if (!confirm('Cancel this registration?')) return;
    try {
      await API.patch(`/registration/registration/${regId}/cancel`);
      toast.success('Registration cancelled');
      setRegistrations(prev => prev.filter(r => r._id !== regId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleViewTicket = (reg) => {
    if (reg.qrCode) {
      setQrCode(reg.qrCode);
      setShowQrModal(true);
    } else {
      toast.error('QR Code not available');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Events</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : registrations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No events found</p>
          <Link to="/events" className="text-indigo-400 hover:underline">Browse events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => (
            <div key={reg._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/events/${reg.event?._id}`}
                    className="text-lg font-semibold text-white hover:text-indigo-400 transition">
                    {reg.event?.Name || 'Unknown Event'}
                  </Link>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                    <span className="capitalize">{reg.event?.Type}</span>
                    <span>•</span>
                    <span>{reg.event?.organizer?.organizerName || 'Unknown Organizer'}</span>
                    <span>•</span>
                    <span>{reg.event?.StartDate ? new Date(reg.event.StartDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span>Ticket: </span>
                    <button
                      onClick={() => handleViewTicket(reg)}
                      className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                      title="Click to view QR Code"
                    >
                      {reg.ticketId}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${reg.status === 'registered' ? 'bg-green-900/40 text-green-400'
                    : 'bg-red-900/40 text-red-400'
                    }`}>
                    {reg.status}
                  </span>
                  {reg.status === 'registered' && (
                    <button onClick={async () => {
                      try {
                        const res = await API.get(`/registration/${reg._id}/calendar`, { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `${reg.event?.Name || 'event'}.ics`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                      } catch { toast.error('Failed to download calendar'); }
                    }}
                      className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer" title="Add to Calendar">
                      📅
                    </button>
                  )}
                  {reg.status === 'registered' && tab !== 'completed' && (
                    <button onClick={() => cancelRegistration(reg._id)}
                      className="text-xs text-red-400 hover:text-red-300 cursor-pointer">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Event Ticket</h3>

            {qrCode ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg shadow-black/50">
                  <img src={qrCode} alt="Ticket QR" className="w-56 h-56 object-contain" />
                </div>
                <p className="text-gray-400 text-sm">Present this QR code at the event venue for entry.</p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-red-400">
                <p>Failed to load QR Code. Please try again.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

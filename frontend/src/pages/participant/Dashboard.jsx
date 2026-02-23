import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'normal', label: 'Normal' },
  { key: 'merchandise', label: 'Merch' },
  { key: 'completed', label: 'Done' },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">My Events</h1>

      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap cursor-pointer  ${tab === t.key
              ? 'bg-black text-white-important text-white shadow shadow -200'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-300 border border-gray-200 border'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">No events here</p>
          <Link to="/events" className="text-black font-medium hover:text-gray-600 text-sm ">Browse events →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <div key={reg._id} className="bg-gray-50 border border-gray-200 border rounded p-5 hover:border-gray-200 border ">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/events/${reg.event?._id}`}
                    className="text-[15px] font-semibold text-black hover:text-black font-medium ">
                    {reg.event?.Name || 'Unknown Event'}
                  </Link>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="capitalize">{reg.event?.Type}</span>
                    <span className="text-gray-400">•</span>
                    <span>{reg.event?.organizer?.organizerName || 'Unknown'}</span>
                    <span className="text-gray-400">•</span>
                    <span>{reg.event?.StartDate ? new Date(reg.event.StartDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <span>Ticket: </span>
                    <button
                      onClick={() => handleViewTicket(reg)}
                      className="font-mono text-black font-medium hover:text-gray-600 hover:underline cursor-pointer"
                      title="View QR Code"
                    >
                      {reg.ticketId}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded font-medium  tracking-wide ${reg.status === 'registered' ? 'bg-gray-100 text-black' : 'bg-gray-100 text-black'
                    }`}>
                    {reg.status}
                  </span>

                  {reg.status === 'registered' && tab !== 'completed' && (
                    <button onClick={() => cancelRegistration(reg._id)}
                      className="text-xs text-black hover:text-gray-600 cursor-pointer">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-gray-50 border border-gray-200 border rounded p-6 max-w-sm w-full text-center relative shadow" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black  cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-black mb-5">Event Ticket</h3>

            {qrCode ? (
              <div>
                <div className="bg-white p-4 rounded inline-block mb-5">
                  <img src={qrCode} alt="Ticket QR" className="w-52 h-52 object-contain" />
                </div>
                <p className="text-gray-500 text-sm">Present this QR code at the venue.</p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-black">
                <p>Failed to load QR Code.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

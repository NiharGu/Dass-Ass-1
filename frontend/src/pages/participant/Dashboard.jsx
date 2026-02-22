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
      <h1 className="text-2xl font-bold text-white mb-6">My Events</h1>

      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all ${tab === t.key
              ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
              : 'bg-[#12141d] text-[#6b7394] hover:bg-[#1e2030] border border-[#1e2030]'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#3d4162] mb-4">No events here</p>
          <Link to="/events" className="text-[#818cf8] hover:text-[#a5b4fc] text-sm transition">Browse events →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <div key={reg._id} className="bg-[#12141d] border border-[#1e2030] rounded-xl p-5 hover:border-[#2a2d48] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/events/${reg.event?._id}`}
                    className="text-[15px] font-semibold text-white hover:text-[#818cf8] transition">
                    {reg.event?.Name || 'Unknown Event'}
                  </Link>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[#6b7394]">
                    <span className="capitalize">{reg.event?.Type}</span>
                    <span className="text-[#3d4162]">•</span>
                    <span>{reg.event?.organizer?.organizerName || 'Unknown'}</span>
                    <span className="text-[#3d4162]">•</span>
                    <span>{reg.event?.StartDate ? new Date(reg.event.StartDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="mt-2 text-xs text-[#3d4162]">
                    <span>Ticket: </span>
                    <button
                      onClick={() => handleViewTicket(reg)}
                      className="font-mono text-[#818cf8] hover:text-[#a5b4fc] hover:underline cursor-pointer"
                      title="View QR Code"
                    >
                      {reg.ticketId}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${reg.status === 'registered' ? 'bg-[#065f46]/30 text-[#34d399]' : 'bg-[#7f1d1d]/30 text-[#f87171]'
                    }`}>
                    {reg.status}
                  </span>

                  {reg.status === 'registered' && tab !== 'completed' && (
                    <button onClick={() => cancelRegistration(reg._id)}
                      className="text-xs text-[#f87171] hover:text-[#fca5a5] cursor-pointer">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-[#6b7394] hover:text-white transition cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-5">Event Ticket</h3>

            {qrCode ? (
              <div>
                <div className="bg-white p-4 rounded-xl inline-block mb-5">
                  <img src={qrCode} alt="Ticket QR" className="w-52 h-52 object-contain" />
                </div>
                <p className="text-[#6b7394] text-sm">Present this QR code at the venue.</p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[#f87171]">
                <p>Failed to load QR Code.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

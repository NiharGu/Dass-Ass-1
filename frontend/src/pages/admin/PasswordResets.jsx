import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function PasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [comments, setComments] = useState({}); // { requestId: commentText }

  useEffect(() => { fetchRequests(); }, [tab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = tab === 'all'
        ? '/admin/password-reset-requests'
        : `/admin/password-reset-requests?status=${tab}`;
      const res = await API.get(url);
      setRequests(res.data);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, requestId) => {
    try {
      await API.post(`/admin/users/${userId}/reset-password`, {
        comment: comments[requestId] || ''
      });
      toast.success('Password reset approved');
      setComments(prev => { const copy = { ...prev }; delete copy[requestId]; return copy; });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async (userId, requestId) => {
    try {
      await API.post(`/admin/users/${userId}/reject-reset`, {
        comment: comments[requestId] || ''
      });
      toast.success('Request rejected');
      setComments(prev => { const copy = { ...prev }; delete copy[requestId]; return copy; });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  const statusColors = {
    pending: 'bg-gray-200 text-black',
    approved: 'bg-gray-200/40 text-black',
    rejected: 'bg-gray-200/40 text-black'
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">Password Reset Requests</h1>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded p-1 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded text-sm font-medium cursor-pointer capitalize ${tab === t ? 'bg-white border border-gray-200 shadow-sm text-black' : 'text-gray-500 hover:text-black'
              }`}>
            {t}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-50 border border-gray-200 rounded">
          No {tab === 'all' ? '' : tab} password reset requests
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-white border border-gray-200 rounded p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-black font-semibold">{req.user?.organizerName || req.user?.email}</h3>
                    <span className={`text-[10px] px-2.5 py-1 rounded font-medium capitalize tracking-wide ${statusColors[req.status] || 'bg-gray-100 text-black'}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{req.user?.email}</p>
                  {req.reason && <p className="text-sm text-gray-700 mt-2"><span className="text-gray-400 font-medium">Reason:</span> {req.reason}</p>}
                  <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(req.createdAt).toLocaleDateString()}</p>

                  {/* Show admin comment if resolved */}
                  {req.status !== 'pending' && req.adminComment && (
                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Admin Comment:</p>
                      <p className="text-sm text-gray-800">{req.adminComment}</p>
                    </div>
                  )}
                  {req.resolvedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      {req.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(req.resolvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions for pending requests */}
                {req.status === 'pending' && (
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                    <button onClick={() => handleApprove(req.user?._id, req._id)}
                      className="px-5 py-2 bg-black text-white-important text-white text-sm font-medium rounded hover:bg-gray-800 cursor-pointer">
                      Approve
                    </button>
                    <button onClick={() => handleReject(req.user?._id, req._id)}
                      className="px-5 py-2 bg-white border border-gray-300 text-black text-sm font-medium rounded hover:bg-gray-50 cursor-pointer">
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Comment input for pending requests */}
              {req.status === 'pending' && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <input
                    type="text"
                    placeholder="Add a comment (optional)..."
                    value={comments[req._id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [req._id]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded text-black text-sm focus:outline-none focus:border-black placeholder-gray-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

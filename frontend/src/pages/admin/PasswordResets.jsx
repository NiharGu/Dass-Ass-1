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
    pending: 'bg-yellow-900/40 text-yellow-400',
    approved: 'bg-green-900/40 text-green-400',
    rejected: 'bg-red-900/40 text-red-400'
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Password Reset Requests</h1>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium cursor-pointer transition capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
            {t}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-900 border border-gray-800 rounded-2xl">
          No {tab === 'all' ? '' : tab} password reset requests
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{req.user?.organizerName || req.user?.email}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{req.user?.email}</p>
                  {req.reason && <p className="text-sm text-gray-300 mt-2"><span className="text-gray-500">Reason:</span> {req.reason}</p>}
                  <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(req.createdAt).toLocaleString()}</p>

                  {/* Show admin comment if resolved */}
                  {req.status !== 'pending' && req.adminComment && (
                    <div className="mt-2 bg-gray-800 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Admin Comment:</p>
                      <p className="text-sm text-gray-300">{req.adminComment}</p>
                    </div>
                  )}
                  {req.resolvedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {req.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(req.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Actions for pending requests */}
                {req.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-4 shrink-0">
                    <button onClick={() => handleApprove(req.user?._id, req._id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition">
                      Approve
                    </button>
                    <button onClick={() => handleReject(req.user?._id, req._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg cursor-pointer transition">
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Comment input for pending requests */}
              {req.status === 'pending' && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <input
                    type="text"
                    placeholder="Add a comment (optional)..."
                    value={comments[req._id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [req._id]: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
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

import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function PasswordResets() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/password-reset-requests');
      setRequests(res.data);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.post(`/admin/users/${id}/reset-password`);
      toast.success('Password reset approved');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await API.delete(`/admin/users/${id}/reset-request`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Password Reset Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-900 border border-gray-800 rounded-2xl">
          No pending password reset requests
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-white font-medium">{req.user?.organizerName || req.user?.email}</h3>
                  <p className="text-sm text-gray-400">{req.user?.email}</p>
                  {req.reason && <p className="text-sm text-gray-300 mt-2"><span className="text-gray-500">Reason:</span> {req.reason}</p>}
                  <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.user?._id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg cursor-pointer transition">
                    Approve
                  </button>
                  <button onClick={() => handleReject(req.user?._id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg cursor-pointer transition">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

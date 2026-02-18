import { useEffect, useState } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/admin/dashboard');
        setStats(res.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0 },
    { label: 'Participants', value: stats?.totalParticipants || 0 },
    { label: 'Organizers', value: stats?.totalOrganizers || 0 },
    { label: 'Total Events', value: stats?.totalEvents || 0 },
    { label: 'Published Events', value: stats?.publishedEvents || 0 },
    { label: 'Total Registrations', value: stats?.totalRegistrations || 0 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-white">{c.value}</p>
            <p className="text-sm text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

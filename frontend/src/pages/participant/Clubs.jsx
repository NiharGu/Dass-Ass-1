import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    API.get('/organizers').then(res => {
      setClubs(res.data);
      setLoading(false);
    });
  }, []);

  const isFollowing = (id) => (user?.followedClubs || []).includes(id);

  const toggleFollow = async (id) => {
    try {
      if (isFollowing(id)) {
        await API.delete(`/organizers/${id}/unfollow`);
        const updated = { ...user, followedClubs: user.followedClubs.filter(c => c !== id) };
        updateUser(updated);
        toast.success('Unfollowed');
      } else {
        await API.post(`/organizers/${id}/follow`);
        const updated = { ...user, followedClubs: [...(user.followedClubs || []), id] };
        updateUser(updated);
        toast.success('Followed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Clubs & Organizers</h1>

      {clubs.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No clubs found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clubs.map(club => (
            <div key={club._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <Link to={`/clubs/${club._id}`} className="hover:text-indigo-400 transition">
                  <h3 className="text-white font-semibold text-lg">{club.organizerName}</h3>
                  <p className="text-sm text-indigo-400">{club.category}</p>
                </Link>
                {user?.role === 'participant' && (
                  <button onClick={() => toggleFollow(club._id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition ${
                      isFollowing(club._id)
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}>
                    {isFollowing(club._id) ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">{club.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

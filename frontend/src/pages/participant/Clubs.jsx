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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">Clubs & Organizers</h1>

      {clubs.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No clubs found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clubs.map(club => (
            <div key={club._id} className="bg-gray-50 border border-gray-200 border rounded p-5 hover:border-gray-200 border  ">
              <div className="flex items-start justify-between">
                <Link to={`/clubs/${club._id}`} className="hover:text-black font-medium ">
                  <h3 className="text-black font-semibold text-base">{club.organizerName}</h3>
                  <p className="text-xs text-black font-medium mt-0.5">{Array.isArray(club.category) ? club.category.join(', ') : club.category}</p>
                </Link>
                {user?.role === 'participant' && (
                  <button onClick={() => toggleFollow(club._id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded cursor-pointer  ${isFollowing(club._id)
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-300 border border-gray-200 border'
                        : 'bg-black text-white-important text-white hover:bg-gray-900'
                      }`}>
                    {isFollowing(club._id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{club.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

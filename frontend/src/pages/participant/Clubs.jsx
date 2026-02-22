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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Clubs & Organizers</h1>

      {clubs.length === 0 ? (
        <p className="text-[#3d4162] text-center py-16">No clubs found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clubs.map(club => (
            <div key={club._id} className="bg-[#12141d] border border-[#1e2030] rounded-xl p-5 hover:border-[#2a2d48] transition-all card-hover">
              <div className="flex items-start justify-between">
                <Link to={`/clubs/${club._id}`} className="hover:text-[#818cf8] transition">
                  <h3 className="text-white font-semibold text-base">{club.organizerName}</h3>
                  <p className="text-xs text-[#818cf8] mt-0.5">{Array.isArray(club.category) ? club.category.join(', ') : club.category}</p>
                </Link>
                {user?.role === 'participant' && (
                  <button onClick={() => toggleFollow(club._id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${isFollowing(club._id)
                        ? 'bg-[#1e2030] text-[#6b7394] hover:bg-[#252839] border border-[#1e2030]'
                        : 'bg-[#6366f1] text-white hover:bg-[#818cf8]'
                      }`}>
                    {isFollowing(club._id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              <p className="text-sm text-[#6b7394] mt-2 line-clamp-2 leading-relaxed">{club.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

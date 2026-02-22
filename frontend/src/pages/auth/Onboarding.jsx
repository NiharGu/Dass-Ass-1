import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const INTERESTS = ['Sports', 'Cultural', 'Technical', 'Music', 'Dance', 'Drama', 'Art', 'Literature', 'Social', 'Other'];

export default function Onboarding() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/organizers').then(res => {
      setAllClubs(res.data);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleClub = (id) => {
    setClubs(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    try {
      const res = await API.patch('/profile', { selectedInterests, followedClubs: clubs });
      updateUser(res.data.user);
      toast.success('Preferences saved!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  const handleSkip = () => navigate('/dashboard');

  return (
    <div className="min-h-screen bg-[#0c0e14] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome to Felicity!</h1>
        <p className="text-[#6b7394] text-center mb-10">Personalize your experience</p>

        <div className="bg-[#12141d] rounded-2xl p-8 border border-[#1e2030] mb-6 shadow-2xl shadow-black/40">
          <h2 className="text-base font-semibold text-white mb-4">Areas of Interest</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${selectedInterests.includes(interest)
                    ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                    : 'bg-[#0c0e14] text-[#6b7394] border border-[#1e2030] hover:border-[#3d4162]'
                  }`}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        {loaded && allClubs.length > 0 && (
          <div className="bg-[#12141d] rounded-2xl p-8 border border-[#1e2030] mb-6 shadow-2xl shadow-black/40">
            <h2 className="text-base font-semibold text-white mb-4">Follow Clubs / Organizers</h2>
            <div className="space-y-3">
              {allClubs.map((club) => (
                <button key={club._id} onClick={() => toggleClub(club._id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer ${clubs.includes(club._id)
                      ? 'bg-[#1e1b4b]/30 border border-[#4f46e5]/40'
                      : 'bg-[#0c0e14] border border-[#1e2030] hover:border-[#3d4162]'
                    }`}>
                  <p className="text-white font-medium text-sm text-left">{club.organizerName}</p>
                  <p className="text-[#8b8fad] text-xs text-left mt-0.5">
                    {Array.isArray(club.category) ? club.category.join(' • ') : club.category}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button onClick={handleSkip}
            className="flex-1 py-3 bg-[#12141d] border border-[#1e2030] hover:border-[#3d4162] text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
            Skip for now
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 bg-[#6366f1] hover:bg-[#818cf8] text-white font-medium rounded-xl cursor-pointer transition-all active:scale-[0.98]">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

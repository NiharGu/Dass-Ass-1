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
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black text-center mb-2">Welcome to Felicity!</h1>
        <p className="text-gray-500 text-center mb-10">Personalize your experience</p>

        <div className="bg-gray-50 rounded p-8 border border-gray-200 border mb-6 shadow shadow -200">
          <h2 className="text-base font-semibold text-black mb-4">Areas of Interest</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded text-sm font-medium cursor-pointer  ${selectedInterests.includes(interest)
                    ? 'bg-black text-white-important text-white shadow shadow -200'
                    : 'bg-white text-gray-500 border border-gray-200 border hover:border-gray-300 border'
                  }`}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        {loaded && allClubs.length > 0 && (
          <div className="bg-gray-50 rounded p-8 border border-gray-200 border mb-6 shadow shadow -200">
            <h2 className="text-base font-semibold text-black mb-4">Follow Clubs / Organizers</h2>
            <div className="space-y-3">
              {allClubs.map((club) => (
                <button key={club._id} onClick={() => toggleClub(club._id)}
                  className={`w-full text-left px-4 py-3 rounded  cursor-pointer ${clubs.includes(club._id)
                      ? 'bg-gray-100 border border-gray-300 border'
                      : 'bg-white border border-gray-200 border hover:border-gray-300 border'
                    }`}>
                  <p className="text-black font-medium text-sm text-left">{club.organizerName}</p>
                  <p className="text-gray-600 text-xs text-left mt-0.5">
                    {Array.isArray(club.category) ? club.category.join(' • ') : club.category}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button onClick={handleSkip}
            className="flex-1 py-3 bg-gray-50 border border-gray-200 border hover:border-gray-300 border text-black font-medium rounded cursor-pointer  ">
            Skip for now
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 bg-black text-white-important hover:bg-gray-900 text-white font-medium rounded cursor-pointer  ">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

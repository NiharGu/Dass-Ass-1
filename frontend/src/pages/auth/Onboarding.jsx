import { useState } from 'react';
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

  useState(() => {
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
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome to Felicity!</h1>
        <p className="text-gray-400 text-center mb-10">Personalize your experience</p>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Areas of Interest</h2>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition ${
                  selectedInterests.includes(interest)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        {loaded && allClubs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Follow Clubs / Organizers</h2>
            <div className="space-y-3">
              {allClubs.map((club) => (
                <button key={club._id} onClick={() => toggleClub(club._id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition cursor-pointer ${
                    clubs.includes(club._id)
                      ? 'bg-indigo-600/20 border border-indigo-500'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                  }`}>
                  <p className="text-white font-medium">{club.organizerName}</p>
                  <p className="text-gray-400 text-sm">{club.category}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button onClick={handleSkip}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg cursor-pointer transition">
            Skip for now
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg cursor-pointer transition">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

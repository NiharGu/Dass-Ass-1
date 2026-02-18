import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';

export default function OrganizerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/organizers/${id}?filter=${filter}`).then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, [id, filter]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-400">Loading...</p></div>;
  if (!data) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-400">Organizer not found</p></div>;

  const { organizer, events } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white">{organizer.organizerName}</h1>
        <p className="text-indigo-400 mt-1">{organizer.category}</p>
        <p className="text-gray-400 mt-3">{organizer.description}</p>
        <p className="text-sm text-gray-500 mt-2">Contact: {organizer.contact}</p>
      </div>

      <div className="flex gap-2 mb-4">
        {['upcoming', 'past'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No {filter} events</p>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{ev.Name}</h3>
                  <p className="text-sm text-gray-400">{new Date(ev.StartDate).toLocaleDateString()} • {ev.Type}</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-gray-800 text-gray-400 rounded-full capitalize">{ev.eligibility}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded animate-spin" /></div></div>;
  if (!data) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-gray-500">Organizer not found</p></div>;

  const { organizer, events } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-gray-50 border border-gray-200 border rounded p-6 mb-6">
        <h1 className="text-2xl font-bold text-black">{organizer.organizerName}</h1>
        <p className="text-black font-medium mt-1 text-sm">{Array.isArray(organizer.category) ? organizer.category.join(', ') : organizer.category}</p>
        <p className="text-gray-500 mt-3 leading-relaxed">{organizer.description}</p>
        <p className="text-xs text-gray-400 mt-3">Contact: {organizer.contact}</p>
      </div>

      <div className="flex gap-1.5 mb-4">
        {['upcoming', 'past'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded text-sm font-medium capitalize cursor-pointer  ${filter === f
                ? 'bg-black text-white-important text-white shadow shadow -200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-300 border border-gray-200 border'
              }`}>
            {f}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No {filter} events</p>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`}
              className="block bg-gray-50 border border-gray-200 border rounded p-4 hover:border-gray-200 border  ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-black font-semibold text-[15px]">{ev.Name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(ev.StartDate).toLocaleDateString()} • {ev.Type}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-gray-100 text-gray-500 rounded capitalize font-medium">{ev.eligibility}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="text-center py-20"><div className="inline-block w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" /></div></div>;
  if (!data) return <div className="max-w-4xl mx-auto px-4 py-8"><p className="text-[#6b7394]">Organizer not found</p></div>;

  const { organizer, events } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-[#12141d] border border-[#1e2030] rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-white">{organizer.organizerName}</h1>
        <p className="text-[#818cf8] mt-1 text-sm">{Array.isArray(organizer.category) ? organizer.category.join(', ') : organizer.category}</p>
        <p className="text-[#6b7394] mt-3 leading-relaxed">{organizer.description}</p>
        <p className="text-xs text-[#3d4162] mt-3">Contact: {organizer.contact}</p>
      </div>

      <div className="flex gap-1.5 mb-4">
        {['upcoming', 'past'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-all ${filter === f
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/20'
                : 'bg-[#12141d] text-[#6b7394] hover:bg-[#1e2030] border border-[#1e2030]'
              }`}>
            {f}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-[#3d4162] text-center py-8">No {filter} events</p>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <Link key={ev._id} to={`/events/${ev._id}`}
              className="block bg-[#12141d] border border-[#1e2030] rounded-xl p-4 hover:border-[#2a2d48] transition-all card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-[15px]">{ev.Name}</h3>
                  <p className="text-xs text-[#6b7394] mt-1">{new Date(ev.StartDate).toLocaleDateString()} • {ev.Type}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 bg-[#1e2030] text-[#6b7394] rounded-full capitalize font-medium">{ev.eligibility}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

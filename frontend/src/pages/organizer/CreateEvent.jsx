import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const FIELD_TYPES = ['text', 'number', 'email', 'dropdown', 'checkbox', 'textarea', 'file'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    Name: '', Description: '', Type: 'normal', eligibility: 'open',
    registrationDeadline: '', StartDate: '', EndDate: '',
    registrationLimit: 100, registrationFee: 0, Tags: '',
    isTeamEvent: false, minTeamSize: 2, maxTeamSize: 4,
  });
  const [customForm, setCustomForm] = useState([]);
  const [merchItems, setMerchItems] = useState([]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Form builder
  const addField = () => {
    setCustomForm([...customForm, { name: '', label: '', type: 'text', required: false, options: '' }]);
  };
  const updateField = (idx, key, val) => {
    setCustomForm(prev => prev.map((f, i) => i === idx ? { ...f, [key]: val } : f));
  };
  const removeField = (idx) => setCustomForm(prev => prev.filter((_, i) => i !== idx));
  const moveField = (idx, dir) => {
    const newFields = [...customForm];
    const target = idx + dir;
    if (target < 0 || target >= newFields.length) return;
    [newFields[idx], newFields[target]] = [newFields[target], newFields[idx]];
    setCustomForm(newFields);
  };

  // Merchandise items
  const addMerchItem = () => {
    setMerchItems([...merchItems, { name: '', size: '', color: '', stock: 0, purchaseLimit: 1 }]);
  };
  const updateMerchItem = (idx, key, val) => {
    setMerchItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };
  const removeMerchItem = (idx) => setMerchItems(prev => prev.filter((_, i) => i !== idx));

  // Helper to build event body
  const buildBody = () => {
    const body = {
      ...form,
      registrationLimit: Number(form.registrationLimit),
      registrationFee: Number(form.registrationFee),
      Tags: form.Tags ? form.Tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isTeamEvent: form.isTeamEvent,
      minTeamSize: Number(form.minTeamSize),
      maxTeamSize: Number(form.maxTeamSize),
    };
    if (form.Type === 'normal') {
      body.customForm = customForm.map(f => ({
        ...f,
        options: f.type === 'dropdown' ? f.options.split(',').map(o => o.trim()).filter(Boolean) : undefined
      }));
    }
    if (form.Type === 'merchandise') {
      body.merchandiseDetails = {
        items: merchItems.map(item => ({
          ...item,
          stock: Number(item.stock),
          purchaseLimit: Number(item.purchaseLimit)
        }))
      };
    }
    return body;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.post('/events', buildBody());
      toast.success('Event created as draft!');
      navigate(`/organizer/events/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndPublish = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = buildBody();
      body.status = "published";
      const res = await API.post(`/events`, body);
      toast.success('Event created and published!');
      navigate(`/organizer/events/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create & publish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Basic Info</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Event Name</label>
            <input type="text" required value={form.Name} onChange={set('Name')}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea required value={form.Description} onChange={set('Description')} rows={4}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Event Type</label>
              <select value={form.Type} onChange={set('Type')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="normal">Normal</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Eligibility</label>
              <select value={form.eligibility} onChange={set('eligibility')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="open">Open</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit">Non-IIIT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input type="date" required value={form.StartDate} onChange={set('StartDate')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input type="date" required value={form.EndDate} onChange={set('EndDate')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Deadline</label>
              <input type="date" required value={form.registrationDeadline} onChange={set('registrationDeadline')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Limit</label>
              <input type="number" required min={1} value={form.registrationLimit} onChange={set('registrationLimit')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Fee (₹)</label>
              <input type="number" required min={0} value={form.registrationFee} onChange={set('registrationFee')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
              <input type="text" value={form.Tags} onChange={set('Tags')} placeholder="music, outdoor"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Team Event Settings */}
          <div className="border-t border-gray-800 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isTeamEvent}
                onChange={(e) => setForm({ ...form, isTeamEvent: e.target.checked })}
                className="w-4 h-4 accent-indigo-500" />
              <span className="text-sm text-gray-300">This is a team-based event (hackathon)</span>
            </label>
            {form.isTeamEvent && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min Team Size</label>
                  <input type="number" min={2} max={20} value={form.minTeamSize}
                    onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Team Size</label>
                  <input type="number" min={2} max={20} value={form.maxTeamSize}
                    onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Builder for Normal Events */}
        {form.Type === 'normal' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Custom Registration Form</h2>
              <button type="button" onClick={addField}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg cursor-pointer transition">
                + Add Field
              </button>
            </div>

            {customForm.length === 0 && (
              <p className="text-gray-500 text-sm">No custom fields yet. Add fields to create a registration form.</p>
            )}

            <div className="space-y-3">
              {customForm.map((field, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <input type="text" placeholder="Field name" value={field.name}
                      onChange={(e) => updateField(i, 'name', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <input type="text" placeholder="Label" value={field.label}
                      onChange={(e) => updateField(i, 'label', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <select value={field.type} onChange={(e) => updateField(i, 'type', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none">
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={field.required}
                          onChange={(e) => updateField(i, 'required', e.target.checked)} />
                        Req
                      </label>
                      <button type="button" onClick={() => moveField(i, -1)} className="text-gray-400 hover:text-white cursor-pointer">↑</button>
                      <button type="button" onClick={() => moveField(i, 1)} className="text-gray-400 hover:text-white cursor-pointer">↓</button>
                      <button type="button" onClick={() => removeField(i)} className="text-red-400 hover:text-red-300 cursor-pointer">✕</button>
                    </div>
                  </div>
                  {field.type === 'dropdown' && (
                    <input type="text" placeholder="Options (comma separated)" value={field.options}
                      onChange={(e) => updateField(i, 'options', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merchandise Items */}
        {form.Type === 'merchandise' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Merchandise Items</h2>
              <button type="button" onClick={addMerchItem}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg cursor-pointer transition">
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {merchItems.map((item, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-6 gap-3">
                    <input type="text" placeholder="Name" value={item.name}
                      onChange={(e) => updateMerchItem(i, 'name', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <input type="text" placeholder="Size" value={item.size}
                      onChange={(e) => updateMerchItem(i, 'size', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <input type="text" placeholder="Color" value={item.color}
                      onChange={(e) => updateMerchItem(i, 'color', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <input type="number" placeholder="Stock" min={0} value={item.stock}
                      onChange={(e) => updateMerchItem(i, 'stock', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <input type="number" placeholder="Limit" min={1} value={item.purchaseLimit}
                      onChange={(e) => updateMerchItem(i, 'purchaseLimit', e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none" />
                    <button type="button" onClick={() => removeMerchItem(i)}
                      className="text-red-400 hover:text-red-300 cursor-pointer text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition text-lg">
            {saving ? 'Creating...' : 'Create Event (Draft)'}
          </button>
          <button type="button" disabled={saving}
            onClick={handleCreateAndPublish}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg cursor-pointer transition text-lg">
            {saving ? 'Publishing...' : 'Create & Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

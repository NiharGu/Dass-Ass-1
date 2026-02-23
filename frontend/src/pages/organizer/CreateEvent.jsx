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

  const addMerchItem = () => {
    setMerchItems([...merchItems, { name: '', size: '', color: '', price: 0, stock: 0, purchaseLimit: 1 }]);
  };
  const updateMerchItem = (idx, key, val) => {
    setMerchItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };
  const removeMerchItem = (idx) => setMerchItems(prev => prev.filter((_, i) => i !== idx));

  const buildBody = () => {
    const body = {
      ...form,
      registrationLimit: form.Type === 'merchandise' ? 999999 : Number(form.registrationLimit),
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
          price: Number(item.price),
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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 border rounded text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/30";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1.5  ";
  const fieldInput = "px-3 py-2 bg-white border border-gray-200 border rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-black mb-6">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 border rounded p-6 space-y-4">
          <h2 className="text-base font-semibold text-black">Basic Info</h2>

          <div>
            <label className={labelClass}>Event Name</label>
            <input type="text" required value={form.Name} onChange={set('Name')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea required value={form.Description} onChange={set('Description')} rows={4} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Event Type</label>
              <select value={form.Type} onChange={set('Type')} className={inputClass}>
                <option value="normal">Normal</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Eligibility</label>
              <select value={form.eligibility} onChange={set('eligibility')} className={inputClass}>
                <option value="open">Open</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit">Non-IIIT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input type="date" required value={form.StartDate} onChange={set('StartDate')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" required value={form.EndDate} onChange={set('EndDate')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Registration Deadline</label>
              <input type="date" required value={form.registrationDeadline} onChange={set('registrationDeadline')} className={inputClass} />
            </div>
          </div>

          {form.Type !== 'merchandise' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Registration Limit</label>
                <input type="number" required min={1} value={form.registrationLimit} onChange={set('registrationLimit')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Registration Fee (₹)</label>
                <input type="number" required min={0} value={form.registrationFee} onChange={set('registrationFee')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input type="text" value={form.Tags} onChange={set('Tags')} placeholder="music, outdoor" className={inputClass} />
              </div>
            </div>
          )}
          {form.Type === 'merchandise' && (
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input type="text" value={form.Tags} onChange={set('Tags')} placeholder="music, outdoor" className={inputClass} />
            </div>
          )}

          {form.Type !== 'merchandise' && (
            <div className="border-t border-gray-200 border pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isTeamEvent}
                  onChange={(e) => setForm({ ...form, isTeamEvent: e.target.checked })}
                  className="w-4 h-4 accent-[#6366f1]" />
                <span className="text-sm text-gray-600">This is a team-based event</span>
              </label>
              {form.isTeamEvent && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className={labelClass}>Min Team Size</label>
                    <input type="number" min={2} max={20} value={form.minTeamSize}
                      onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Max Team Size</label>
                    <input type="number" min={2} max={20} value={form.maxTeamSize}
                      onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })} className={inputClass} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Form Builder */}
        {form.Type === 'normal' && (
          <div className="bg-gray-50 border border-gray-200 border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Custom Registration Form</h2>
              <button type="button" onClick={addField}
                className="px-3 py-1.5 bg-black text-white-important hover:bg-gray-900 text-white text-sm rounded cursor-pointer ">
                + Add Field
              </button>
            </div>

            {customForm.length === 0 && (
              <p className="text-gray-400 text-sm">No custom fields yet. Add fields to build a registration form.</p>
            )}

            <div className="space-y-3">
              {customForm.map((field, i) => (
                <div key={i} className="bg-white border border-gray-200 border rounded p-4">
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <input type="text" placeholder="Field name" value={field.name}
                      onChange={(e) => updateField(i, 'name', e.target.value)} className={fieldInput} />
                    <input type="text" placeholder="Label" value={field.label}
                      onChange={(e) => updateField(i, 'label', e.target.value)} className={fieldInput} />
                    <select value={field.type} onChange={(e) => updateField(i, 'type', e.target.value)} className={fieldInput}>
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={field.required}
                          onChange={(e) => updateField(i, 'required', e.target.checked)} className="accent-[#6366f1]" />
                        Req
                      </label>
                      <button type="button" onClick={() => moveField(i, -1)} className="text-gray-500 hover:text-black cursor-pointer text-sm">↑</button>
                      <button type="button" onClick={() => moveField(i, 1)} className="text-gray-500 hover:text-black cursor-pointer text-sm">↓</button>
                      <button type="button" onClick={() => removeField(i)} className="text-black hover:text-gray-600 cursor-pointer text-sm">✕</button>
                    </div>
                  </div>
                  {field.type === 'dropdown' && (
                    <input type="text" placeholder="Options (comma separated)" value={field.options}
                      onChange={(e) => updateField(i, 'options', e.target.value)}
                      className={`w-full ${fieldInput}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merchandise Items */}
        {form.Type === 'merchandise' && (
          <div className="bg-gray-50 border border-gray-200 border rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-black">Merchandise Items</h2>
              <button type="button" onClick={addMerchItem}
                className="px-3 py-1.5 bg-black text-white-important hover:bg-gray-900 text-white text-sm rounded cursor-pointer ">
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {merchItems.length > 0 && (
                <div className="grid grid-cols-7 gap-3 px-4 mb-2">
                  <div className="text-[11px] font-medium text-gray-600  ">Name</div>
                  <div className="text-[11px] font-medium text-gray-600  ">Size</div>
                  <div className="text-[11px] font-medium text-gray-600  ">Color</div>
                  <div className="text-[11px] font-medium text-gray-600  ">Price (₹)</div>
                  <div className="text-[11px] font-medium text-gray-600  ">Stock</div>
                  <div className="text-[11px] font-medium text-gray-600  ">Max/User</div>
                  <div></div>
                </div>
              )}
              {merchItems.map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 border rounded p-4">
                  <div className="grid grid-cols-7 gap-3">
                    <input type="text" placeholder="Name" value={item.name}
                      onChange={(e) => updateMerchItem(i, 'name', e.target.value)} className={fieldInput} />
                    <select value={item.size} onChange={(e) => updateMerchItem(i, 'size', e.target.value)} className={fieldInput}>
                      <option value="">Size</option>
                      {['XS', 'S', 'M', 'L', 'XL'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="Color" value={item.color}
                      onChange={(e) => updateMerchItem(i, 'color', e.target.value)} className={fieldInput} />
                    <input type="number" placeholder="Price ₹" min={0} value={item.price}
                      onChange={(e) => updateMerchItem(i, 'price', e.target.value)} className={fieldInput} />
                    <input type="number" placeholder="Stock" min={0} value={item.stock}
                      onChange={(e) => updateMerchItem(i, 'stock', e.target.value)} className={fieldInput} />
                    <input type="number" placeholder="Limit" min={1} value={item.purchaseLimit}
                      onChange={(e) => updateMerchItem(i, 'purchaseLimit', e.target.value)} className={fieldInput} />
                    <button type="button" onClick={() => removeMerchItem(i)}
                      className="text-black hover:text-gray-600 cursor-pointer text-sm flex items-center justify-center">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-gray-50 border border-gray-200 border hover:border-black text-black font-medium rounded cursor-pointer  ">
            {saving ? 'Creating...' : 'Save as Draft'}
          </button>
          <button type="button" disabled={saving}
            onClick={handleCreateAndPublish}
            className="flex-1 py-3 bg-black text-white-important hover:bg-gray-900 disabled:opacity-50 text-white font-medium rounded cursor-pointer  ">
            {saving ? 'Publishing...' : 'Create & Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}

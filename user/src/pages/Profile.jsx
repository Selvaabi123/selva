import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/users/profile', form);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const roleColors = { admin: 'bg-purple-100 text-purple-700', user: 'bg-blue-100 text-blue-700', delivery: 'bg-green-100 text-green-700' };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 page-enter">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge text-xs ${roleColors[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
              <span className="text-gray-400 text-xs">{user?.email}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input pl-10" placeholder="Your name" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={user?.email} disabled className="input pl-10 opacity-60 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="input pl-10" placeholder="+91 9999999999" type="tel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="input pl-10 resize-none" rows={3} placeholder="Your delivery address" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

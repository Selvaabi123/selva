import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, X, User, Shield, Bike } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import SanitizedText from '../../components/SanitizedText';
import { useToast } from '../../context/ToastContext';

const roleIcons = { admin: Shield, user: User, delivery: Bike };
const roleColors = { admin: 'bg-purple-100 text-purple-700', user: 'bg-blue-100 text-blue-700', delivery: 'bg-green-100 text-green-700' };

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'delivery', phone: '' });
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(() => api.get('/users/admin/all')
    .then(r => setUsers(r.data.users || []))
    .catch(() => {
      toast.error('Failed to load users', 'Please refresh the page.');
    })
    .finally(() => setLoading(false)), [toast]);
  
  useEffect(() => { 
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Name required', 'Please enter a user name.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.warning('Valid email required', 'Please enter a valid email address.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.warning('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setSaving(true);
      await api.post('/users/admin/create', form);
      toast.success('User created', `${form.name} has been added as ${form.role}.`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'delivery', phone: '' });
      load();
    } catch (err) {
      toast.error('Failed to create user', err.response?.data?.message || 'Please try again.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => {
    toast.delete(
      'Delete User',
      `Delete user "${name}"? They will be permanently removed from the system.`,
      {
        onConfirm: async () => {
          try {
            await api.delete(`/users/admin/${id}`);
            toast.success('User deleted', `"${name}" has been removed.`);
            load();
          } catch (err) {
            toast.error('Delete failed', err.response?.data?.message || 'Could not delete user.');
          }
        },
        onCancel: () => {
          toast.info('Cancelled', `Deletion of "${name}" was cancelled.`);
        }
      }
    );
  };

  const roleGroups = { admin: users.filter(u => u.role === 'admin'), delivery: users.filter(u => u.role === 'delivery'), user: users.filter(u => u.role === 'user') };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-900">Users ({users.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Object.entries(roleGroups).map(([role, group]) => {
            const Icon = roleIcons[role];
            return (
              <div key={role} className={`card p-4 flex items-center gap-3`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${roleColors[role]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xl text-gray-900">{group.length}</p>
                  <p className="text-gray-400 text-xs capitalize">{role}s</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase hidden md:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                )) : users.map(u => {
                  const RoleIcon = roleIcons[u.role] || User;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleColors[u.role]}`}>
                            <RoleIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <SanitizedText text={u.name} className="font-medium text-gray-800" />
                            <SanitizedText text={u.email} className="text-gray-400 text-xs block" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${roleColors[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg">Create User</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" minLength={6} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
                  <option value="delivery">Delivery Partner</option>
                  <option value="admin">Admin</option>
                  <option value="user">Customer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

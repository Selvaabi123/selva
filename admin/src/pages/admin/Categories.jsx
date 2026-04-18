import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, X, ShoppingBag } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { 
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name: '' }); setShowModal(true); };
  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success('Category updated', `"${form.name}" has been updated.`);
      } else {
        await api.post('/categories', form);
        toast.success('Category created', `"${form.name}" has been added.`);
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Could not save category.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted', `"${name}" has been removed.`);
      load();
    } catch (err) {
      toast.error('Delete failed', err.response?.data?.message || 'Could not delete category.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-900">Categories ({categories.length})</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(8)].map((_, i) => <div key={i} className="card animate-pulse h-36" />)
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="card overflow-hidden group">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-800 truncate">{cat.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1 text-blue-400 hover:bg-blue-50 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-bold text-lg">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input" 
                  placeholder="E.g. Burgers" 
                  required 
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
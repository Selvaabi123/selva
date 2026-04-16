import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, ToggleLeft, ToggleRight, Upload, Image } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../context/ToastContext';

const emptyForm = { name: '', description: '', price: '', category_id: '', image_url: '', stock: '', is_available: true };

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/products/admin/all'),
      api.get('/categories'),
    ]).then(([p, c]) => {
      setProducts(p.data.products || []);
      setCategories(c.data.categories || []);
    }).catch(() => {
      toast.error('Failed to load products', 'Please refresh the page and try again.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, category_id: p.category_id || '', image_url: p.image_url || '', stock: p.stock, is_available: p.is_available });
    setEditing(p.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Name required', 'Please enter a product name.');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.warning('Valid price required', 'Please enter a valid price greater than 0.');
      return;
    }
    if (!form.stock || parseInt(form.stock) < 0) {
      toast.warning('Valid stock required', 'Please enter a valid stock quantity.');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/products/${editing}`, form);
        toast.success('Product updated', `"${form.name}" has been updated successfully.`);
      } else {
        await api.post('/products', form);
        toast.success('Product created', `"${form.name}" has been added to your menu.`);
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error('Failed to save product', err.response?.data?.message || 'Please try again.');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => {
    toast.delete(
      'Delete Product',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      {
        onConfirm: async () => {
          try {
            await api.delete(`/products/${id}`);
            toast.success('Product deleted', `"${name}" has been removed from your menu.`);
            load();
          } catch (err) {
            toast.error('Delete failed', err.response?.data?.message || 'Could not delete product.');
          }
        },
        onCancel: () => {
          toast.info('Cancelled', `Deletion of "${name}" was cancelled.`);
        }
      }
    );
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-900">Products ({products.length})</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="input pl-10 text-sm" />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                          alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={e => e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} />
                        <span className="font-medium text-gray-800 truncate max-w-[150px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 font-bold text-brand-600">₹{parseFloat(p.price).toFixed(0)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400">No products found</div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-bold text-lg">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input" placeholder="E.g. Chicken Burger" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input resize-none" rows={2} placeholder="Describe the product..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                  <input type="number" step="0.01" min="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input" placeholder="299.00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="input" placeholder="50" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="input">
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-400 transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({ ...form, image_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden" 
                    id="product-image"
                  />
                  <label htmlFor="product-image" className="cursor-pointer">
                    {form.image_url ? (
                      <div className="relative">
                        <img src={form.image_url} alt="preview" className="h-32 w-full object-cover rounded-lg mx-auto" />
                        <p className="text-xs text-gray-500 mt-2">Click to change image</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Image className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload product image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Available for ordering</label>
                <button type="button" onClick={() => setForm({ ...form, is_available: !form.is_available })}>
                  {form.is_available ? <ToggleRight className="w-8 h-8 text-brand-500" /> : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ShoppingBag } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('search', search);
    params.set('limit', 24);
    api.get(`/products?${params}`).then(r => {
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  }, [activeCategory, search]);

  const setCategory = (id) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Our Menu</h1>
        <p className="text-gray-500">{total} delicious items available</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search food, cuisine..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-12 pr-10" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
        <button onClick={() => setCategory('')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${!activeCategory ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id.toString())}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition ${activeCategory === cat.id.toString() ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-400">Try a different search or category</p>
          <button onClick={() => { setSearch(''); setCategory(''); }} className="btn-primary mt-4">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}

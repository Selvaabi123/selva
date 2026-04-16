import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock, Star } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/products?limit=8'),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data.categories || []);
      setFeatured(prodRes.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: '30-min delivery guaranteed', color: 'bg-yellow-50 text-yellow-600' },
    { icon: Shield, title: '100% Genuine', desc: 'Quality products guaranteed', color: 'bg-green-50 text-green-600' },
    { icon: Clock, title: 'Always Fresh', desc: 'Farm fresh, every day', color: 'bg-blue-50 text-blue-600' },
    { icon: Star, title: 'Top Rated', desc: '4.8★ average rating', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="page-enter">
      <section className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-orange-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">Quick & Fresh Delivery</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              Groceries delivered<br />
              <span className="text-yellow-300">to your door.</span>
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-md">
              Shop fresh fruits, vegetables, and daily essentials. Get everything delivered in under 30 minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-7 py-3.5 rounded-xl hover:bg-yellow-50 transition shadow-xl">
                Order Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center gap-2 border-2 border-white/50 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,60 C720,0 1440,60 1440,60 L0,60 Z" fill="#fafaf8" />
          </svg>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-5 text-center hover:shadow-md transition">
              <div className={`w-12 h-12 rounded-2xl ${color} mx-auto mb-3 flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-gray-900 text-sm mb-1">{title}</h3>
              <p className="text-gray-400 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-brand-500 text-sm font-semibold hover:text-brand-600">View all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.id}`}
                className="snap-start flex-shrink-0 group flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 group-hover:ring-2 ring-brand-400 transition">
                  <img src={cat.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                    alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-brand-600 transition">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-gray-900">Popular Products</h2>
          <Link to="/products" className="text-brand-500 text-sm font-semibold hover:text-brand-600">See all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ShoppingBag, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">Grocy-<span className="text-brand-400">Mart</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Delicious food delivered fast to your door. Fresh ingredients, amazing flavors, every time.
            </p>
            <div className="flex gap-4 mt-6">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <button key={i} className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-500 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['/', 'Home'], ['/products', 'Menu'], ['/login', 'Login'], ['/register', 'Sign Up']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-brand-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>support@foodapp.com</li>
              <li>+91 99999 99999</li>
              <li>Mon–Sun: 9am – 11pm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Grocy-Mart. Built with ❤️ for food lovers.
        </div>
      </div>
    </footer>
  );
}

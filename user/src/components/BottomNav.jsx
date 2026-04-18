import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, ClipboardList } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/products', icon: ShoppingBag, label: 'Shop' },
    { path: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
    { path: user?.role === 'user' ? '/orders' : '/profile', icon: user?.role === 'user' ? ClipboardList : User, label: user?.role === 'user' ? 'Orders' : 'Profile' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50" style={{ borderColor: '#ECECEC', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <Link
            key={path}
            to={path}
            className="flex flex-col items-center justify-center w-full h-full relative transition-colors"
            style={{ color: isActive(path) ? '#FF6B00' : '#9CA3AF' }}
          >
            {isActive(path) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: '#FF6B00' }} />
            )}
            <div className="relative">
              <Icon className={`w-6 h-6 ${isActive(path) ? 'stroke-[2.5]' : ''}`} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF6B00' }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

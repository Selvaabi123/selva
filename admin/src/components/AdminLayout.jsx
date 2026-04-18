import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, LogOut, ShoppingBag as StoreIcon, Menu, Settings, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/partners', label: 'Partners', icon: Bike },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    api.get('/delivery/partners').then(r => {
      const online = (r.data.partners || []).filter(p => p.is_online).length;
      setOnlineCount(online);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
            <StoreIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg">Swift<span className="text-brand-500">Mart</span></span>
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800 truncate max-w-[130px]">{user?.name}</p>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${active ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4" />
              {label}
              {label === 'Partners' && onlineCount > 0 && (
                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{onlineCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 fixed h-full z-30">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden animate-slide-up">
            <Sidebar />
          </aside>
        </>
      )}

      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-gray-900">
            {links.find(l => l.to === location.pathname)?.label || 'Settings'}
          </h1>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

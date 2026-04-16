import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Truck, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      toast.success('Welcome, ' + user.name + '!');
      if (user.role === 'delivery') navigate('/');
      else toast.error('Access denied. Delivery partners only.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 to-green-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <Truck className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Grocy-Mart</h1>
          <p className="text-xl text-white/80 text-center max-w-md mb-8">
            Deliver happiness to thousands of customers
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Secure</p>
              <p className="text-xs text-white/60">Verified deliveries</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Flexible</p>
              <p className="text-xs text-white/60">Work anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-green-500/30">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">Grocy-Mart</span>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Partner</h2>
              <p className="text-gray-500">Sign in to your partner account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="delivery@grocymart.com" 
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:bg-white transition-all"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password" 
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:bg-white transition-all pr-12" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all disabled:opacity-50 shadow-lg shadow-green-500/30"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Having trouble? Contact support@grocymart.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

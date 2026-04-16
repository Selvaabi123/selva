import { useState, useEffect } from 'react';
import { Bike, Phone, MapPin, RefreshCw, Search } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/delivery/partners').then(r => {
      setPartners(r.data.partners || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onlinePartners = partners.filter(p => p.is_online);
  const offlinePartners = partners.filter(p => !p.is_online);

  const filteredOnline = onlinePartners.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const filteredOffline = offlinePartners.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Delivery Partners</h2>
            <p className="text-gray-400 text-sm mt-1">
              {onlinePartners.length} Online • {offlinePartners.length} Offline
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse border border-gray-100 h-32" />
            ))}
          </div>
        ) : (
          <>
            {filteredOnline.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Online ({filteredOnline.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOnline.map(partner => (
                    <div key={partner.id} className="bg-white rounded-2xl border border-green-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Bike className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white">{partner.name}</p>
                            <p className="text-green-100 text-sm flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-white" />
                              Online
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Phone className="w-4 h-4" />
                          {partner.phone}
                        </div>
                        {partner.latitude && partner.longitude && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs">
                              {parseFloat(partner.latitude).toFixed(4)}, {parseFloat(partner.longitude).toFixed(4)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm">
                          <div>
                            <p className="text-gray-400">Completed</p>
                            <p className="font-bold text-gray-900">{partner.completed_orders || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Rating</p>
                            <p className="font-bold text-yellow-500">★ {parseFloat(partner.rating || 0).toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Earnings</p>
                            <p className="font-bold text-green-600">₹{(partner.total_earnings || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredOffline.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Offline ({filteredOffline.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOffline.map(partner => (
                    <div key={partner.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden opacity-75">
                      <div className="bg-gray-500 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-400/30 flex items-center justify-center">
                            <Bike className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white">{partner.name}</p>
                            <p className="text-gray-300 text-sm flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                              Offline
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Phone className="w-4 h-4" />
                          {partner.phone}
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm">
                          <div>
                            <p className="text-gray-400">Completed</p>
                            <p className="font-bold text-gray-700">{partner.completed_orders || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Rating</p>
                            <p className="font-bold text-gray-600">★ {parseFloat(partner.rating || 0).toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Earnings</p>
                            <p className="font-bold text-gray-600">₹{(partner.total_earnings || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredOnline.length === 0 && filteredOffline.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No delivery partners found</p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

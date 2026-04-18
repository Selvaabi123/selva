import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ShoppingBag, Loader2, SlidersHorizontal, Grid, List, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const activeCategory = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'popular';

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('search', search);
    if (sortBy) params.set('sort', sortBy);
    params.set('limit', 24);
    api.get(`/products?${params}`).then(r => {
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  }, [activeCategory, search, sortBy]);

  const setCategory = (id) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  const setSort = (sort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    setSearchParams(newParams);
    setShowSortDropdown(false);
  };

  const clearAll = () => {
    setSearch('');
    setSearchParams({});
  };

  const hasFilters = activeCategory || search;

  const sortOptions = [
    { value: 'popular', label: 'Popular' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
  ];

  const getCurrentSortLabel = () => {
    return sortOptions.find(o => o.value === sortBy)?.label || 'Popular';
  };

  const gridStyle = {
    display: viewMode === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(240px, 1fr))' : undefined,
    flexDirection: viewMode === 'list' ? 'column' : undefined,
    gap: '16px'
  };

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh' }}>
      {/* Desktop Layout with Sidebar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="hide-mobile">
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Desktop Sidebar Filters */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              position: 'sticky',
              top: '100px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
                Filters
              </h3>
              
              {/* Categories in sidebar */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Categories
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => setCategory('')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: !activeCategory ? '#FFF4EB' : 'transparent',
                      color: !activeCategory ? '#FF6B00' : '#6B7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id.toString())}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: activeCategory === cat.id.toString() ? '#FFF4EB' : 'transparent',
                        color: activeCategory === cat.id.toString() ? '#FF6B00' : '#6B7280',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearAll}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Desktop Header */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A' }}>🛒 Our Menu</h1>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>({total} items)</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Sort Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor: '#F7F7F7',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6B7280',
                      cursor: 'pointer'
                    }}
                  >
                    Sort: {getCurrentSortLabel()}
                    <ChevronDown style={{ width: '16px', height: '16px' }} />
                  </button>
                  {showSortDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      zIndex: 100,
                      minWidth: '180px'
                    }}>
                      {sortOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSort(option.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: sortBy === option.value ? '#FFF4EB' : 'transparent',
                            color: sortBy === option.value ? '#FF6B00' : '#1A1A1A',
                            fontSize: '14px',
                            fontWeight: '500',
                            textAlign: 'left',
                            cursor: 'pointer'
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '10px',
                      backgroundColor: viewMode === 'grid' ? '#FF6B00' : '#F7F7F7',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Grid style={{ width: '18px', height: '18px', color: viewMode === 'grid' ? 'white' : '#6B7280' }} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '10px',
                      backgroundColor: viewMode === 'list' ? '#FF6B00' : '#F7F7F7',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <List style={{ width: '18px', height: '18px', color: viewMode === 'list' ? 'white' : '#6B7280' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div style={gridStyle}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '4/3', backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ padding: '14px' }}>
                      <div style={{ height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '75%', marginBottom: '10px' }} />
                      <div style={{ height: '12px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '50%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '16px' }}>
                <ShoppingBag style={{ width: '64px', height: '64px', color: '#9CA3AF', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>No items found</h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>Try adjusting your search or filters</p>
                <button onClick={clearAll} style={{
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={gridStyle}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div style={{ paddingBottom: '100px' }} className="hide-desktop">
        {/* Sticky Header */}
        <div style={{
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ padding: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' }}>
              🛒 Our Menu
            </h1>
            
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9CA3AF' }} 
              />
              <input 
                type="text" 
                placeholder="Search for food, drinks..." 
                value={search}
                onChange={e => setSearch(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '12px 44px',
                  border: '2px solid #ECECEC',
                  borderRadius: '14px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF'
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              )}
            </div>

            {/* Filter & Sort Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: showFilters ? '#FFF4EB' : '#F7F7F7',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: showFilters ? '#FF6B00' : '#6B7280',
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal style={{ width: '14px', height: '14px' }} />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#F7F7F7',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  cursor: 'pointer'
                }}
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px',
                    backgroundColor: viewMode === 'grid' ? '#FF6B00' : '#F7F7F7',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Grid style={{ width: '16px', height: '16px', color: viewMode === 'grid' ? 'white' : '#6B7280' }} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px',
                    backgroundColor: viewMode === 'list' ? '#FF6B00' : '#F7F7F7',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <List style={{ width: '16px', height: '16px', color: viewMode === 'list' ? 'white' : '#6B7280' }} />
                </button>
              </div>
            </div>

            {/* Category Chips */}
            {showFilters && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                <button 
                  onClick={() => setCategory('')}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: '2px solid',
                    borderColor: !activeCategory ? '#FF6B00' : '#ECECEC',
                    backgroundColor: !activeCategory ? '#FF6B00' : 'white',
                    color: !activeCategory ? 'white' : '#6B7280',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => setCategory(cat.id.toString())}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '2px solid',
                      borderColor: activeCategory === cat.id.toString() ? '#FF6B00' : '#ECECEC',
                      backgroundColor: activeCategory === cat.id.toString() ? '#FF6B00' : 'white',
                      color: activeCategory === cat.id.toString() ? 'white' : '#6B7280',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>{total} items</p>
          {hasFilters && (
            <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '4/3', backgroundColor: '#E5E7EB', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ padding: '12px' }}>
                    <div style={{ height: '14px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                    <div style={{ height: '12px', backgroundColor: '#E5E7EB', borderRadius: '4px', width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: '100px', height: '100px', backgroundColor: '#FFF4EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag style={{ width: '48px', height: '48px', color: '#FF9A3C' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>No items found</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Try adjusting your filters</p>
              <button onClick={clearAll} style={{ backgroundColor: '#FF6B00', color: 'white', padding: '12px 24px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

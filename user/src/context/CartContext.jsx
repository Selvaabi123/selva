import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = async (productId, qty = 1) => {
    const res = await fetch(`/api/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ product_id: productId, quantity: qty })
    });
    const data = await res.json();
    if (data.success) {
      const cartRes = await fetch(`/api/cart`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const cartData = await cartRes.json();
      if (cartData.items) setItems(cartData.items);
    }
    return data;
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`/api/cart`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  const updateItem = (productId, qty) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + parseFloat(i.price || i.product?.price || 0) * (i.quantity || i.qty), 0);
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateItem, removeItem, clearCart, total, itemCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

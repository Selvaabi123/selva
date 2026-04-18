import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      if (res.data.items) setItems(res.data.items);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  const addToCart = async (productId, qty = 1) => {
    try {
      const res = await api.post('/cart/add', { product_id: productId, quantity: qty });
      if (res.data.success) {
        await fetchCart();
      }
      return res.data;
    } catch (err) {
      console.error('Failed to add to cart:', err);
      throw err;
    }
  };

  const updateItem = async (productId, qty) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }
    try {
      const res = await api.put('/cart/update', { product_id: productId, quantity: qty });
      if (res.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to update cart:', err);
    }
  };

  const removeItem = async (productId) => {
    try {
      const res = await api.delete('/cart/remove', { data: { product_id: productId } });
      if (res.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const clearCart = () => setItems([]);

  const getItemQuantity = (productId) => {
    const item = items.find(i => i.product_id === productId || i.product?.id === productId);
    return item ? (item.quantity || item.qty || 0) : 0;
  };

  const updateQuantity = async (productId, qty) => {
    return updateItem(productId, qty);
  };

  const total = items.reduce((sum, i) => sum + parseFloat(i.price || i.product?.price || 0) * (i.quantity || i.qty || 0), 0);
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateItem, updateQuantity, removeItem, clearCart, total, itemCount, fetchCart, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await cartAPI.getCart();
      if (data.success) {
        setCart(data.data.cart);
        setItemCount(data.data.cart.items.reduce((sum, item) => sum + item.quantity, 0));
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (item) => {
    try {
      const { data } = await cartAPI.addItem(item);
      if (data.success) {
        setCart(data.data.cart);
        setItemCount(data.data.cart.items.reduce((sum, i) => sum + i.quantity, 0));
      }
      return data;
    } catch (err) {
      throw err.response?.data?.error || { message: 'Failed to add item' };
    }
  };

  const updateQuantity = async (productId, quantity, variantId) => {
    try {
      const { data } = await cartAPI.updateQuantity(productId, quantity, variantId);
      if (data.success) {
        setCart(data.data.cart);
        setItemCount(data.data.cart.items.reduce((sum, i) => sum + i.quantity, 0));
      }
    } catch (err) {
      throw err.response?.data?.error || { message: 'Failed to update quantity' };
    }
  };

  const removeItem = async (productId, variantId) => {
    try {
      const { data } = await cartAPI.removeItem(productId, variantId);
      if (data.success) {
        setCart(data.data.cart);
        setItemCount(data.data.cart.items.reduce((sum, i) => sum + i.quantity, 0));
      }
    } catch (err) {
      throw err.response?.data?.error || { message: 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      setCart({ items: [], subtotal: 0, total: 0 });
      setItemCount(0);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  return (
    <CartContext.Provider value={{
      cart, loading, itemCount, fetchCart,
      addItem, updateQuantity, removeItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;

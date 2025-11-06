import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, WishlistItem, Order } from '@/types';
import { toast } from 'sonner';

interface AppContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: Order[];
  isAuthenticated: boolean;
  user: { name: string; businessName: string; email: string } | null;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  moveToCart: (productId: string) => void;
  placeOrder: (items: CartItem[], address: any) => string;
  clearCart: () => void;
  login: (email: string, password: string) => boolean;
  signup: (data: any) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; businessName: string; email: string } | null>(null);

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      updateCartQuantity(product.id, existingItem.quantity + quantity);
    } else {
      setCart([...cart, { product, quantity }]);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
    toast.info('Item removed from cart');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const addToWishlist = (product: Product) => {
    if (!wishlist.find(item => item.product.id === product.id)) {
      setWishlist([...wishlist, { product }]);
      toast.success('Added to wishlist ❤️');
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(wishlist.filter(item => item.product.id !== productId));
    toast.info('Removed from wishlist');
  };

  const moveToCart = (productId: string) => {
    const item = wishlist.find(w => w.product.id === productId);
    if (item) {
      addToCart(item.product, 1);
      removeFromWishlist(productId);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = (items: CartItem[], address: any): string => {
    const orderId = `ORD${Date.now()}`;
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    const newOrder: Order = {
      id: orderId,
      items,
      address,
      total,
      status: 'ordered',
      date: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setOrders([newOrder, ...orders]);
    clearCart();
    return orderId;
  };

  const login = (email: string, password: string): boolean => {
    // Simulate login
    setIsAuthenticated(true);
    setUser({
      name: 'Rajesh Kumar',
      businessName: 'Kumar General Store',
      email,
    });
    toast.success('Welcome back!');
    return true;
  };

  const signup = (data: any): boolean => {
    setIsAuthenticated(true);
    setUser({
      name: data.name,
      businessName: data.businessName,
      email: data.email,
    });
    toast.success('Account created successfully!');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCart([]);
    setWishlist([]);
    toast.info('Logged out successfully');
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        orders,
        isAuthenticated,
        user,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        placeOrder,
        clearCart,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

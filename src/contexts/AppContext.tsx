import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, WishlistItem, Order } from '@/types';
import { toast } from 'sonner';

// Updated User interface to match your API response
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mobile_number: string;
  entity_type: string;
  business_name: string;
  // Add any other fields your API returns
}

interface AppContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: Order[];
  isAuthenticated: boolean;
  user: User | null;

  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;

  updateItemCreditPeriod: (productId: string, period: string) => void;

  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  moveToCart: (productId: string) => void;

  placeOrder: (items: CartItem[], address: any) => string;
  clearCart: () => void;

  login: (userData: User) => boolean;
  signup: (data: any) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // --------------------------------------
  // Load saved data from LocalStorage on mount
  // --------------------------------------
  useEffect(() => {
    const savedCart = localStorage.getItem("appCart");
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedUser = localStorage.getItem("appUser");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }

    const savedWishlist = localStorage.getItem("appWishlist");
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("appCart", JSON.stringify(newCart));
  };

  const saveWishlist = (newWishlist: WishlistItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem("appWishlist", JSON.stringify(newWishlist));
  };

  const saveUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("appUser", JSON.stringify(userData));
    } else {
      localStorage.removeItem("appUser");
    }
  };

  // --------------------------------------
  // Add to Cart
  // --------------------------------------
  const addToCart = (product: Product, quantity: number) => {
    const existing = cart.find(item => item.product.id === product.id);

    if (existing) {
      updateCartQuantity(product.id, existing.quantity + quantity);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        creditPeriod: "0",
        priceMultiplier: 1.00
      };
      saveCart([...cart, newItem]);
      toast.success(`${product.name} added to cart!`);
    }
  };

  // --------------------------------------
  // Remove from Cart
  // --------------------------------------
  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    saveCart(newCart);
    toast.info("Item removed from cart");
  };

  // --------------------------------------
  // Update Quantity
  // --------------------------------------
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);

    const newCart = cart.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    saveCart(newCart);
  };

  // --------------------------------------
  // Update Credit Period per product
  // --------------------------------------
  const updateItemCreditPeriod = (productId: string, period: string) => {
    let multiplier = 1;

    switch (period) {
      case "3": multiplier = 1.04; break;
      case "8": multiplier = 1.08; break;
      case "15": multiplier = 1.12; break;
      case "30": multiplier = 1.15; break;
      default: multiplier = 1.00;
    }

    const newCart = cart.map(item =>
      item.product.id === productId
        ? { ...item, creditPeriod: period, priceMultiplier: multiplier }
        : item
    );

    saveCart(newCart);

    toast.success(
      `Credit set to ${period} days (+${((multiplier - 1) * 100).toFixed(0)}%)`
    );
  };

  // --------------------------------------
  // Wishlist Operations
  // --------------------------------------
  const addToWishlist = (product: Product) => {
    if (!wishlist.some(w => w.product.id === product.id)) {
      const newWishlist = [...wishlist, { product }];
      saveWishlist(newWishlist);
      toast.success("Added to wishlist ❤️");
    }
  };

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter(w => w.product.id !== productId);
    saveWishlist(newWishlist);
    toast.info("Removed from wishlist");
  };

  const moveToCart = (productId: string) => {
    const item = wishlist.find(w => w.product.id === productId);
    if (item) {
      addToCart(item.product, 1);
      removeFromWishlist(productId);
    }
  };

  // --------------------------------------
  // Place Order
  // --------------------------------------
  const placeOrder = (items: CartItem[], address: any): string => {
    const orderId = `ORD${Date.now()}`;

    const total = items.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity * item.priceMultiplier;
      return sum + itemTotal;
    }, 0);

    const newOrder: Order = {
      id: orderId,
      items,
      address,
      total,
      status: "ordered",
      date: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString()
    };

    setOrders([newOrder, ...orders]);
    clearCart();

    return orderId;
  };

  const clearCart = () => {
    saveCart([]);
  };

  // --------------------------------------
  // Auth - Updated for API integration
  // --------------------------------------
  const login = (userData: User): boolean => {
    try {
      setIsAuthenticated(true);
      saveUser(userData);
      toast.success(`Welcome back, ${userData.name || userData.business_name || userData.email}!`);
      return true;
    } catch (error) {
      console.error('Login error in context:', error);
      toast.error('Failed to login');
      return false;
    }
  };

  const signup = (userData: User): boolean => {
    try {
      setIsAuthenticated(true);
      saveUser(userData);
      toast.success(`Account created successfully! Welcome, ${userData.name || userData.business_name || userData.email}!`);
      return true;
    } catch (error) {
      console.error('Signup error in context:', error);
      toast.error('Failed to create account');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    saveUser(null);
    clearCart();
    saveWishlist([]);
    toast.info("Logged out successfully");
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

        updateItemCreditPeriod,

        addToWishlist,
        removeFromWishlist,
        moveToCart,

        placeOrder,
        clearCart,

        login,
        signup,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
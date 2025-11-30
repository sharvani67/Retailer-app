import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CartItem, WishlistItem, Order, CreditPeriod } from '@/types';
import { toast } from 'sonner';
import { baseurl } from '@/Api/Baseurl';
import flourImage from '@/assets/flour-product.jpg';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mobile_number: string;
  entity_type: string;
  business_name: string;
  discount: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_pin_code: string;
  shipping_state: string;
  shipping_country: string;
}


interface AppContextType {
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: Order[];
  isAuthenticated: boolean;
  user: User | null;
  creditPeriods: CreditPeriod[];
  loading: boolean;

  // Cart operations
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  updateItemCreditPeriod: (productId: string, period: string, percentage?: number) => Promise<void>;
  syncCartWithBackend: () => Promise<void>;
  clearCart: () => Promise<void>;

  // Wishlist operations
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  moveToCart: (productId: string) => void;

  // Order operations
  placeOrder: (items: CartItem[], address: any) => string;

  // Auth operations
  login: (userData: User) => boolean;
  signup: (userData: User) => boolean;
  logout: () => void;

  // Credit periods
  fetchCreditPeriods: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [creditPeriods, setCreditPeriods] = useState<CreditPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const savedUser = localStorage.getItem("appUser");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        // Load user's cart from backend
        await syncCartWithBackend();
      }

      const savedWishlist = localStorage.getItem("appWishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      // Load credit periods
      await fetchCreditPeriods();
    };

    loadInitialData();
  }, []);

  // Fetch credit periods from API
  const fetchCreditPeriods = async (): Promise<void> => {
    try {
      const response = await fetch(`${baseurl}/api/credit-period-fix/credit`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const transformedPeriods = result.data.map((period: any) => ({
          days: parseInt(period.credit_period),
          percentage: parseInt(period.credit_percentage),
          multiplier: 1 + (parseInt(period.credit_percentage) / 100)
        }));
        
        setCreditPeriods(transformedPeriods);
      } else {
        // Fallback to default periods
       
      }
    } catch (error) {
 
    }
  };



  // Enhanced sync cart with backend
  const syncCartWithBackend = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`${baseurl}/api/cart/customer-cart/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      
      const cartItems = await response.json();
      
      // Transform backend cart items to frontend format
      const transformedCart = await Promise.all(
        cartItems.map(async (item: any) => {
          try {
            // Fetch product details
            const productResponse = await fetch(`${baseurl}/products/${item.product_id}`);
            if (!productResponse.ok) throw new Error('Failed to fetch product');
            const productData = await productResponse.json();
            
            return {
              id: item.id,
              product: {
                id: productData.id.toString(),
                name: productData.goods_name,
                description: productData.description,
                price: parseFloat(productData.price),
                unit: productData.unit,
                image: productData.image || flourImage,
                category: productData.category,
                supplier: productData.supplier,
                stock: productData.stock
              },
              quantity: item.quantity,
              creditPeriod: item.credit_period?.toString() || "0",
              priceMultiplier: 1 + ((item.credit_percentage || 0) / 100),
              creditPercentage: item.credit_percentage || 0
            };
          } catch (error) {
            console.error('Error processing cart item:', error);
            return null;
          }
        })
      );
      
      // Filter out any failed items and update cart
      const validCartItems = transformedCart.filter(item => item !== null) as CartItem[];
      setCart(validCartItems);
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Add to Cart with backend sync
// Add to Cart with backend sync
const addToCart = async (product: Product, quantity: number): Promise<void> => {
  if (!user) {
    toast.error('Please login to add items to cart');
    return;
  }

  try {
    setLoading(true);
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      // Show notification for existing item
      toast.success(`${product.name} quantity updated in cart!`);
      await updateCartQuantity(product.id, existingItem.quantity + quantity);
      return;
    }

    // Add to backend
    const response = await fetch(`${baseurl}/api/cart/add-to-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: user.id,
        product_id: parseInt(product.id),
        quantity: quantity,
        credit_period: 0,
        credit_percentage: 0
      })
    });

    if (!response.ok) throw new Error('Failed to add to cart');

    // Sync with backend to get the updated cart
    await syncCartWithBackend();
    toast.success(`${product.name} added to cart!`);
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error('Failed to add item to cart');
  } finally {
    setLoading(false);
  }
};

  // Remove from Cart with backend sync
  const removeFromCart = async (productId: string): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const itemToRemove = cart.find(item => item.product.id === productId);
      if (!itemToRemove) return;

      // Remove from backend if it has an ID (from database)
      if (itemToRemove.id) {
        const response = await fetch(`${baseurl}/api/cart/remove-cart-item/${itemToRemove.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove from cart');
      }

      // Update local state immediately for better UX
      const newCart = cart.filter(item => item.product.id !== productId);
      setCart(newCart);
      
      toast.info("Item removed from cart");
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  // Update Quantity with backend sync
// Update Quantity with backend sync
const updateCartQuantity = async (productId: string, quantity: number): Promise<void> => {
  if (!user) return;

  if (quantity <= 0) {
    await removeFromCart(productId);
    return;
  }

  try {
    setLoading(true);
    const itemToUpdate = cart.find(item => item.product.id === productId);
    if (!itemToUpdate) return;

    // Update in backend if it has an ID
    if (itemToUpdate.id) {
      const response = await fetch(`${baseurl}/api/cart/update-cart-quantity/${itemToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) throw new Error('Failed to update quantity');
    }

    // Update local state immediately for better UX
    const newCart = cart.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    );

    setCart(newCart);
    
    // Show notification for quantity update (optional)
    const product = itemToUpdate.product;
    toast.success(`${product.name} quantity updated to ${quantity}`);
    
  } catch (error) {
    console.error('Error updating quantity:', error);
    toast.error('Failed to update quantity');
  } finally {
    setLoading(false);
  }
};

  // Update Credit Period with backend sync
  const updateItemCreditPeriod = async (productId: string, period: string, percentage?: number): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      const itemToUpdate = cart.find(item => item.product.id === productId);
      if (!itemToUpdate) return;

      let actualPercentage = percentage;
      let multiplier = 1;

      // Calculate multiplier based on percentage or period
      if (percentage !== undefined) {
        multiplier = 1 + (percentage / 100);
      } else {
        const creditPeriod = creditPeriods.find(cp => cp.days === parseInt(period));
        multiplier = creditPeriod ? creditPeriod.multiplier : 1;
        actualPercentage = creditPeriod ? creditPeriod.percentage : 0;
      }

      // Update in backend if it has an ID
      if (itemToUpdate.id) {
        const response = await fetch(`${baseurl}/api/cart/update-cart-credit/${itemToUpdate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credit_period: parseInt(period),
            credit_percentage: actualPercentage
          })
        });

        if (!response.ok) throw new Error('Failed to update credit period');
      }

      // Update local state immediately for better UX
      const newCart = cart.map(item =>
        item.product.id === productId
          ? { 
              ...item, 
              creditPeriod: period, 
              priceMultiplier: multiplier,
              creditPercentage: actualPercentage
            }
          : item
      );

      setCart(newCart);

      toast.success(`Credit set to ${period} days (+${actualPercentage}%)`);
      
    } catch (error) {
      console.error('Error updating credit period:', error);
      toast.error('Failed to update credit period');
    } finally {
      setLoading(false);
    }
  };

  // Clear Cart with backend sync
  const clearCart = async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      // Remove all items from backend
      for (const item of cart) {
        if (item.id) {
          await fetch(`${baseurl}/api/cart/remove-cart-item/${item.id}`, {
            method: 'DELETE'
          });
        }
      }

      // Clear local state
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  // Wishlist operations (local only)
  const saveWishlist = (newWishlist: WishlistItem[]) => {
    setWishlist(newWishlist);
    localStorage.setItem("appWishlist", JSON.stringify(newWishlist));
  };

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

  // Place Order
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

  // Auth operations
  const saveUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("appUser", JSON.stringify(userData));
    } else {
      localStorage.removeItem("appUser");
    }
  };

  const login = (userData: User): boolean => {
    try {
      setIsAuthenticated(true);
      saveUser(userData);
      syncCartWithBackend(); // Sync cart after login
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
        creditPeriods,
        loading,

        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateItemCreditPeriod,
        syncCartWithBackend,
        clearCart,

        addToWishlist,
        removeFromWishlist,
        moveToCart,

        placeOrder,

        login,
        signup,
        logout,

        fetchCreditPeriods
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
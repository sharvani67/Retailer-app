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
  cartLoading: boolean; // Add cart-specific loading state

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
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem("appCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const savedWishlist = localStorage.getItem("appWishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("appUser");
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("appUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [creditPeriods, setCreditPeriods] = useState<CreditPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false); // Separate cart loading state

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("appCart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("appCart");
    }
  }, [cart]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Load user's cart from backend if authenticated
      if (user) {
        await syncCartWithBackend();
      }

      // Load credit periods
      await fetchCreditPeriods();
    };

    loadInitialData();
  }, [user?.id]); // Re-run when user changes

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
      console.error('Error fetching credit periods:', error);
    }
  };

  // Enhanced sync cart with backend
  const syncCartWithBackend = async (): Promise<void> => {
    if (!user) {
      // If no user, clear localStorage cart
      localStorage.removeItem("appCart");
      setCart([]);
      return;
    }

    try {
      setCartLoading(true);
      const response = await fetch(`${baseurl}/api/cart/customer-cart/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      
      const cartItems = await response.json();
      
      // If cart is empty, clear local state
      if (!cartItems || cartItems.length === 0) {
        setCart([]);
        localStorage.removeItem("appCart");
        return;
      }
      
      // First, fetch all products at once to get complete data
      const productsResponse = await fetch(`${baseurl}/get-sales-products`);
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      
      const allProducts = await productsResponse.json();
      
      // Create a map for quick lookup
      const productMap = new Map();
      allProducts.forEach((product: any) => {
        productMap.set(product.id.toString(), product);
      });
      
      // Transform backend cart items to frontend format
      const transformedCart = cartItems.map((item: any) => {
        const productData = productMap.get(item.product_id.toString());
        
        if (!productData) {
          console.warn(`Product ${item.product_id} not found in products list`);
          return null;
        }
        
        return {
          id: item.id,
          product: {
            id: productData.id.toString(),
            name: productData.name || productData.goods_name || "Unknown Product",
            description: productData.description || "",
            price: parseFloat(productData.price) || 0,
            unit: productData.unit || "Units",
            image: productData.image || flourImage,
            category: productData.category || "",
            supplier: productData.supplier || "Unknown Supplier",
            stock: productData.stock || 0,
            gst_rate: parseFloat(productData.gst_rate) || 0,
            inclusive_gst: productData.inclusive_gst || "Exclusive"
          },
          quantity: item.quantity,
          creditPeriod: item.credit_period?.toString() || "0",
          priceMultiplier: 1 + ((item.credit_percentage || 0) / 100),
          creditPercentage: item.credit_percentage || 0
        };
      });
      
      // Filter out any failed items and update cart
      const validCartItems = transformedCart.filter(item => item !== null) as CartItem[];
      setCart(validCartItems);
      
    } catch (error) {
      console.error('Error syncing cart:', error);
      // Keep existing cart from localStorage if sync fails
    } finally {
      setCartLoading(false);
    }
  };

  // Add to Cart with backend sync
  const addToCart = async (product: Product, quantity: number): Promise<void> => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setCartLoading(true);
      
      // Check if product already exists in cart (local check first)
      const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity locally first for immediate feedback
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantity;
        setCart(updatedCart);
        
        // Show notification
        toast.success(`${product.name} quantity updated in cart!`);
        
        // Update in backend
        const existingItem = cart[existingItemIndex];
        if (existingItem.id) {
          const response = await fetch(`${baseurl}/api/cart/update-cart-quantity/${existingItem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: updatedCart[existingItemIndex].quantity })
          });
          
          if (!response.ok) throw new Error('Failed to update quantity in backend');
        }
        
        return;
      }

      // If not existing, add to backend first
      const response = await fetch(`${baseurl}/api/cart/add-to-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user.id,
          product_id: parseInt(product.id),
          quantity: quantity,
          credit_period: 0,
          credit_percentage: 0
        })
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      // Get the new cart item ID from response if available
      const result = await response.json();
      const newCartItemId = result.id || result.cartItemId;

      // Add to local cart immediately for better UX
      const newCartItem: CartItem = {
        id: newCartItemId,
        product: product,
        quantity: quantity,
        creditPeriod: "0",
        priceMultiplier: 1,
        creditPercentage: 0
      };
      
      setCart(prev => [...prev, newCartItem]);
      
      toast.success(`${product.name} added to cart!`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      // Revert local changes if backend fails
      await syncCartWithBackend();
    } finally {
      setCartLoading(false);
    }
  };

  // Remove from Cart with backend sync
  const removeFromCart = async (productId: string): Promise<void> => {
    if (!user) return;

    try {
      setCartLoading(true);
      const itemToRemove = cart.find(item => item.product.id === productId);
      if (!itemToRemove) return;

      // Remove from local state first for immediate feedback
      const newCart = cart.filter(item => item.product.id !== productId);
      setCart(newCart);

      // Remove from backend if it has an ID (from database)
      if (itemToRemove.id) {
        const response = await fetch(`${baseurl}/api/cart/remove-cart-item/${itemToRemove.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove from cart');
      }

      toast.info("Item removed from cart");
      
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      // Revert local changes if backend fails
      await syncCartWithBackend();
    } finally {
      setCartLoading(false);
    }
  };

  // Update Quantity with backend sync
  const updateCartQuantity = async (productId: string, quantity: number): Promise<void> => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      setCartLoading(true);
      const itemToUpdate = cart.find(item => item.product.id === productId);
      if (!itemToUpdate) return;

      // Update local state first for immediate feedback
      const newCart = cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      setCart(newCart);

      // Update in backend if it has an ID
      if (itemToUpdate.id) {
        const response = await fetch(`${baseurl}/api/cart/update-cart-quantity/${itemToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });

        if (!response.ok) throw new Error('Failed to update quantity');
      }

      // Show notification for quantity update
      const product = itemToUpdate.product;
      toast.success(`${product.name} quantity updated to ${quantity}`);
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      // Revert local changes if backend fails
      await syncCartWithBackend();
    } finally {
      setCartLoading(false);
    }
  };

  // Update Credit Period with backend sync
  const updateItemCreditPeriod = async (productId: string, period: string, percentage?: number): Promise<void> => {
    if (!user) return;

    try {
      setCartLoading(true);
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

      // Update local state first for immediate feedback
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

      // Update in backend if it has an ID
      if (itemToUpdate.id) {
        const response = await fetch(`${baseurl}/api/cart/update-cart-credit/${itemToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credit_period: parseInt(period),
            credit_percentage: actualPercentage
          })
        });

        if (!response.ok) throw new Error('Failed to update credit period');
      }

      toast.success(`Credit set to ${period} days (+${actualPercentage}%)`);
      
    } catch (error) {
      console.error('Error updating credit period:', error);
      toast.error('Failed to update credit period');
      // Revert local changes if backend fails
      await syncCartWithBackend();
    } finally {
      setCartLoading(false);
    }
  };

  // Clear Cart with backend sync
  const clearCart = async (): Promise<void> => {
    if (!user) return;

    try {
      setCartLoading(true);
      // Clear local state first
      setCart([]);
      localStorage.removeItem("appCart");

      // Remove all items from backend
      for (const item of cart) {
        if (item.id) {
          await fetch(`${baseurl}/api/cart/remove-cart-item/${item.id}`, {
            method: 'DELETE'
          });
        }
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      // Revert local changes if backend fails
      await syncCartWithBackend();
    } finally {
      setCartLoading(false);
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
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("appUser");
      setIsAuthenticated(false);
      // Clear cart when logging out
      setCart([]);
      localStorage.removeItem("appCart");
    }
  };

  const login = (userData: User): boolean => {
    try {
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
    saveUser(null);
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
        cartLoading, // Expose cart loading state

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
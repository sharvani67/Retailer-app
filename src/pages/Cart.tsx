import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

const Cart = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    updateItemCreditPeriod,
    creditPeriods,
    user,
    syncCartWithBackend
  } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync cart on component mount and when user changes
  useEffect(() => {
    const initializeCart = async () => {
      if (user && !isInitialized) {
        setLoading(true);
        try {
          await syncCartWithBackend();
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing cart:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeCart();
  }, [user, syncCartWithBackend, isInitialized]);

  // Calculate item total with credit multiplier
  const calculateItemTotal = (item: any) => {
    const multiplier = item.priceMultiplier || 1;
    return item.product.price * item.quantity * multiplier;
  };

  // Calculate subtotal without credit
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Calculate final total with credit multipliers
  const finalTotal = cart.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  // Calculate total credit charges
  const totalCreditCharges = finalTotal - subtotal;

  // Helper function to get display text for credit period
  const getCreditPeriodDisplay = (days: string) => {
    if (!days && days !== "0") return "Select Credit Period";
    
    const period = creditPeriods.find(cp => cp.days === parseInt(days));
    if (period) {
      return `${period.days} days (+${period.percentage}%)`;
    }
    return `${days} days`;
  };

  // Handle credit period change
  const handleCreditPeriodChange = async (productId: string, selectedDays: string) => {
    setLoading(true);
    try {
      const period = creditPeriods.find(cp => cp.days === parseInt(selectedDays));
      await updateItemCreditPeriod(productId, selectedDays, period?.percentage);
      // Refresh cart data after credit period update
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error updating credit period:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle quantity update
  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    setLoading(true);
    try {
      await updateCartQuantity(productId, newQuantity);
      // Refresh cart data after quantity update
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (productId: string) => {
    setLoading(true);
    try {
      await removeFromCart(productId);
      // Refresh cart data after removal
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading(false);
    }
  };

  // Checkout handler
  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('=== CART PAGE - CHECKOUT DATA ===');
    console.log('Cart items:', cart);
    console.log('Subtotal (without credit):', subtotal);
    console.log('Total credit charges:', totalCreditCharges);
    console.log('Final total (with credit):', finalTotal);
    
    navigate('/checkout', { 
      state: { 
        finalTotal,
        cartItems: cart,
        creditBreakdown: {
          subtotal,
          totalCreditCharges,
          finalTotal
        }
      } 
    });
  };

  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <span className="font-semibold">Shopping Cart</span>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-muted rounded-full p-12 mb-6"
          >
            <ShoppingBag className="h-20 w-20 text-muted-foreground" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">
            Add some products to get started!
          </p>

          <Button onClick={() => navigate('/home')} size="lg">
            Start Shopping
          </Button>
        </div>

        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">Shopping Cart ({cart.length})</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* CART ITEMS WITH CREDIT PERIOD PER PRODUCT */}
        {cart.map((item, index) => {
          const itemMultiplier = item.priceMultiplier || 1;
          const itemPercentage = item.creditPercentage || 0;
          const itemTotal = calculateItemTotal(item);
          const itemCreditCharge = itemTotal - (item.product.price * item.quantity);

          return (
            <motion.div
              key={`${item.product.id}-${item.id || index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border"
            >
              <div className="flex gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-xl bg-muted"
                />

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {item.product.supplier}
                      </p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveItem(item.product.id)}
                      disabled={loading}
                      className="p-2 hover:bg-muted rounded-full text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* PRODUCT PRICE BREAKDOWN */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Base price: ₹{item.product.price.toLocaleString()} × {item.quantity}
                    </div>
                    
                    {item.creditPeriod !== "0" && (
                      <div className="text-sm text-muted-foreground">
                        Credit applied: 
                        <span className="font-semibold text-primary ml-1">
                          +{itemPercentage}% (×{itemMultiplier.toFixed(2)})
                        </span>
                      </div>
                    )}

                    {item.creditPeriod !== "0" && (
                      <div className="text-sm text-muted-foreground">
                        Credit charge: 
                        <span className="font-semibold text-orange-500 ml-1">
                          ₹{itemCreditCharge.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-lg font-bold text-primary">
                    ₹{itemTotal.toLocaleString()}
                  </div>

                  {/* Quantity Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}
                        className="rounded-full h-7 w-7"
                        disabled={item.quantity <= 1 || loading}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-semibold w-8 text-center">
                        {item.quantity}
                      </span>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleQuantityUpdate(item.product.id, item.quantity + 1)}
                        className="rounded-full h-7 w-7"
                        disabled={loading}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* CREDIT PERIOD SELECT (DYNAMIC FROM API) */}
                  <div className="mt-3">
                    <Select
                      value={item.creditPeriod || "0"}
                      onValueChange={(value) => handleCreditPeriodChange(item.product.id, value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full bg-muted">
                        <SelectValue>
                          {getCreditPeriodDisplay(item.creditPeriod)}
                        </SelectValue>
                      </SelectTrigger>

                      <SelectContent>
                        {creditPeriods.map((period) => (
                          <SelectItem 
                            key={period.days} 
                            value={period.days.toString()}
                          >
                            {period.days} days (+{period.percentage}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-3"
        >
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal ({cart.length} items)</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Total Credit Charges</span>
            <span className="text-orange-500">+₹{totalCreditCharges.toLocaleString()}</span>
          </div>

          <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
            <span>Final Total</span>
            <span className="text-primary">
              ₹{finalTotal.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* ACTION BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 pt-2 pb-24"
        >
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Continue Shopping
          </Button>

          <Button
            onClick={handleCheckout}
            size="lg"
            className="flex-1"
            disabled={loading}
          >
            {loading ? "Processing..." : "Checkout"}
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Cart;
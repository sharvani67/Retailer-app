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
import { baseurl } from '@/Api/Baseurl';

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, updateItemCreditPeriod } = useApp();
  const navigate = useNavigate();
  const [creditPeriods, setCreditPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH CREDIT PERIODS FROM API
  // ============================
  useEffect(() => {
    const fetchCreditPeriods = async () => {
      try {
        console.log('Fetching credit periods from API...');
        const response = await fetch(`${baseurl}/api/credit-period-fix/credit`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Credit periods API response:', result);
        
        if (result.success && result.data) {
          // Transform API data to match frontend expected format
          const transformedPeriods = result.data.map(period => ({
            days: parseInt(period.credit_period), // Map credit_period to days
            percentage: parseInt(period.credit_percentage), // Map credit_percentage to percentage
            multiplier: 1 + (parseInt(period.credit_percentage) / 100) // Calculate multiplier from percentage
          }));
          
          console.log('Transformed credit periods:', transformedPeriods);
          setCreditPeriods(transformedPeriods);
        } else {
          console.error('Failed to fetch credit periods:', result.message);
          // Fallback to default periods if API fails
          setCreditPeriods(getDefaultCreditPeriods());
        }
      } catch (error) {
        console.error('Error fetching credit periods:', error);
        // Fallback to default periods on error
        setCreditPeriods(getDefaultCreditPeriods());
      } finally {
        setLoading(false);
      }
    };

    fetchCreditPeriods();
  }, []);

  // Default credit periods as fallback
  const getDefaultCreditPeriods = () => {
    return [
      { days: 0, multiplier: 1.00, percentage: 0 },
      { days: 3, multiplier: 1.04, percentage: 4 },
      { days: 8, multiplier: 1.08, percentage: 8 },
      { days: 15, multiplier: 1.12, percentage: 12 },
      { days: 30, multiplier: 1.15, percentage: 15 }
    ];
  };

  // ============================
  // TOTAL USING MULTIPLIERS
  // ============================
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const finalTotal = cart.reduce(
    (sum, item) =>
      sum + item.product.price * item.quantity * item.priceMultiplier,
    0
  );

  // Helper function to get display text for credit period
  const getCreditPeriodDisplay = (days) => {
    const period = creditPeriods.find(cp => cp.days === parseInt(days));
    if (period) {
      return `${period.days} days (+${period.percentage}%)`;
    }
    return `${days} days`;
  };

  // Helper function to get multiplier for a credit period
  const getMultiplierForPeriod = (days) => {
    const period = creditPeriods.find(cp => cp.days === parseInt(days));
    return period ? period.multiplier : 1;
  };

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
        {/* ==========================================================
           CART ITEMS WITH CREDIT PERIOD PER PRODUCT
        ========================================================== */}
        {cart.map((item, index) => (
          <motion.div
            key={item.product.id}
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
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 hover:bg-muted rounded-full text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* PRODUCT PRICE WITH MULTIPLIER */}
                <div className="text-sm text-muted-foreground">
                  Credit applied:
                  <span className="font-semibold text-primary ml-1">
                    +{((item.priceMultiplier - 1) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="text-lg font-bold text-primary">
                  ₹
                  {(
                    item.product.price *
                    item.quantity *
                    item.priceMultiplier
                  ).toLocaleString()}
                </div>

                {/* =======================
                    Quantity Buttons
                ======================== */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity - 1)
                      }
                      className="rounded-full h-7 w-7"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>

                    <span className="text-sm font-semibold w-8 text-center">
                      {item.quantity}
                    </span>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        updateCartQuantity(item.product.id, item.quantity + 1)
                      }
                      className="rounded-full h-7 w-7"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* =======================
                    CREDIT PERIOD SELECT (DYNAMIC FROM API)
                ======================== */}
                <div className="mt-3">
                  <Select
                    value={item.creditPeriod?.toString()}
                    onValueChange={(value) => {
                      console.log('Selected credit period:', value);
                      updateItemCreditPeriod(item.product.id, value);
                    }}
                  >
                    <SelectTrigger className="w-full bg-muted">
                      <SelectValue placeholder={
                        loading ? "Loading..." : "Select Credit Period"
                      }>
                        {item.creditPeriod && !loading && getCreditPeriodDisplay(item.creditPeriod)}
                      </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          Loading credit periods...
                        </SelectItem>
                      ) : (
                        creditPeriods.map((period) => (
                          <SelectItem 
                            key={period.days} 
                            value={period.days.toString()}
                          >
                            {period.days} days (+{period.percentage}%)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-3"
        >
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal (without credit)</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Credit Charges</span>
            <span>₹{(finalTotal - subtotal).toLocaleString()}</span>
          </div>

          <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
            <span>Total</span>
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
            onClick={() => navigate('/checkout', { state: { finalTotal } })}
            size="lg"
            className="flex-1"
          >
            Checkout
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Cart;
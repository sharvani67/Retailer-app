import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, Receipt, CreditCard } from 'lucide-react';
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

  // Get user discount percentage - assuming it's now stored as 5.00 for 5%
  const userDiscountPercentage = user?.discount ? parseFloat(user.discount) : 0;

  // Calculate item price breakdown according to your WhatsApp example
  const calculateItemBreakdown = (item: any) => {
    const price = parseFloat(item.product.price);
    const gstRate = parseFloat(item.product.gst_rate) || 0;
    const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
    const quantity = item.quantity || 1;
    const creditMultiplier = item.priceMultiplier || 1;
    const creditPercentage = item.creditPercentage || 0;

    // FOR INCLUSIVE GST
    if (isInclusiveGST) {
      // Step 1: Extract base amount from price (which includes GST)
      const baseAmountPerUnit = price / (1 + (gstRate / 100));
      
      // Step 2: Apply credit charge per unit
      const priceAfterCreditPerUnit = baseAmountPerUnit * creditMultiplier;
      const creditChargePerUnit = priceAfterCreditPerUnit - baseAmountPerUnit;
      
      // Step 3: Calculate total for quantity
      const totalBaseAmount = baseAmountPerUnit * quantity;
      const totalCreditCharges = creditChargePerUnit * quantity;
      const totalAmountAfterCredit = totalBaseAmount + totalCreditCharges;
      
      // Step 4: Apply user discount
      let discountAmount = 0;
      if (userDiscountPercentage > 0) {
        discountAmount = (totalAmountAfterCredit * userDiscountPercentage) / 100;
      }
      
      // Step 5: Calculate taxable amount
      const taxableAmount = totalAmountAfterCredit - discountAmount;
      
      // Step 6: Calculate tax amount on taxable amount
      const taxAmount = (taxableAmount * gstRate) / 100;
      
      // Step 7: Final total
      const finalPayableAmount = taxableAmount + taxAmount;

      return {
        basePrice: price,
        gstRate,
        isInclusiveGST: true,
        quantity,
        creditMultiplier,
        creditPercentage,
        
        perUnit: {
          price: price,
          baseAmount: baseAmountPerUnit,
          creditCharge: creditChargePerUnit,
        },
        
        totalBaseAmount,
        totalCreditCharges,
        discountAmount,
        taxableAmount,
        taxAmount,
        finalPayableAmount
      };
    }
    
    // FOR EXCLUSIVE GST
    else {
      const baseAmountPerUnit = price;
      const priceAfterCreditPerUnit = baseAmountPerUnit * creditMultiplier;
      const creditChargePerUnit = priceAfterCreditPerUnit - baseAmountPerUnit;
      
      const totalBaseAmount = baseAmountPerUnit * quantity;
      const totalCreditCharges = creditChargePerUnit * quantity;
      const totalAmountAfterCredit = totalBaseAmount + totalCreditCharges;
      
      let discountAmount = 0;
      if (userDiscountPercentage > 0) {
        discountAmount = (totalAmountAfterCredit * userDiscountPercentage) / 100;
      }
      
      const taxableAmount = totalAmountAfterCredit - discountAmount;
      const taxAmount = (taxableAmount * gstRate) / 100;
      const finalPayableAmount = taxableAmount + taxAmount;

      return {
        basePrice: price,
        gstRate,
        isInclusiveGST: false,
        quantity,
        creditMultiplier,
        creditPercentage,
        
        perUnit: {
          price: price,
          baseAmount: baseAmountPerUnit,
          creditCharge: creditChargePerUnit,
        },
        
        totalBaseAmount,
        totalCreditCharges,
        discountAmount,
        taxableAmount,
        taxAmount,
        finalPayableAmount
      };
    }
  };

  // Calculate item total
  const calculateItemTotal = (item: any) => {
    const breakdown = calculateItemBreakdown(item);
    return breakdown.finalPayableAmount;
  };

  // Calculate item discount
  const calculateItemDiscount = (item: any) => {
    const breakdown = calculateItemBreakdown(item);
    return breakdown.discountAmount;
  };

  // Calculate subtotal
  const subtotal = cart.reduce(
    (sum, item) => {
      const breakdown = calculateItemBreakdown(item);
      return sum + breakdown.totalBaseAmount;
    },
    0
  );

  // Calculate total credit charges
  const totalCreditCharges = cart.reduce(
    (sum, item) => {
      const breakdown = calculateItemBreakdown(item);
      return sum + breakdown.totalCreditCharges;
    },
    0
  );

  // Calculate total discount
  const totalDiscount = cart.reduce(
    (sum, item) => sum + calculateItemDiscount(item),
    0
  );

  // Calculate total tax
  const totalTax = cart.reduce(
    (sum, item) => {
      const breakdown = calculateItemBreakdown(item);
      return sum + breakdown.taxAmount;
    },
    0
  );

  // Calculate final total
  const finalTotal = cart.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0
  );

  // Helper function for credit period display
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

    navigate('/checkout', { 
      state: { 
        finalTotal,
        cartItems: cart,
        creditBreakdown: {
          subtotal,
          totalCreditCharges,
          totalDiscount,
          totalTax,
          userDiscount: userDiscountPercentage,
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
        {/* USER DISCOUNT BANNER */}
        {userDiscountPercentage > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5" />
              <div>
                <p className="font-semibold">Special Discount Applied!</p>
                <p className="text-sm opacity-90">
                  You're getting {userDiscountPercentage}% off on all items as a valued customer
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CART ITEMS */}
        {cart.map((item, index) => {
          const breakdown = calculateItemBreakdown(item);
          const itemTotal = breakdown.finalPayableAmount;

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

                <div className="flex-1">
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold line-clamp-2 text-base">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {breakdown.isInclusiveGST ? 'Incl. GST' : 'Excl. GST'}
                        </span>
                        {breakdown.gstRate > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            {breakdown.gstRate}% GST
                          </span>
                        )}
                      </div>
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

                  {/* Price Display */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{itemTotal.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        for {breakdown.quantity} {breakdown.quantity === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₹{(itemTotal / breakdown.quantity).toFixed(2)} per unit
                    </div>
                  </div>

                  {/* CALCULATION BREAKDOWN - Mobile Optimized */}
                  <div className="space-y-2 text-sm mb-4">
                    {/* Base Amount */}
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-muted-foreground">Base Amount:</span>
                      <span>₹{breakdown.totalBaseAmount.toFixed(2)}</span>
                    </div>
                    
                    {/* Credit Charges */}
                    {breakdown.creditMultiplier > 1 && (
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-orange-500" />
                          <span className="text-muted-foreground">Credit ({breakdown.creditPercentage}%):</span>
                        </div>
                        <span className="text-orange-500 font-medium">
                          +₹{breakdown.totalCreditCharges.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* User Discount */}
                    {userDiscountPercentage > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-green-600" />
                          <span className="text-muted-foreground">Your Discount ({userDiscountPercentage}%):</span>
                        </div>
                        <span className="text-green-600 font-medium">
                          -₹{breakdown.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Taxable Amount */}
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-muted-foreground">Taxable Amount:</span>
                      <span>₹{breakdown.taxableAmount.toFixed(2)}</span>
                    </div>
                    
                    {/* GST */}
                    {breakdown.gstRate > 0 && (
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-muted-foreground">GST ({breakdown.gstRate}%):</span>
                        <span className="text-purple-600 font-medium">
                          +₹{breakdown.taxAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Final Total */}
                    <div className="flex justify-between pt-1">
                      <span className="font-semibold">Item Total:</span>
                      <span className="font-bold text-primary">
                        ₹{breakdown.finalPayableAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Credit Controls */}
                  <div className="space-y-3">
                    {/* Quantity Controls */}
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

                    {/* Credit Period Select */}
                    <div>
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
              </div>
            </motion.div>
          );
        })}

        {/* ORDER SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Order Summary</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({cart.length} items)</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            {totalCreditCharges > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Your Discount ({userDiscountPercentage}%)</span>
                </div>
                <span className="font-semibold text-green-600">-₹{totalDiscount.toLocaleString()}</span>
              </div>
            )}

            {totalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total GST</span>
                <span className="text-purple-600">+₹{totalTax.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-xl font-bold">
                <span>Final Total</span>
                <span className="text-primary">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {totalDiscount > 0 && (
              <div className="text-center pt-2">
                <p className="text-sm text-green-600">
                  🎉 You saved ₹{totalDiscount.toLocaleString()} with your {userDiscountPercentage}% discount!
                </p>
              </div>
            )}
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
            className="flex-1 bg-primary hover:bg-primary/90"
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
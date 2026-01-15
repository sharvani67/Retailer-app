import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';

const EditCart = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    updateItemCreditPeriod,
    creditPeriods,
    user,
    syncCartWithBackend,
    clearCart,
    addToCart
  } = useApp();
  
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const [loading, setLoading] = useState(false);
  const [selectedCreditPeriod, setSelectedCreditPeriod] = useState("0");
  const [originalOrderData, setOriginalOrderData] = useState<any>(null);

  // Fetch order data when component mounts
  useEffect(() => {
    if (orderNumber) {
      fetchOrderForEditing(orderNumber);
    }
  }, [orderNumber]);

  const fetchOrderForEditing = async (orderNumber: string) => {
    setLoading(true);
    try {
      if (clearCart) {
        await clearCart();
      }

      const response = await fetch(`${baseurl}/orders/details/${orderNumber}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderData = await response.json();
      setOriginalOrderData(orderData);
      
      if (orderData.order?.credit_period) {
        setSelectedCreditPeriod(orderData.order.credit_period.toString());
      }
      
      if (orderData.items && Array.isArray(orderData.items) && addToCart) {
        console.log('Processing order items for cart:', orderData.items);
        
        for (const item of orderData.items) {
          const productResponse = await fetch(`${baseurl}/products/${item.product_id}`);
          if (!productResponse.ok) continue;

          const product = await productResponse.json();
          
          const productWithEditedPrice = {
            ...product,
            edited_sale_price: item.edited_sale_price || item.sale_price
          };
          
          const creditPeriod = item.credit_period ? item.credit_period.toString() : "0";
          const creditPercentage = item.credit_percentage 
            ? parseFloat(item.credit_percentage) 
            : 0;
          
          await addToCart(
            productWithEditedPrice, 
            item.quantity, 
            creditPeriod,
            creditPercentage
          );
        }
        
        await syncCartWithBackend();
      }
    } catch (error) {
      console.error('Error fetching order for editing:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync credit percentages when credit periods are available
  useEffect(() => {
    if (cart.length === 0 || creditPeriods.length === 0) return;

    const syncCreditPeriods = async () => {
      for (const item of cart) {
        if (item.creditPeriod && (!item.creditPercentage || item.creditPercentage === 0)) {
          const period = creditPeriods.find(cp => cp.days === parseInt(item.creditPeriod));
          if (period) {
            await updateItemCreditPeriod(
              item.product.id, 
              item.creditPeriod, 
              parseFloat(period.percentage.toString())
            );
          }
        }
      }
      await syncCartWithBackend();
    };
    
    syncCreditPeriods();
  }, [cart, creditPeriods, updateItemCreditPeriod, syncCartWithBackend]);

  const userDiscountPercentage = user?.discount ? parseFloat(user.discount) : 0;

  // ──────────────────────────────────────────────────────────────
  // PRICE CALCULATION LOGIC
  // ──────────────────────────────────────────────────────────────
  const calculateItemBreakdown = (item: any) => {
    const mrp = parseFloat(item.product.mrp) || 0;
    const salePrice = parseFloat(item.product.price) || 0;
    
    const editedSalePrice = item.product.edited_sale_price 
      ? parseFloat(item.product.edited_sale_price)
      : salePrice;
    
    const gstRate = parseFloat(item.product.gst_rate) || 0;
    const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
    const quantity = item.quantity || 1;
    const creditPercentage = item.creditPercentage || 0;

    const creditChargePerUnit = (editedSalePrice * creditPercentage) / 100;
    const customerSalePricePerUnit = editedSalePrice + creditChargePerUnit;

    const discountPercentage = userDiscountPercentage;
    const discountAmountPerUnit = (customerSalePricePerUnit * discountPercentage) / 100;

    const itemTotalPerUnit = customerSalePricePerUnit - discountAmountPerUnit;

    let taxableAmountPerUnit = 0;
    let taxAmountPerUnit = 0;

    if (isInclusiveGST) {
      taxableAmountPerUnit = itemTotalPerUnit / (1 + (gstRate / 100));
      taxAmountPerUnit = itemTotalPerUnit - taxableAmountPerUnit;
    } else {
      taxableAmountPerUnit = itemTotalPerUnit;
      taxAmountPerUnit = (taxableAmountPerUnit * gstRate) / 100;
    }

    const sgstPercentage = gstRate / 2;
    const cgstPercentage = gstRate / 2;
    const sgstAmountPerUnit = taxAmountPerUnit / 2;
    const cgstAmountPerUnit = taxAmountPerUnit / 2;

    const finalAmountPerUnit = isInclusiveGST 
      ? itemTotalPerUnit 
      : itemTotalPerUnit + taxAmountPerUnit;

    return {
      mrp,
      sale_price: salePrice,
      edited_sale_price: editedSalePrice,
      credit_charge: creditChargePerUnit,
      credit_period: item.creditPeriod,
      credit_percentage: creditPercentage,
      customer_sale_price: customerSalePricePerUnit,
      discount_percentage: discountPercentage,
      discount_amount: discountAmountPerUnit,
      item_total: itemTotalPerUnit,
      taxable_amount: taxableAmountPerUnit,
      tax_percentage: gstRate,
      tax_amount: taxAmountPerUnit,
      sgst_percentage: sgstPercentage,
      sgst_amount: sgstAmountPerUnit,
      cgst_percentage: cgstPercentage,
      cgst_amount: cgstAmountPerUnit,
      final_amount: finalAmountPerUnit,
      total_amount: finalAmountPerUnit * quantity,
      isInclusiveGST,
      quantity,
      totals: {
        totalMRP: mrp * quantity,
        totalSalePrice: salePrice * quantity,
        totalEditedSalePrice: editedSalePrice * quantity,
        totalCreditCharge: creditChargePerUnit * quantity,
        totalCustomerSalePrice: customerSalePricePerUnit * quantity,
        totalDiscountAmount: discountAmountPerUnit * quantity,
        totalItemTotal: itemTotalPerUnit * quantity,
        totalTaxableAmount: taxableAmountPerUnit * quantity,
        totalTaxAmount: taxAmountPerUnit * quantity,
        totalSgstAmount: sgstAmountPerUnit * quantity,
        totalCgstAmount: cgstAmountPerUnit * quantity,
        finalPayableAmount: finalAmountPerUnit * quantity
      }
    };
  };

  const calculateOrderSummary = () => {
    const orderItems = cart.map(item => {
      const breakdown = calculateItemBreakdown(item);
      return {
        product: item.product,
        quantity: item.quantity,
        creditPeriod: item.creditPeriod,
        creditPercentage: item.creditPercentage,
        priceMultiplier: item.priceMultiplier || 1,
        
        breakdown: {
          perUnit: {
            mrp: breakdown.mrp,
            sale_price: breakdown.sale_price,
            edited_sale_price: breakdown.edited_sale_price,
            credit_charge: breakdown.credit_charge,
            credit_period: breakdown.credit_period,
            credit_percentage: breakdown.credit_percentage,
            customer_sale_price: breakdown.customer_sale_price,
            discount_percentage: breakdown.discount_percentage,
            discount_amount: breakdown.discount_amount,
            item_total: breakdown.item_total,
            taxable_amount: breakdown.taxable_amount,
            tax_percentage: breakdown.tax_percentage,
            tax_amount: breakdown.tax_amount,
            sgst_percentage: breakdown.sgst_percentage,
            sgst_amount: breakdown.sgst_amount,
            cgst_percentage: breakdown.cgst_percentage,
            cgst_amount: breakdown.cgst_amount,
            final_amount: breakdown.final_amount,
            total_amount: breakdown.total_amount,
            isInclusiveGST: breakdown.isInclusiveGST
          },
          totals: breakdown.totals,
          quantity: breakdown.quantity
        }
      };
    });

    const orderTotals = {
      subtotal: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalEditedSalePrice, 0),
      
      totalCreditCharges: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalCreditCharge, 0),
      
      totalCustomerSalePrice: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalCustomerSalePrice, 0),
      
      totalDiscount: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalDiscountAmount, 0),
      
      totalItemTotal: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalItemTotal, 0),
      
      totalTaxableAmount: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalTaxableAmount, 0),
      
      totalTax: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalTaxAmount, 0),
      
      totalSgst: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalSgstAmount, 0),
      
      totalCgst: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.totalCgstAmount, 0),
      
      finalTotal: cart.reduce((sum, item) => 
        sum + calculateItemBreakdown(item).totals.finalPayableAmount, 0),
      
      userDiscount: userDiscountPercentage
    };

    return { orderItems, orderTotals };
  };

  // ──────────────────────────────────────────────────────────────
  // HELPER & HANDLERS
  // ──────────────────────────────────────────────────────────────
  const getCreditPeriodDisplay = (days: string | number, creditPercentage?: number) => {
    const daysStr = days ? days.toString() : "0";
    if (daysStr === "0") return "Select Credit Period";
    
    const period = creditPeriods.find(cp => cp.days === parseInt(daysStr));
    if (period) return `${period.days} days (+${period.percentage}%)`;
    
    if (creditPercentage && creditPercentage > 0) {
      return `${daysStr} days (+${creditPercentage}%)`;
    }
    
    return `${daysStr} days`;
  };

  const handleCreditPeriodChange = async (productId: string, selectedDays: string) => {
    setLoading(true);
    try {
      const period = creditPeriods.find(cp => cp.days === parseInt(selectedDays));
      const percentage = period ? parseFloat(period.percentage.toString()) : 0;
      await updateItemCreditPeriod(productId, selectedDays, percentage);
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error updating credit period:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await handleRemoveItem(productId);
      return;
    }

    setLoading(true);
    try {
      const currentItem = cart.find(item => item.product.id === productId);
      await updateCartQuantity(productId, Number(newQuantity));
      
      if (currentItem?.creditPeriod) {
        const period = creditPeriods.find(cp => cp.days === parseInt(currentItem.creditPeriod));
        if (period) {
          await updateItemCreditPeriod(productId, currentItem.creditPeriod, period.percentage);
        }
      }
      
      await syncCartWithBackend();
    } catch (error) {
      console.error("Quantity update failed:", error);
    } finally {
      setLoading(false);
    }
  };

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


const handleUpdateOrder = async () => {
  if (!orderNumber || cart.length === 0) {
    alert("Cannot proceed with empty cart");
    return;
  }
  
  const { orderItems, orderTotals } = calculateOrderSummary();
  
  // Navigate to edit checkout
  navigate(`/edit-checkout/${orderNumber}`, { 
    state: { 
      cartItems: orderItems,
      orderTotals,
      userDiscountPercentage,
      originalOrderData // Pass original data for reference
    } 
  });
};

// Update the button to say "Proceed to Checkout":
<Button
  onClick={handleUpdateOrder}
  size="lg"
  className="flex-1 bg-blue-600 hover:bg-blue-700"
  disabled={loading || cart.length === 0}
>
  {loading ? "Loading..." : "Proceed to Checkout"}
</Button>
  // ──────────────────────────────────────────────────────────────
  // RENDERING
  // ──────────────────────────────────────────────────────────────

  if (loading && cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order for editing...</p>
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
              onClick={() => navigate('/orders')}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <span className="font-semibold">Edit Order {orderNumber}</span>
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

          <h2 className="text-2xl font-bold mb-2">Order is empty</h2>
          <p className="text-muted-foreground mb-8">
            Add products to update the order
          </p>

          <Button onClick={() => navigate('/home')} size="lg">
            Browse Products
          </Button>
        </div>

        <TabBar />
      </div>
    );
  }

  const { orderItems, orderTotals } = calculateOrderSummary();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">Edit Order {orderNumber}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* Edit mode banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5" />
            <div>
              <p className="font-semibold">Editing Order: {orderNumber}</p>
              <p className="text-sm opacity-90">
                Original staff & order details will be preserved
              </p>
            </div>
          </div>
        </motion.div>

        {/* Discount banner */}
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
                  You're getting {userDiscountPercentage}% off on all items
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cart items list */}
        {cart.map((item, index) => {
          const breakdown = calculateItemBreakdown(item);
          const finalPayableAmount = breakdown.totals.finalPayableAmount;

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
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold line-clamp-2 text-base">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {breakdown.isInclusiveGST ? 'Incl. GST' : 'Excl. GST'}
                        </span>
                        {breakdown.tax_percentage > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            {breakdown.tax_percentage}% GST
                          </span>
                        )}
                        {breakdown.mrp > breakdown.edited_sale_price && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Discounted
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

                  <div className="mb-3">
                    {breakdown.mrp > breakdown.edited_sale_price && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm line-through text-muted-foreground">
                          ₹{breakdown.mrp.toLocaleString()}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Save ₹{(breakdown.mrp - breakdown.edited_sale_price).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{breakdown.edited_sale_price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/ unit</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₹{(finalPayableAmount / breakdown.quantity).toFixed(2)} final per unit
                    </div>
                  </div>

                  <div className="flex justify-between pt-1 mb-4">
                    <span className="font-semibold">Final Amount:</span>
                    <span className="font-bold text-primary">
                      ₹{finalPayableAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Quantity controls */}
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

                    {/* Credit period selector */}
                    <div>
                      <Select
                        value={item.creditPeriod?.toString() || "0"}
                        onValueChange={(value) => handleCreditPeriodChange(item.product.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full bg-muted">
                          <SelectValue>
                            {getCreditPeriodDisplay(item.creditPeriod, item.creditPercentage)}
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

        {/* Order Summary */}
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
            {orderTotals.totalCreditCharges > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{orderTotals.totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {orderTotals.totalDiscount > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Your Discount ({userDiscountPercentage}%)</span>
                </div>
                <span className="font-semibold text-green-600">
                  -₹{orderTotals.totalDiscount.toLocaleString()}
                </span>
              </div>
            )}

            {orderTotals.totalTax > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span>₹{orderTotals.totalTaxableAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total GST</span>
                  <span className="text-purple-600">+₹{orderTotals.totalTax.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-xl font-bold">
                <span>Final Total</span>
                <span className="text-primary">₹{orderTotals.finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {orderTotals.totalDiscount > 0 && (
              <div className="text-center pt-2">
                <p className="text-sm text-green-600">
                  🎉 You saved ₹{orderTotals.totalDiscount.toLocaleString()} with your discount!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 pt-2 pb-24"
        >
          <Button
            onClick={() => navigate('/orders')}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handleUpdateOrder}
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={loading || cart.length === 0}
          >
            {loading ? "Updating..." : "Update Order"}
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default EditCart;
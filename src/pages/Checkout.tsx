import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, placeOrder, user, clearCart } = useApp();
  
  // Get checkout data from location state or use cart
  const checkoutData = location.state;
  const directBuyItems = location.state?.directBuy;
  const items = directBuyItems || cart;
  
  // Use credit breakdown from location state or calculate from cart
  const creditBreakdown = checkoutData?.creditBreakdown || calculateCreditBreakdown(items);
  
  // Calculate user discount
  const userDiscountDecimal = user?.discount ? parseFloat(user.discount) : 0;
  const userDiscountPercentage = userDiscountDecimal * 100;

  // Address
  const [address, setAddress] = useState({
    name: user?.name || "",
    businessName: user?.business_name || "",
    phone: user?.mobile_number || "",
    addressLine: 
      `${user?.shipping_address_line1 || ""}, ` +
      `${user?.shipping_address_line2 || ""}, ` +
      `${user?.shipping_city || ""}, ` +
      `${user?.shipping_state || ""} - ` +
      `${user?.shipping_pin_code || ""}, ` +
      `${user?.shipping_country || ""}`,
    city: user?.shipping_city || "",
    pincode: user?.shipping_pin_code || "",
  });

  // Helper function to calculate credit breakdown from items
  function calculateCreditBreakdown(items: any[]) {
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    const totalCreditCharges = items.reduce((sum, item) => {
      const multiplier = item.priceMultiplier || 1;
      const baseTotal = item.product.price * item.quantity;
      const creditTotal = baseTotal * multiplier;
      return sum + (creditTotal - baseTotal);
    }, 0);

    const totalDiscount = items.reduce((sum, item) => {
      if (userDiscountDecimal <= 0) return 0;
      const multiplier = item.priceMultiplier || 1;
      const baseTotal = item.product.price * item.quantity * multiplier;
      return sum + (baseTotal * userDiscountDecimal);
    }, 0);

    const finalTotal = subtotal + totalCreditCharges - totalDiscount;

    return {
      subtotal,
      totalCreditCharges,
      totalDiscount,
      userDiscount: userDiscountPercentage,
      finalTotal
    };
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };

  // Enhanced place order function to work with backend
  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      return;
    }

    try {
      // Create order data for backend
      const orderData = {
        order_number: `ORD${Date.now()}`,
        customer_id: user.id,
        customer_name: address.name,
        order_total: creditBreakdown.finalTotal,
        discount_amount: creditBreakdown.totalDiscount,
        taxable_amount: creditBreakdown.subtotal,
        tax_amount: 0, // You can calculate tax if needed
        net_payable: creditBreakdown.finalTotal,
        credit_period: calculateAverageCreditPeriod(items),
        estimated_delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        order_placed_by: user.id, // FIX: Use user ID instead of name
        order_mode: 'online',
        invoice_number: `INV${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0]
      };

      // First create the main order
      const orderResponse = await fetch(`${baseurl}/orders/create-complete-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: orderData,
          orderItems: items.map(item => ({
            product_id: parseInt(item.product.id),
            item_name: item.product.name,
            mrp: item.product.price,
            sale_price: item.product.price,
            price: item.product.price * (item.priceMultiplier || 1),
            quantity: item.quantity,
            total_amount: (item.product.price * item.quantity * (item.priceMultiplier || 1)) - (item.product.price * item.quantity * (item.priceMultiplier || 1) * userDiscountDecimal),
            discount_percentage: userDiscountPercentage,
            discount_amount: item.product.price * item.quantity * (item.priceMultiplier || 1) * userDiscountDecimal,
            taxable_amount: item.product.price * item.quantity,
            tax_percentage: 0,
            tax_amount: 0,
            item_total: (item.product.price * item.quantity * (item.priceMultiplier || 1)) - (item.product.price * item.quantity * (item.priceMultiplier || 1) * userDiscountDecimal),
            credit_period: parseInt(item.creditPeriod) || 0,
            credit_percentage: item.creditPercentage || 0,
            sgst_percentage: 0,
            sgst_amount: 0,
            cgst_percentage: 0,
            cgst_amount: 0,
            discount_applied_scheme: userDiscountPercentage > 0 ? 'user_discount' : 'none'
          }))
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      
      // Clear cart after successful order
      if (!directBuyItems) {
        await clearCart();
      }

      // Navigate to confirmation page
      navigate('/order-confirmation', {
        state: { 
          orderId: orderResult.order_number || orderData.order_number, 
          total: creditBreakdown.finalTotal,
          creditBreakdown 
        },
      });

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Helper function to calculate average credit period
  const calculateAverageCreditPeriod = (items: any[]) => {
    const totalPeriod = items.reduce((sum, item) => sum + (parseInt(item.creditPeriod) || 0), 0);
    return items.length > 0 ? Math.round(totalPeriod / items.length) : 0;
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">Checkout</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-28">
        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Delivery Address</h2>
          </div>

          <div className="space-y-4">
            {['name', 'businessName', 'phone', 'addressLine', 'city', 'pincode'].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field === 'addressLine'
                    ? 'Complete Address'
                    : field === 'businessName'
                    ? 'Business Name'
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                <Input
                  id={field}
                  value={address[field as keyof typeof address]}
                  onChange={handleChange}
                  placeholder={`Enter ${field}`}
                  required
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Order Summary with Credit Charges and Discount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          {/* Items List */}
          {/* <div className="space-y-3 mb-4">
            {items.map((item) => {
              const itemMultiplier = item.priceMultiplier || 1;
              const itemBaseTotal = item.product.price * item.quantity;
              const itemCreditCharge = itemBaseTotal * itemMultiplier - itemBaseTotal;
              const itemDiscount = userDiscountDecimal > 0 ? (itemBaseTotal * itemMultiplier) * userDiscountDecimal : 0;
              const itemFinalTotal = (itemBaseTotal * itemMultiplier) - itemDiscount;

              return (
                <div key={item.product.id} className="space-y-2 pb-3 border-b border-border last:border-b-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-sm">
                      ₹{itemFinalTotal.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground pl-2">
                    <div className="flex justify-between">
                      <span>Base price</span>
                      <span>₹{itemBaseTotal.toLocaleString()}</span>
                    </div>
                    
                    {item.creditPeriod !== "0" && item.creditPeriod && (
                      <div className="flex justify-between">
                        <span>Credit charges ({item.creditPercentage || 0}%)</span>
                        <span className="text-orange-500">+₹{itemCreditCharge.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {userDiscountDecimal > 0 && (
                      <div className="flex justify-between">
                        <span>Discount ({userDiscountPercentage}%)</span>
                        <span className="text-green-600">-₹{itemDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div> */}

          {/* Order Total Breakdown */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{creditBreakdown.subtotal.toLocaleString()}</span>
            </div>

            {/* Credit Charges */}
            {creditBreakdown.totalCreditCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span>Total Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{creditBreakdown.totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {/* Discount */}
            {creditBreakdown.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Your Discount ({creditBreakdown.userDiscount}%)</span>
                </div>
                <span className="font-semibold">-₹{creditBreakdown.totalDiscount.toLocaleString()}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>Final Total</span>
              <span className="text-primary">₹{creditBreakdown.finalTotal.toLocaleString()}</span>
            </div>

            {/* Savings Message */}
            {creditBreakdown.totalDiscount > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2 bg-green-50 rounded-lg p-2">
                🎉 You saved ₹{creditBreakdown.totalDiscount.toLocaleString()} with your {creditBreakdown.userDiscount}% discount!
              </div>
            )}
          </div>
        </motion.div>

        {/* Place Order Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handlePlaceOrder}
            size="lg"
            className="w-full"
            disabled={
              !address.name ||
              !address.phone ||
              !address.addressLine ||
              !address.city ||
              !address.pincode ||
              items.length === 0
            }
          >
            Place Order - ₹{creditBreakdown.finalTotal.toLocaleString()}
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Checkout;
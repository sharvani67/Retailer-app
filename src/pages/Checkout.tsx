import { useState ,useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';
import CreditLimitModal from '@/components/CreditLimitModal';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, user, clearCart } = useApp();

  const [userDetails, setUserDetails] = useState<any>(null);
const [loadingUser, setLoadingUser] = useState(true);
const [showCreditPopup, setShowCreditPopup] = useState(false);


useEffect(() => {
  const fetchUserDetails = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`${baseurl}/accounts/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user details");

      const data = await res.json();
      console.log("Fetched user details from API:", data);

      setUserDetails(data);

      // Pre-fill address form using API data
      setAddress({
        name: data.name || "",
        businessName: data.business_name || "",
        phone: data.mobile_number || "",
        addressLine:
          `${data.shipping_address_line1 || ""}, ` +
          `${data.shipping_address_line2 || ""}, ` +
          `${data.shipping_city || ""}, ` +
          `${data.shipping_state || ""} - ` +
          `${data.shipping_pin_code || ""}, ` +
          `${data.shipping_country || ""}`,
        city: data.shipping_city || "",
        pincode: data.shipping_pin_code || "",
      });

    } catch (err) {
      console.error("Error loading user details:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  fetchUserDetails();
}, [user?.id]);

  
  // Get checkout data from location state
  const checkoutData = location.state;
  const cartItems = checkoutData?.cartItems || cart;
  
  // Calculate user discount
  const userDiscountPercentage = userDetails?.discount ? parseFloat(userDetails.discount) : 0;
  
  // Order Mode State
  const [orderMode, setOrderMode] = useState<'KACHA' | 'PAKKA'>('KACHA');
  
  
  // Address
  const [address, setAddress] = useState({
    name: userDetails?.name || "",
    businessName: userDetails?.business_name || "",
    phone: userDetails?.mobile_number || "",
    addressLine: 
      `${userDetails?.shipping_address_line1 || ""}, ` +
      `${userDetails?.shipping_address_line2 || ""}, ` +
      `${userDetails?.shipping_city || ""}, ` +
      `${userDetails?.shipping_state || ""} - ` +
      `${userDetails?.shipping_pin_code || ""}, ` +
      `${userDetails?.shipping_country || ""}`,
    city: userDetails?.shipping_city || "",
    pincode: userDetails?.shipping_pin_code || "",
  });

  // Calculate item breakdown (same as cart)
  const calculateItemBreakdown = (item: any) => {
    const price = parseFloat(item.product.price);
    const gstRate = parseFloat(item.product.gst_rate) || 0;
    const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
    const quantity = item.quantity || 1;
    const creditMultiplier = item.priceMultiplier || 1;
    const creditPercentage = item.creditPercentage || 0;

    // FOR INCLUSIVE GST
    if (isInclusiveGST) {
      const baseAmountPerUnit = price / (1 + (gstRate / 100));
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
        isInclusiveGST: true,
        quantity,
        creditMultiplier,
        creditPercentage,
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
        totalBaseAmount,
        totalCreditCharges,
        discountAmount,
        taxableAmount,
        taxAmount,
        finalPayableAmount
      };
    }
  };

  // Calculate credit breakdown for the order summary
  const calculateCreditBreakdown = (items: any[]) => {
    let subtotal = 0;
    let totalCreditCharges = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let finalTotal = 0;

    items.forEach(item => {
      const breakdown = calculateItemBreakdown(item);
      subtotal += breakdown.totalBaseAmount;
      totalCreditCharges += breakdown.totalCreditCharges;
      totalDiscount += breakdown.discountAmount;
      totalTax += breakdown.taxAmount;
      finalTotal += breakdown.finalPayableAmount;
    });

    return {
      subtotal,
      totalCreditCharges,
      totalDiscount,
      totalTax,
      userDiscount: userDiscountPercentage,
      finalTotal
    };
  };

  const creditBreakdown = calculateCreditBreakdown(cartItems);

  const creditLimit = Number(userDetails?.credit_limit) || 0;
const unpaidAmount = Number(userDetails?.unpaid_amount) || 0;
const orderTotal = Number(creditBreakdown?.finalTotal) || 0;
const creditBalance = creditLimit - unpaidAmount;


  // Calculate average credit period
  const calculateAverageCreditPeriod = (items: any[]) => {
    const totalPeriod = items.reduce((sum, item) => sum + (parseInt(item.creditPeriod) || 0), 0);
    return items.length > 0 ? Math.round(totalPeriod / items.length) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };

// Enhanced place order function
const handlePlaceOrder = async () => {
  if (!user) {
    alert('Please login to place an order');
    return;
  }

  const creditLimit = Number(userDetails?.credit_limit) || 0;
const unpaidAmount = Number(userDetails?.unpaid_amount) || 0;
const orderTotal = Number(creditBreakdown?.finalTotal) || 0;

const creditBalance = creditLimit - unpaidAmount;

if (orderTotal > creditBalance) {
  setShowCreditPopup(true);
  return;
}

  try {
    // Fetch staff information from accounts table
    let staff_incentive = 0;
    let assigned_staff = "Unassigned";
    let staffEmail = null;
    
    if (user.staffid) {
      try {
        const staffResponse = await fetch(`${baseurl}/accounts/${user.staffid}`);
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          
          // Check if staffData has the expected structure
          if (staffData && typeof staffData === 'object') {
            // Assuming the accounts table has these fields
            staff_incentive = (staffData.incentive_percent) || 0;
            assigned_staff = staffData.name ;
            staffEmail = staffData.email || null; 
          }
        } else {
          console.warn('Failed to fetch staff details, using defaults');
        }
      } catch (staffErr) {
        console.error('Error fetching staff details:', staffErr);
        // Continue with default values
      }
    }

    // Generate order number
    const orderNumber = `ORD${Date.now()}`;
    const averageCreditPeriod = calculateAverageCreditPeriod(cartItems);
    
    // Create order data for backend
    const orderData = {
      order_number: orderNumber,
      customer_id: parseInt(user.id),
      customer_name: userDetails?.name || address.name,
      order_total: creditBreakdown.finalTotal,
      discount_amount: creditBreakdown.totalDiscount,
      taxable_amount: creditBreakdown.subtotal + creditBreakdown.totalCreditCharges,
      tax_amount: creditBreakdown.totalTax,
      net_payable: creditBreakdown.finalTotal,
      credit_period: averageCreditPeriod,
      estimated_delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      order_placed_by: parseInt(user.id),
      ordered_by: userDetails?.name,
      staffid: parseInt(userDetails?.staffid),
      assigned_staff: assigned_staff, // Use fetched staff name
      order_mode: orderMode,
      approval_status: "Approved",
      staff_incentive: staff_incentive,
      staff_email: staffEmail,
      retailer_email: userDetails.email,
    };

    console.log('Order Data:', orderData);
    console.log('Staff Details - Name:', assigned_staff, 'Incentive %:', staff_incentive);

    // Prepare order items with proper calculations
    const orderItems = cartItems.map(item => {
      const breakdown = calculateItemBreakdown(item);
      const itemPrice = parseFloat(item.product.price);
      const gstRate = parseFloat(item.product.gst_rate) || 0;
      const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
      
      // Split GST 50/50 for SGST and CGST
      const sgstPercentage = gstRate / 2;
      const cgstPercentage = gstRate / 2;
      const sgstAmount = breakdown.taxAmount / 2;
      const cgstAmount = breakdown.taxAmount / 2;

      return {
        product_id: parseInt(item.product.id),
        item_name: item.product.name,
        mrp: itemPrice, // Maximum Retail Price
        sale_price: itemPrice, // Selling Price
        price: itemPrice * (item.priceMultiplier || 1), // Price after credit
        quantity: item.quantity,
        total_amount: (itemPrice * item.quantity * (item.priceMultiplier || 1)),
        discount_percentage: userDiscountPercentage,
        discount_amount: breakdown.discountAmount,
        taxable_amount: breakdown.taxableAmount,
        tax_percentage: gstRate,
        tax_amount: breakdown.taxAmount,
        item_total: breakdown.finalPayableAmount,
        credit_period: parseInt(item.creditPeriod) || 0,
        credit_percentage: item.creditPercentage || 0,
        sgst_percentage: sgstPercentage,
        sgst_amount: sgstAmount,
        cgst_percentage: cgstPercentage,
        cgst_amount: cgstAmount,
        discount_applied_scheme: userDiscountPercentage > 0 ? 'user_discount' : 'none'
      };
    });

    console.log('Order Items:', orderItems);

    // Send to backend
    const orderResponse = await fetch(`${baseurl}/orders/create-complete-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: orderData,
        orderItems: orderItems
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.message || 'Failed to create order');
    }

    const orderResult = await orderResponse.json();
    console.log('Order Response:', orderResult);
    
    // Clear cart after successful order
    await clearCart();

    // Navigate to confirmation page
    navigate('/order-confirmation', {
      state: { 
        orderId: orderResult.order_number || orderData.order_number, 
        orderNumber: orderResult.order_number,
        total: creditBreakdown.finalTotal,
        creditBreakdown,
        orderMode,
        staffName: assigned_staff,
        staffIncentive: staff_incentive
      },
    });

  } catch (error) {
    console.error('Error placing order:', error);
    alert(`Failed to place order: ${error.message}`);
  }
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

        {/* Order Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderMode">Order Mode</Label>
              <div className="relative">
                <select
                  id="orderMode"
                  value={orderMode}
                  onChange={(e) => setOrderMode(e.target.value as 'KACHA' | 'PAKKA')}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="KACHA">KACHA </option>
                  <option value="PAKKA">PAKKA </option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
             
            </div>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          {/* Items Count */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your order
            </p>
          </div>

          {/* Order Total Breakdown */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{creditBreakdown.subtotal.toLocaleString()}</span>
            </div>

            {/* Credit Charges */}
            {creditBreakdown.totalCreditCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span>Credit Charges</span>
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

            {/* Tax */}
            {creditBreakdown.totalTax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (GST)</span>
                <span>+₹{creditBreakdown.totalTax.toLocaleString()}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>Final Total</span>
              <span className="text-primary">₹{creditBreakdown.finalTotal.toLocaleString()}</span>
            </div>

            {/* Order Mode Display */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">Order Mode:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                orderMode === 'PAKKA' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {orderMode} {orderMode === 'PAKKA' ? '✓' : '⏳'}
              </span>
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
          transition={{ delay: 0.3 }}
          className="sticky bottom-6 bg-background/95 backdrop-blur-lg pt-4"
        >
          <Button
            onClick={handlePlaceOrder}
            size="lg"
            className="w-full py-6 text-lg font-semibold"
            disabled={
              !address.name ||
              !address.phone ||
              !address.addressLine ||
              !address.city ||
              !address.pincode ||
              cartItems.length === 0
            }
          >
            Place Order - ₹{creditBreakdown.finalTotal.toLocaleString()}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            By placing this order, you agree to our terms and conditions
          </p>
        </motion.div>



      </main>

      <CreditLimitModal
  open={showCreditPopup}
  onClose={() => setShowCreditPopup(false)}
  creditLimit={creditLimit}
  unpaidAmount={unpaidAmount}
  creditBalance={creditBalance}
  orderTotal={orderTotal}
/>

      <TabBar />

      
    </div>
  );
};

export default Checkout;
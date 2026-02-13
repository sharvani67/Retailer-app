import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Tag, ChevronDown, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, user, clearCart } = useApp();

  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [orderMode, setOrderMode] = useState<'KACHA' | 'PAKKA'>('KACHA');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Get checkout data from location state
  const checkoutData = location.state;
  const cartItems = checkoutData?.cartItems || [];
  const orderTotals = checkoutData?.orderTotals || {
    subtotal: 0,
    totalCreditCharges: 0,
    totalCustomerSalePrice: 0,
    totalDiscount: 0,
    totalItemTotal: 0,
    totalTaxableAmount: 0,
    totalTax: 0,
    totalSgst: 0,
    totalCgst: 0,
    finalTotal: 0,
    userDiscount: 0,
    totalCustomerSalePriceValue: 0,
    totalFlashFreeItemsValue: 0
  };
  
  const isEditMode = checkoutData?.isEditMode || false;
  const editOrderNumber = checkoutData?.orderNumber || null;

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

  // Address
  const [address, setAddress] = useState({
    name: "",
    businessName: "",
    phone: "",
    addressLine: "",
    city: "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };
const handlePlaceOrder = async () => {
  if (isPlacingOrder) return;
  if (!user) {
    alert('Please login to place an order');
    return;
  }

  setIsPlacingOrder(true);

  try {
    // Fetch staff information from accounts table
    let staff_incentive = 0;
    let assigned_staff = "Unassigned";
    let staffEmail = null;
    let staffMobile = null;
    
    if (user.staffid) {
      try {
        const staffResponse = await fetch(`${baseurl}/accounts/${user.staffid}`);
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          
          if (staffData && typeof staffData === 'object') {
            staff_incentive = (staffData.incentive_percent) || 0;
            assigned_staff = staffData.name;
            staffEmail = staffData.email || null;
            staffMobile = staffData.mobile_number || null;
          }
        } else {
          console.warn('Failed to fetch staff details, using defaults');
        }
      } catch (staffErr) {
        console.error('Error fetching staff details:', staffErr);
      }
    }

    // Generate order number for new orders
    const orderNumber = isEditMode ? editOrderNumber : `ORD${Date.now()}`;
    
    // Create order data for backend
    const orderData = {
      order_number: orderNumber,
      customer_id: parseInt(user.id),
      customer_name: userDetails?.name || address.name,
      order_total: orderTotals.totalCustomerSalePriceValue,
      discount_amount: orderTotals.totalDiscount,
      taxable_amount: orderTotals.totalTaxableAmount,
      tax_amount: orderTotals.totalTax,
      net_payable: orderTotals.finalTotal,
      credit_period: orderTotals.totalCreditCharges,
      estimated_delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      order_placed_by: parseInt(user.id),
      ordered_by: userDetails?.name,
      staffid: parseInt(userDetails?.staffid),
      assigned_staff: assigned_staff,
      order_mode: orderMode, // Main order mode
      approval_status: "Approved",
      staff_incentive: staff_incentive,
      staff_email: staffEmail,
      staff_mobile: staffMobile,
      retailer_email: userDetails?.email,
      retailer_mobile: userDetails?.mobile_number,
      flash_free_items: orderTotals.totalFlashFreeItemsValue || 0
    };

    console.log('Order Data:', orderData);

    // Prepare order items - SIMPLIFIED: flash_offer as 1 or 0
    const orderItems = cartItems.map((item: any) => {
      const breakdown = item.breakdown;
      const net_price = item.product.net_price || 0;
      
      // Determine discount type for database
      let discount_type = 'none';
      if (breakdown.perUnit.discount_type === 'flash') {
        discount_type = 'flash';
      } else if (breakdown.perUnit.discount_type === 'category') {
        discount_type = 'category';
      } else if (breakdown.perUnit.discount_type === 'retailer') {
        discount_type = 'retailer';
      }
      
      // SIMPLE: flash_offer = 1 if flash offer exists, 0 if not
      const flash_offer_value = (breakdown.perUnit.discount_type === 'flash') ? 1 : 0;
      
      // Get buy_quantity and get_quantity if flash offer exists
      let buy_quantity = 0;
      let get_quantity = 0;
      
      if (breakdown.perUnit.discount_type === 'flash' && breakdown.perUnit.flash_offer) {
        if (typeof breakdown.perUnit.flash_offer === 'object') {
          buy_quantity = breakdown.perUnit.flash_offer.buy_quantity || 0;
          get_quantity = breakdown.perUnit.flash_offer.get_quantity || 0;
        } else if (typeof breakdown.perUnit.flash_offer === 'string') {
          // Parse from string if needed
          const match = breakdown.perUnit.flash_offer.match(/Buy (\d+) Get (\d+)/);
          if (match) {
            buy_quantity = parseInt(match[1]) || 0;
            get_quantity = parseInt(match[2]) || 0;
          }
        }
      }
      
      // Calculate quantity to send (including free items for flash offers)
      let quantityToSend = item.quantity;
      let flash_free_quantity = 0;
      
      if (breakdown.perUnit.discount_type === 'flash') {
        flash_free_quantity = breakdown.perUnit.flash_free_quantity || 0;
        quantityToSend = breakdown.perUnit.total_quantity_for_backend || 
                        (item.quantity + flash_free_quantity);
      }
      
      const weight = item.product.weight || 0;
      
      console.log(`Product ${item.product.id}:`, {
        name: item.product.name,
        discountType: breakdown.perUnit.discount_type,
        cartQuantity: item.quantity,
        freeQuantity: flash_free_quantity,
        totalQuantity: quantityToSend,
        flashOffer: flash_offer_value,
        hasFlash: breakdown.perUnit.discount_type === 'flash' ? 'Yes' : 'No'
      });
      
      return {
        product_id: parseInt(item.product.id),
        item_name: item.product.name,
        mrp: breakdown.perUnit.mrp || 0,
        sale_price: breakdown.perUnit.sale_price || 0,
        edited_sale_price: breakdown.perUnit.edited_sale_price || 0,
        net_price: net_price, // Send net_price directly
        weight: weight, // Add weight column here
        credit_charge: breakdown.perUnit.credit_charge || 0,
        credit_period: breakdown.perUnit.credit_period || "0",
        credit_percentage: breakdown.perUnit.credit_percentage || 0,
        customer_sale_price: breakdown.perUnit.customer_sale_price || 0,
        discount_percentage: breakdown.perUnit.applicable_discount_percentage || 0,
        discount_amount: breakdown.perUnit.discount_amount || 0,
        discount_type: discount_type,
        category_discount_percentage: breakdown.perUnit.category_discount_percentage || 0,
        retailer_discount_percentage: breakdown.perUnit.retailer_discount_percentage || 0,
        item_total: breakdown.perUnit.item_total || 0,
        taxable_amount: breakdown.perUnit.taxable_amount || 0,
        tax_percentage: breakdown.perUnit.tax_percentage || 0,
        tax_amount: breakdown.perUnit.tax_amount || 0,
        sgst_percentage: breakdown.perUnit.sgst_percentage || 0,
        sgst_amount: breakdown.perUnit.sgst_amount || 0,
        cgst_percentage: breakdown.perUnit.cgst_percentage || 0,
        cgst_amount: breakdown.perUnit.cgst_amount || 0,
        final_amount: breakdown.perUnit.final_amount || 0,
        quantity: quantityToSend, // Send total quantity (actual + free)
        flash_free_quantity: flash_free_quantity,
        flash_offer: flash_offer_value, // SIMPLE: 1 or 0
        buy_quantity: buy_quantity, // Still send these separately
        get_quantity: get_quantity, // Still send these separately
        total_amount: breakdown.perUnit.total_amount || 0,
        gst_type: breakdown.perUnit.isInclusiveGST ? 'inclusive' : 'exclusive',
        price_multiplier: item.priceMultiplier || 1,
        // ADD ORDER_MODE TO EACH ITEM
        order_mode: orderMode // Add this line
      };
    });

    console.log('Order Items with flash offers and order mode:', orderItems);

    // Determine API endpoint based on mode
    const apiEndpoint = isEditMode 
      ? `${baseurl}/orders/update-order/${orderNumber}`
      : `${baseurl}/orders/create-complete-order`;

    const apiMethod = isEditMode ? 'PUT' : 'POST';

    // Send to backend
    const orderResponse = await fetch(apiEndpoint, {
      method: apiMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: orderData,
        orderItems: orderItems,
        has_flash_offers: orderTotals.totalFlashFreeItemsValue > 0
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} order`);
    }

    const orderResult = await orderResponse.json();
    console.log('Order Response:', orderResult);
    
    // Clear cart only for new orders (not for edits)
    if (!isEditMode) {
      await clearCart();
    }

    // Navigate to confirmation page
    navigate('/order-confirmation', {
      state: { 
        orderId: orderResult.order_number || orderData.order_number, 
        orderNumber: orderResult.order_number,
        total: orderTotals.finalTotal,
        orderTotals,
        orderMode,
        staffName: assigned_staff,
        staffIncentive: staff_incentive,
        isEditMode: isEditMode,
        flashFreeItems: orderTotals.totalFlashFreeItemsValue
      },
    });

  } catch (error: any) {
    console.error('Error placing order:', error);
    alert(`Failed to ${isEditMode ? 'update' : 'place'} order: ${error.message}`);
    setIsPlacingOrder(false);
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
          <span className="font-semibold">
            {isEditMode ? 'Update Order' : 'Checkout'}
          </span>
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

        {/* Flash Offer Banner */}
        {orderTotals.totalFlashFreeItemsValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 animate-pulse" />
              <div>
                <p className="font-semibold">⚡ Flash Offers Applied!</p>
                <p className="text-sm opacity-90">
                  You're getting {orderTotals.totalFlashFreeItemsValue} free item(s) from flash offers
                  <br />
                  <span className="text-xs">Backend will calculate final price with free items</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
              {orderTotals.totalFlashFreeItemsValue > 0 && (
                <span className="text-green-600 ml-2">
                  (+{orderTotals.totalFlashFreeItemsValue} free from flash offers)
                </span>
              )}
            </p>
          </div>

          {/* Order Total Breakdown */}
          <div className="border-t border-border pt-4 space-y-3">
            {/* Credit Charges */}
            {orderTotals.totalCreditCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span>Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{orderTotals.totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {/* Customer Sale Price Total */}
            <div className="flex justify-between text-muted-foreground">
              <span>Customer Sale Price Total</span>
              <span>₹{orderTotals.totalCustomerSalePriceValue?.toLocaleString() || orderTotals.finalTotal?.toLocaleString()}</span>
            </div>

            {/* Discount */}
            {orderTotals.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Your Discount</span>
                </div>
                <span className="font-semibold">-₹{orderTotals.totalDiscount.toLocaleString()}</span>
              </div>
            )}

            {/* Flash Free Items */}
            {orderTotals.totalFlashFreeItemsValue > 0 && (
              <div className="flex justify-between text-yellow-600">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span>Flash Free Items</span>
                </div>
                <span className="font-semibold">+{orderTotals.totalFlashFreeItemsValue} FREE</span>
              </div>
            )}

            {/* Taxable Amount */}
            {orderTotals.totalTax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount</span>
                <span>₹{orderTotals.totalTaxableAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Tax */}
            {orderTotals.totalTax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Total GST</span>
                <span>+₹{orderTotals.totalTax.toLocaleString()}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>Base Total</span>
              <span className="text-primary">₹{orderTotals.finalTotal.toLocaleString()}</span>
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

            {/* Order Type Display */}
            {isEditMode && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-muted-foreground">Order Type:</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  Edit Mode
                </span>
              </div>
            )}

            {/* Savings Message */}
            {orderTotals.totalDiscount > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2 bg-green-50 rounded-lg p-2">
                🎉 You saved ₹{orderTotals.totalDiscount.toLocaleString()} with your discount!
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
              isPlacingOrder || 
              !address.name ||
              !address.phone ||
              !address.addressLine ||
              !address.city ||
              !address.pincode ||
              cartItems.length === 0
            }
          >
            {isPlacingOrder ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                {isEditMode ? "Updating Order..." : "Placing Order..."}
              </span>
            ) : (
              <>{isEditMode ? "Update Order" : "Place Order"} - ₹{orderTotals.finalTotal.toLocaleString()}</>
            )}
          </Button>
          {orderTotals.totalFlashFreeItemsValue > 0 && (
            <p className="text-xs text-center text-yellow-600 mt-2">
              * Includes {orderTotals.totalFlashFreeItemsValue} free items from flash offers
            </p>
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">
            By {isEditMode ? 'updating' : 'placing'} this order, you agree to our terms and conditions
          </p>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Checkout;
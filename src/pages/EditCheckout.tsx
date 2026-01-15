import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Tag, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { baseurl } from '@/Api/Baseurl';

const EditCheckout = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  
  const { user, cart, clearCart } = useApp();
  
  const [originalOrderData, setOriginalOrderData] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [orderMode, setOrderMode] = useState<'KACHA' | 'PAKKA'>('KACHA');

  // Address state
  const [address, setAddress] = useState({
    name: "",
    businessName: "",
    phone: "",
    addressLine: "",
    city: "",
    pincode: "",
  });

  // Fetch original order data and user details
  useEffect(() => {
    const fetchData = async () => {
      if (!orderNumber || !user?.id) return;

      try {
        // Fetch original order details
        const orderResponse = await fetch(`${baseurl}/orders/details/${orderNumber}`);
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOriginalOrderData(orderData);
          
          if (orderData.order?.order_mode) {
            setOrderMode(orderData.order.order_mode);
          }
        }

        // Fetch user details
        const userResponse = await fetch(`${baseurl}/accounts/${user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserDetails(userData);

          // Pre-fill address form
          setAddress({
            name: userData.name || "",
            businessName: userData.business_name || "",
            phone: userData.mobile_number || "",
            addressLine:
              `${userData.shipping_address_line1 || ""}, ` +
              `${userData.shipping_address_line2 || ""}, ` +
              `${userData.shipping_city || ""}, ` +
              `${userData.shipping_state || ""} - ` +
              `${userData.shipping_pin_code || ""}, ` +
              `${userData.shipping_country || ""}`,
            city: userData.shipping_city || "",
            pincode: userData.shipping_pin_code || "",
          });
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchData();
  }, [orderNumber, user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };

  // Calculate item breakdown (same as in EditCart)
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
    const userDiscountPercentage = user?.discount ? parseFloat(user.discount) : 0;

    // Calculate credit charge (percentage of edited_sale_price)
    const creditChargePerUnit = (editedSalePrice * creditPercentage) / 100;

    // Calculate customer sale price
    const customerSalePricePerUnit = editedSalePrice + creditChargePerUnit;

    // Calculate discount (percentage of customer_sale_price)
    const discountAmountPerUnit = (customerSalePricePerUnit * userDiscountPercentage) / 100;

    // Calculate item total (before tax)
    const itemTotalPerUnit = customerSalePricePerUnit - discountAmountPerUnit;

    // Calculate tax (GST handling based on inclusive/exclusive)
    let taxableAmountPerUnit = 0;
    let taxAmountPerUnit = 0;

    if (isInclusiveGST) {
      taxableAmountPerUnit = itemTotalPerUnit / (1 + (gstRate / 100));
      taxAmountPerUnit = itemTotalPerUnit - taxableAmountPerUnit;
    } else {
      taxableAmountPerUnit = itemTotalPerUnit;
      taxAmountPerUnit = (taxableAmountPerUnit * gstRate) / 100;
    }

    // Calculate CGST/SGST (split equally)
    const sgstPercentage = gstRate / 2;
    const cgstPercentage = gstRate / 2;
    const sgstAmountPerUnit = taxAmountPerUnit / 2;
    const cgstAmountPerUnit = taxAmountPerUnit / 2;

    // Calculate final amount per unit (including tax if exclusive)
    const finalAmountPerUnit = isInclusiveGST ? itemTotalPerUnit : itemTotalPerUnit + taxAmountPerUnit;

    return {
      mrp,
      sale_price: salePrice,
      edited_sale_price: editedSalePrice,
      credit_charge: creditChargePerUnit,
      credit_period: item.creditPeriod,
      credit_percentage: creditPercentage,
      customer_sale_price: customerSalePricePerUnit,
      discount_percentage: userDiscountPercentage,
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

  // Calculate fresh order summary
  const calculateFreshOrderSummary = () => {
    if (!cart || cart.length === 0) {
      return {
        orderTotals: {
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
          userDiscount: user?.discount ? parseFloat(user.discount) : 0
        }
      };
    }

    const totals = cart.reduce(
      (acc, item) => {
        const breakdown = calculateItemBreakdown(item);
        
        return {
          subtotal: acc.subtotal + breakdown.totals.totalEditedSalePrice,
          totalCreditCharges: acc.totalCreditCharges + breakdown.totals.totalCreditCharge,
          totalCustomerSalePrice: acc.totalCustomerSalePrice + breakdown.totals.totalCustomerSalePrice,
          totalDiscount: acc.totalDiscount + breakdown.totals.totalDiscountAmount,
          totalItemTotal: acc.totalItemTotal + breakdown.totals.totalItemTotal,
          totalTaxableAmount: acc.totalTaxableAmount + breakdown.totals.totalTaxableAmount,
          totalTax: acc.totalTax + breakdown.totals.totalTaxAmount,
          totalSgst: acc.totalSgst + breakdown.totals.totalSgstAmount,
          totalCgst: acc.totalCgst + breakdown.totals.totalCgstAmount,
          finalTotal: acc.finalTotal + breakdown.totals.finalPayableAmount,
        };
      },
      {
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
      }
    );

    return {
      orderTotals: {
        ...totals,
        userDiscount: user?.discount ? parseFloat(user.discount) : 0
      }
    };
  };

  const handleUpdateOrder = async () => {
    if (isUpdatingOrder || !orderNumber || !originalOrderData?.order) return;

    if (!user) {
      alert('Please login to update order');
      return;
    }

    setIsUpdatingOrder(true);

    try {
      // Fetch staff information (preserve from original order if available)
      let staff_incentive = originalOrderData.order.staff_incentive || 0;
      let assigned_staff = originalOrderData.order.assigned_staff || "Unassigned";
      let staffEmail = originalOrderData.order.staff_email || null;
      let staffMobile = originalOrderData.order.staff_mobile || null;
      
      // If we need to fetch fresh staff data (optional)
      if (user.staffid && (!staff_incentive || !assigned_staff)) {
        try {
          const staffResponse = await fetch(`${baseurl}/accounts/${user.staffid}`);
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            if (staffData && typeof staffData === 'object') {
              staff_incentive = staffData.incentive_percent || staff_incentive;
              assigned_staff = staffData.name || assigned_staff;
              staffEmail = staffData.email || staffEmail;
              staffMobile = staffData.mobile_number || staffMobile;
            }
          }
        } catch (staffErr) {
          console.error('Error fetching staff details:', staffErr);
        }
      }

      // Use current cart to calculate new totals
      const { orderTotals: newOrderTotals } = calculateFreshOrderSummary();
      
      // Create updated order data - PRESERVE ORIGINAL CRITICAL FIELDS
      const updatedOrderData = {
        order: {
          order_number: orderNumber,
          customer_id: parseInt(user.id),
          customer_name: address.name || userDetails?.name || user.name,
          retailer_mobile: address.phone || userDetails?.mobile_number || user.mobile,
          
          // Updated financials
          order_total: newOrderTotals.totalCustomerSalePrice,
          discount_amount: newOrderTotals.totalDiscount,
          taxable_amount: newOrderTotals.totalTaxableAmount,
          tax_amount: newOrderTotals.totalTax,
          net_payable: newOrderTotals.finalTotal,
          
          // Credit period (use average)
          credit_period: cart.reduce((sum, item) => {
            return sum + (parseInt(item.creditPeriod) || 0);
          }, 0) / cart.length || 0,
          
          // Delivery estimate
          estimated_delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          
          // PRESERVE ORIGINAL IMPORTANT FIELDS
          staffid: originalOrderData.order.staffid || parseInt(userDetails?.staffid),
          assigned_staff: originalOrderData.order.assigned_staff || assigned_staff,
          order_mode: orderMode,
          approval_status: originalOrderData.order.approval_status || "Approved",
          staff_incentive: originalOrderData.order.staff_incentive || staff_incentive,
          staff_email: originalOrderData.order.staff_email || staffEmail,
          staff_mobile: originalOrderData.order.staff_mobile || staffMobile,
          retailer_email: userDetails?.email || user.email,
          order_placed_by: originalOrderData.order.order_placed_by || parseInt(user.id),
          ordered_by: originalOrderData.order.ordered_by || address.name || user.name,
          
          // Other preserved fields
          created_at: originalOrderData.order.created_at,
          updated_at: new Date().toISOString(),
        },
        
        // Updated order items from current cart
        orderItems: cart.map((item) => {
          const breakdown = calculateItemBreakdown(item);
          
          return {
            order_number: orderNumber,
            product_id: parseInt(item.product.id),
            item_name: item.product.name,
            mrp: breakdown.mrp,
            sale_price: breakdown.sale_price,
            edited_sale_price: breakdown.edited_sale_price,
            credit_charge: breakdown.totals.totalCreditCharge,
            credit_period: item.creditPeriod || "0",
            credit_percentage: breakdown.credit_percentage,
            customer_sale_price: breakdown.totals.totalCustomerSalePrice,
            discount_percentage: breakdown.discount_percentage,
            discount_amount: breakdown.totals.totalDiscountAmount,
            item_total: breakdown.totals.totalItemTotal,
            taxable_amount: breakdown.totals.totalTaxableAmount,
            tax_percentage: breakdown.tax_percentage,
            tax_amount: breakdown.totals.totalTaxAmount,
            sgst_percentage: breakdown.sgst_percentage,
            sgst_amount: breakdown.totals.totalSgstAmount,
            cgst_percentage: breakdown.cgst_percentage,
            cgst_amount: breakdown.totals.totalCgstAmount,
            final_amount: breakdown.totals.finalPayableAmount,
            quantity: item.quantity,
            total_amount: breakdown.totals.finalPayableAmount,
            discount_applied_scheme: breakdown.discount_percentage > 0 ? 'user_discount' : 'none'
          };
        })
      };

      console.log('📤 Sending updated order data:', updatedOrderData);

      // ✅ FIX: Use the correct endpoint that exists
      const response = await fetch(`${baseurl}/orders/update-order/${orderNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrderData),
      });

      // Handle non-JSON responses (HTML error pages)
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Failed to update order';
        } else {
          // Handle HTML/plain text errors
          const text = await response.text();
          console.error('Non-JSON error response:', text.substring(0, 200));
          errorMessage = `Server error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Order update response:', result);
      
      // Clear cart after successful update
      if (clearCart) {
        await clearCart();
      }
      
      // Navigate to confirmation page
      navigate(`/order-updated-confirmation/${orderNumber}`, {
        state: {
          orderId: orderNumber,
          orderNumber: orderNumber,
          total: newOrderTotals.finalTotal,
          orderTotals: newOrderTotals,
          orderMode,
          isUpdate: true,
          previousTotal: originalOrderData.order.net_payable || 0,
          changeAmount: newOrderTotals.finalTotal - (originalOrderData.order.net_payable || 0),
          staffName: assigned_staff,
          staffIncentive: staff_incentive,
          updatedAt: new Date().toISOString()
        },
      });

    } catch (error: any) {
      console.error('❌ Error updating order:', error);
      alert(`Failed to update order: ${error.message}`);
      setIsUpdatingOrder(false);
    }
  };

  const { orderTotals: freshOrderTotals } = calculateFreshOrderSummary();
  const displayTotals = freshOrderTotals;

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background pb-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/edit-order/${orderNumber}`)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">Update Order {orderNumber}</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-28">
        {/* Edit Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5" />
            <div>
              <p className="font-semibold">Updating Order: {orderNumber}</p>
              <p className="text-sm opacity-90">
                Staff assignments and order metadata will be preserved
              </p>
            </div>
          </div>
        </motion.div>

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
                  <option value="KACHA">KACHA (Tentative)</option>
                  <option value="PAKKA">PAKKA (Confirmed)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            
            {originalOrderData && (
              <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                <p>Original order was placed as: <span className="font-semibold">{originalOrderData.order.order_mode}</span></p>
                <p>Staff: <span className="font-semibold">{originalOrderData.order.assigned_staff || 'Unassigned'}</span></p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Updated Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4">Updated Order Summary</h2>

          {/* Items Count */}
          <div className="mb-4">
            <p className="text-muted-foreground">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in updated order
            </p>
          </div>

          {/* Order Total Breakdown */}
          <div className="border-t border-border pt-4 space-y-3">
            {/* Credit Charges */}
            {displayTotals.totalCreditCharges > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span>Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{displayTotals.totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {/* Discount */}
            {displayTotals.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Your Discount ({displayTotals.userDiscount}%)</span>
                </div>
                <span className="font-semibold">-₹{displayTotals.totalDiscount.toLocaleString()}</span>
              </div>
            )}

            {/* Taxable Amount */}
            {displayTotals.totalTax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount</span>
                <span>₹{displayTotals.totalTaxableAmount.toLocaleString()}</span>
              </div>
            )}

            {/* Tax */}
            {displayTotals.totalTax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Total GST</span>
                <span>+₹{displayTotals.totalTax.toLocaleString()}</span>
              </div>
            )}

            {/* Final Total */}
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>Updated Total</span>
              <span className="text-primary">₹{displayTotals.finalTotal.toLocaleString()}</span>
            </div>

            {/* Comparison with original total if available */}
            {originalOrderData && (
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous Total:</span>
                  <span className="line-through">₹{originalOrderData.order.net_payable?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold mt-1">
                  <span>Change:</span>
                  <span className={
                    displayTotals.finalTotal > (originalOrderData.order.net_payable || 0) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    {displayTotals.finalTotal > (originalOrderData.order.net_payable || 0) ? '+' : ''}
                    ₹{(displayTotals.finalTotal - (originalOrderData.order.net_payable || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

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
            {displayTotals.totalDiscount > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2 bg-green-50 rounded-lg p-2">
                🎉 You saved ₹{displayTotals.totalDiscount.toLocaleString()} with your {displayTotals.userDiscount}% discount!
              </div>
            )}
          </div>
        </motion.div>

        {/* Update Order Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky bottom-6 bg-background/95 backdrop-blur-lg pt-4"
        >
          <Button
            onClick={handleUpdateOrder}
            size="lg"
            className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            disabled={
              isUpdatingOrder || 
              !address.name ||
              !address.phone ||
              !address.addressLine ||
              !address.city ||
              !address.pincode ||
              cart.length === 0
            }
          >
            {isUpdatingOrder ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Updating Order...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Update Order - ₹{displayTotals.finalTotal.toLocaleString()}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            This will update the existing order #{orderNumber}
          </p>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default EditCheckout;
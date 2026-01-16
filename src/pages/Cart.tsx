import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, Receipt, CreditCard, Loader2, TagIcon, User } from 'lucide-react';
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

const Cart = () => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    updateItemCreditPeriod,
    creditPeriods,
    user,
    syncCartWithBackend,
    fetchOrderForEdit,
    addOrderItemsToCart,
    clearCart
  } = useApp();
  
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderNumber, setEditOrderNumber] = useState<string | null>(null);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, number>>({});

  // Check if this is edit mode
  useEffect(() => {
    if (orderNumber) {
      setIsEditMode(true);
      setEditOrderNumber(orderNumber);
      console.log('Edit mode activated for order:', orderNumber);
    } else {
      setIsEditMode(false);
      setEditOrderNumber(null);
    }
  }, [orderNumber]);

  // Fetch category discounts
  useEffect(() => {
    const loadCategoryDiscounts = async () => {
      try {
        setLoadingCategories(true);
        // Fetch categories with discounts from API
        const response = await fetch('http://localhost:5000/categories');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categories = await response.json();
        
        const discountMap: Record<string, number> = {};
        const productMap: Record<string, number> = {};
        
        if (Array.isArray(categories)) {
          categories.forEach((category: any) => {
            // Store category discount if it exists
            if (category.discount > 0) {
              discountMap[category.id] = parseFloat(category.discount) || 0;
            }
          });
        }
        
        setCategoryDiscounts(discountMap);
        
        // Also fetch products to map product IDs to category IDs
        try {
          const productsResponse = await fetch('http://localhost:5000/get-sales-products');
          if (productsResponse.ok) {
            const products = await productsResponse.json();
            const productsArray = Array.isArray(products) ? products : (products.data || []);
            
            productsArray.forEach((product: any) => {
              if (product.category_id) {
                productMap[product.id] = product.category_id;
              }
            });
            
            setProductCategoryMap(productMap);
          }
        } catch (productError) {
          console.error('Error fetching products for category mapping:', productError);
        }
        
      } catch (error) {
        console.error('Error fetching category discounts:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoryDiscounts();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const initializeCart = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        if (isEditMode && editOrderNumber) {
          console.log('Loading order for editing:', editOrderNumber);
          
          // Fetch order data
          const orderData = await fetchOrderForEdit(editOrderNumber);
          
          if (orderData?.items?.length > 0) {
            console.log('Found order items:', orderData.items);
            
            // Clear cart and add order items
            await clearCart();
            await addOrderItemsToCart(orderData.items);
            
            // Force sync to ensure cart is updated
            await syncCartWithBackend();
          } else {
            console.warn('No items found in order');
            await syncCartWithBackend();
          }
        } else {
          // Regular cart mode
          await syncCartWithBackend();
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [user, isEditMode, editOrderNumber]);

  // Get user discount percentage (retailer discount)
  const userDiscountPercentage = user?.discount ? parseFloat(user.discount) : 0;

  // Get category discount for a product
  const getProductCategoryDiscount = (product: any) => {
    if (!product || !product.id) return 0;
    
    // Try to get category ID from product
    const categoryId = product.category_id || productCategoryMap[product.id];
    
    if (categoryId && categoryDiscounts[categoryId]) {
      return categoryDiscounts[categoryId];
    }
    
    return 0;
  };

  // Check if product has category discount
  const hasCategoryDiscount = (product: any) => {
    return getProductCategoryDiscount(product) > 0;
  };

  // Calculate item price breakdown with priority: Category discount > Retailer discount
  const calculateItemBreakdown = (item: any) => {
    const mrp = item.product.mrp || 0;
    const salePrice = item.product.price || 0;
    const editedSalePrice = item.product.edited_sale_price || salePrice;
    const gstRate = item.product.gst_rate || 0;
    const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
    const quantity = item.quantity || 1;
    const creditPercentage = item.creditPercentage || 0;

    // Get category discount for this product
    const categoryDiscountPercentage = getProductCategoryDiscount(item.product);
    
    // Determine which discount to apply: Category discount takes priority over retailer discount
    const applicableDiscountPercentage = categoryDiscountPercentage > 0 ? categoryDiscountPercentage : userDiscountPercentage;
    const discountType = categoryDiscountPercentage > 0 ? 'category' : (userDiscountPercentage > 0 ? 'retailer' : 'none');

    console.log(`Product ${item.product.id} (${item.product.name}):`);
    console.log(`- Category discount = ${categoryDiscountPercentage}%`);
    console.log(`- Retailer discount = ${userDiscountPercentage}%`);
    console.log(`- Applied discount = ${applicableDiscountPercentage}% (${discountType})`);

    // Step 1: Calculate credit charge (percentage of edited_sale_price)
    const creditChargePerUnit = (editedSalePrice * creditPercentage) / 100;

    // Step 2: Calculate price after credit charge
    const priceAfterCredit = editedSalePrice + creditChargePerUnit;

    // Step 3: Apply applicable discount (either category or retailer, but not both)
    const discountAmountPerUnit = applicableDiscountPercentage > 0 ? (priceAfterCredit * applicableDiscountPercentage) / 100 : 0;
    const priceAfterDiscount = priceAfterCredit - discountAmountPerUnit;

    // Step 4: Calculate item total (before tax)
    const itemTotalPerUnit = priceAfterDiscount;

    // Step 5: Calculate tax (GST handling based on inclusive/exclusive)
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

    // Calculate customer sale price per unit (price after discount but before tax for exclusive GST)
    // This is the price the customer actually pays per unit (excluding GST if exclusive)
    const customerSalePricePerUnit = priceAfterDiscount;

    // Calculate totals for the quantity
    const totalMRP = mrp * quantity;
    const totalSalePrice = salePrice * quantity;
    const totalEditedSalePrice = editedSalePrice * quantity;
    const totalCreditCharge = creditChargePerUnit * quantity;
    const totalDiscountAmount = discountAmountPerUnit * quantity;
    const totalItemTotal = itemTotalPerUnit * quantity;
    const totalTaxableAmount = taxableAmountPerUnit * quantity;
    const totalTaxAmount = taxAmountPerUnit * quantity;
    const totalSgstAmount = sgstAmountPerUnit * quantity;
    const totalCgstAmount = cgstAmountPerUnit * quantity;
    const totalCustomerSalePrice = customerSalePricePerUnit * quantity;
    const finalPayableAmount = finalAmountPerUnit * quantity;

    return {
      // Per unit values
      mrp,
      sale_price: salePrice,
      edited_sale_price: editedSalePrice,
      credit_charge: creditChargePerUnit,
      credit_period: item.creditPeriod,
      credit_percentage: creditPercentage,
      discount_type: discountType,
      category_discount_percentage: categoryDiscountPercentage,
      retailer_discount_percentage: userDiscountPercentage,
      applicable_discount_percentage: applicableDiscountPercentage, // This is what we need to pass
      discount_amount: discountAmountPerUnit,
      customer_sale_price: customerSalePricePerUnit, // This is what we need to pass
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
      
      // For display purposes
      isInclusiveGST,
      quantity,
      
      // Totals for the entire quantity
      totals: {
        totalMRP,
        totalSalePrice,
        totalEditedSalePrice,
        totalCreditCharge,
        totalDiscountAmount,
        totalItemTotal,
        totalTaxableAmount,
        totalTaxAmount,
        totalSgstAmount,
        totalCgstAmount,
        totalCustomerSalePrice, // This is what we need to pass
        finalPayableAmount
      }
    };
  };

  // Calculate order summary totals
  const calculateOrderSummary = () => {
    const orderItems = cart.map(item => {
      const breakdown = calculateItemBreakdown(item);
      return {
        product: item.product,
        quantity: item.quantity,
        creditPeriod: item.creditPeriod,
        creditPercentage: item.creditPercentage,
        priceMultiplier: item.priceMultiplier,
        
        breakdown: {
          perUnit: {
            mrp: breakdown.mrp,
            sale_price: breakdown.sale_price,
            edited_sale_price: breakdown.edited_sale_price,
            credit_charge: breakdown.credit_charge,
            credit_period: breakdown.credit_period,
            credit_percentage: breakdown.credit_percentage,
            discount_type: breakdown.discount_type,
            category_discount_percentage: breakdown.category_discount_percentage,
            retailer_discount_percentage: breakdown.retailer_discount_percentage,
            applicable_discount_percentage: breakdown.applicable_discount_percentage, // Pass this
            discount_amount: breakdown.discount_amount,
            customer_sale_price: breakdown.customer_sale_price, // Pass this
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

    // Calculate order totals with separate tracking for category vs retailer discounts
    let totalCategoryDiscounts = 0;
    let totalRetailerDiscounts = 0;
    let totalCustomerSalePrice = 0; // Initialize total customer sale price
    
    const orderTotals = {
      subtotal: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalEditedSalePrice;
      }, 0),
      
      totalCreditCharges: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalCreditCharge;
      }, 0),
      
      totalCategoryDiscounts: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        if (breakdown.discount_type === 'category') {
          totalCategoryDiscounts += breakdown.totals.totalDiscountAmount;
          return sum + breakdown.totals.totalDiscountAmount;
        }
        return sum;
      }, 0),
      
      totalRetailerDiscounts: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        if (breakdown.discount_type === 'retailer') {
          totalRetailerDiscounts += breakdown.totals.totalDiscountAmount;
          return sum + breakdown.totals.totalDiscountAmount;
        }
        return sum;
      }, 0),
      
      totalDiscount: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalDiscountAmount;
      }, 0),
      
      totalCustomerSalePrice: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        const customerSalePrice = breakdown.totals.totalCustomerSalePrice;
        totalCustomerSalePrice += customerSalePrice;
        return sum + customerSalePrice;
      }, 0),
      
      totalItemTotal: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalItemTotal;
      }, 0),
      
      totalTaxableAmount: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalTaxableAmount;
      }, 0),
      
      totalTax: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalTaxAmount;
      }, 0),
      
      totalSgst: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalSgstAmount;
      }, 0),
      
      totalCgst: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalCgstAmount;
      }, 0),
      
      finalTotal: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.finalPayableAmount;
      }, 0),
      
      userDiscount: userDiscountPercentage,
      totalCategoryDiscountsValue: totalCategoryDiscounts,
      totalRetailerDiscountsValue: totalRetailerDiscounts,
      totalCustomerSalePriceValue: totalCustomerSalePrice, // Pass this to checkout
      itemCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
    };

    return { orderItems, orderTotals };
  };

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
    try {
      const period = creditPeriods.find(cp => cp.days === parseInt(selectedDays));
      await updateItemCreditPeriod(productId, selectedDays, period?.percentage);
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error updating credit period:', error);
    }
  };

  // Handle quantity update
  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    try {
      await updateCartQuantity(productId, newQuantity);
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
      await syncCartWithBackend();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Get discount badge for a product
  const getDiscountBadge = (product: any) => {
    const categoryDiscount = getProductCategoryDiscount(product);
    
    if (categoryDiscount > 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          <TagIcon className="h-3 w-3" />
          {categoryDiscount}% Category Discount
        </span>
      );
    } else if (userDiscountPercentage > 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
          <User className="h-3 w-3" />
          {userDiscountPercentage}% Retailer Discount
        </span>
      );
    }
    return null;
  };

  // Get discount type display
  const getDiscountTypeDisplay = (product: any) => {
    const categoryDiscount = getProductCategoryDiscount(product);
    
    if (categoryDiscount > 0) {
      return `Category Discount (${categoryDiscount}%)`;
    } else if (userDiscountPercentage > 0) {
      return `Retailer Discount (${userDiscountPercentage}%)`;
    }
    return "No Discount";
  };

  // Checkout/Update handler
  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const { orderItems, orderTotals } = calculateOrderSummary();
    
    if (isEditMode && editOrderNumber) {
      navigate('/checkout', { 
        state: { 
          cartItems: orderItems,
          orderTotals,
          userDiscountPercentage,
          isEditMode: true,
          orderNumber: editOrderNumber
        } 
      });
    } else {
      navigate('/checkout', { 
        state: { 
          cartItems: orderItems,
          orderTotals,
          userDiscountPercentage
        } 
      });
    }
  };

  if (loading || loadingCategories) {
    return (
      <div className="min-h-screen bg-background pb-20">
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
              {isEditMode ? 'Edit Order' : 'Shopping Cart'}
            </span>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="bg-muted rounded-full p-8 mb-6"
          >
            <Loader2 className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">
            {isEditMode ? 'Loading order...' : 'Loading cart...'}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode ? 'Please wait while we load your order for editing' : 'Please wait while we load your cart'}
          </p>
        </div>
        <TabBar />
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
            <span className="font-semibold">
              {isEditMode ? 'Edit Order' : 'Shopping Cart'}
            </span>
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

          <h2 className="text-2xl font-bold mb-2">
            {isEditMode ? 'No items to edit' : 'Your cart is empty'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isEditMode ? 'Add products to update the order' : 'Add some products to get started!'}
          </p>

          <Button onClick={() => navigate('/home')} size="lg">
            Start Shopping
          </Button>
        </div>

        <TabBar />
      </div>
    );
  }

  // Get current order summary for display
  const { orderItems, orderTotals } = calculateOrderSummary();

  // Calculate how many items have category discounts
  const itemsWithCategoryDiscount = cart.filter(item => 
    hasCategoryDiscount(item.product)
  ).length;

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
          <span className="font-semibold">
            {isEditMode ? `Edit Order ${editOrderNumber}` : 'Shopping Cart'} ({cart.length})
          </span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* EDIT MODE BANNER */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5" />
              <div>
                <p className="font-semibold">Editing Order: {editOrderNumber}</p>
                <p className="text-sm opacity-90">
                  You're editing an existing order. Changes will update the original order.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* DISCOUNT BANNERS */}
        {orderTotals.totalCategoryDiscountsValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <TagIcon className="h-5 w-5" />
              <div>
                <p className="font-semibold">Category Discounts Applied!</p>
                <p className="text-sm opacity-90">
                  {itemsWithCategoryDiscount} item(s) with category discounts
                  <br />
                  <span className="font-bold">Saved: ₹{orderTotals.totalCategoryDiscountsValue.toLocaleString()}</span>
                  <span className="ml-2 text-xs opacity-75">(Priority over retailer discount)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {orderTotals.totalRetailerDiscountsValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div>
                <p className="font-semibold">Retailer Discount Applied!</p>
                <p className="text-sm opacity-90">
                  Applied to {cart.length - itemsWithCategoryDiscount} item(s) without category discounts
                  <br />
                  <span className="font-bold">Saved: ₹{orderTotals.totalRetailerDiscountsValue.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {userDiscountPercentage > 0 && orderTotals.totalCategoryDiscountsValue === 0 && orderTotals.totalRetailerDiscountsValue === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5" />
              <div>
                <p className="font-semibold">Retailer Discount Available!</p>
                <p className="text-sm opacity-90">
                  Your {userDiscountPercentage}% retailer discount will be applied at checkout
                  (Category discounts have priority)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CART ITEMS */}
        {cart.map((item, index) => {
          const breakdown = calculateItemBreakdown(item);
          const finalPayableAmount = breakdown.totals.finalPayableAmount;
          const hasCatDiscount = hasCategoryDiscount(item.product);

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
                  src={item.product.image || '/placeholder.jpg'}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-xl bg-muted"
                />

                <div className="flex-1">
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
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
                        {getDiscountBadge(item.product)}
                      </div>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="p-2 hover:bg-muted rounded-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Price Display */}
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
                      <span className="text-sm text-muted-foreground">
                        per unit
                      </span>
                    </div>
                    
                    {/* Discount Information */}
                    {breakdown.applicable_discount_percentage > 0 && (
                      <div className="mt-1">
                        <div className="text-sm text-muted-foreground">
                          <span className={hasCatDiscount ? 'text-blue-600 font-medium' : 'text-purple-600 font-medium'}>
                            {hasCatDiscount ? 'Category' : 'Retailer'} Discount: {breakdown.applicable_discount_percentage}%
                          </span>
                          <span className="ml-2 text-green-600">
                            -₹{breakdown.discount_amount.toLocaleString()} per unit
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {hasCatDiscount ? 'Category discount has priority' : 'Retailer discount applied'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Amount */}
                  <div className="text-sm mb-4">
                    <div className="flex justify-between pt-1">
                      <span className="font-semibold">Final Amount:</span>
                      <span className="font-bold text-primary">
                        ₹{finalPayableAmount.toLocaleString()} 
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
                          disabled={item.quantity <= 1}
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
                      >
                        <SelectTrigger className="w-full bg-muted">
                          <SelectValue>
                            {getCreditPeriodDisplay(item.creditPeriod)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No Credit Period</SelectItem>
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
              <span>₹{orderTotals.subtotal.toLocaleString()}</span>
            </div>

            {orderTotals.totalCreditCharges > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Credit Charges</span>
                </div>
                <span className="text-orange-500">+₹{orderTotals.totalCreditCharges.toLocaleString()}</span>
              </div>
            )}

            {orderTotals.totalCategoryDiscountsValue > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">Category Discounts</span>
                </div>
                <span className="font-semibold text-blue-600">-₹{orderTotals.totalCategoryDiscountsValue.toLocaleString()}</span>
              </div>
            )}

            {orderTotals.totalRetailerDiscountsValue > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-600">Retailer Discount ({userDiscountPercentage}%)</span>
                </div>
                <span className="font-semibold text-purple-600">-₹{orderTotals.totalRetailerDiscountsValue.toLocaleString()}</span>
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
                  🎉 Total Savings: ₹{orderTotals.totalDiscount.toLocaleString()}
                  {orderTotals.totalCategoryDiscountsValue > 0 && orderTotals.totalRetailerDiscountsValue > 0 && (
                    <span>
                      {' '}(Category: ₹{orderTotals.totalCategoryDiscountsValue.toLocaleString()}, Retailer: ₹{orderTotals.totalRetailerDiscountsValue.toLocaleString()})
                    </span>
                  )}
                  {orderTotals.totalCategoryDiscountsValue > 0 && orderTotals.totalRetailerDiscountsValue === 0 && (
                    <span> (Category discounts have priority)</span>
                  )}
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
          >
            {isEditMode ? "Update Order" : "Checkout"}
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Cart;
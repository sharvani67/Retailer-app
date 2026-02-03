import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, Receipt, CreditCard, Loader2, TagIcon, User, Zap, Gift } from 'lucide-react';
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
  // NEW: Flash sales state
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loadingFlashSales, setLoadingFlashSales] = useState(true);
  const [productFlashOffers, setProductFlashOffers] = useState<Record<string, any>>({});

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

  // Fetch flash sales with priority 1
  useEffect(() => {
    const loadFlashSales = async () => {
      try {
        setLoadingFlashSales(true);
        const response = await fetch(`${baseurl}/flashofferretailer`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setFlashSales(result.data);
          
          const flashOffersMap: Record<string, any> = {};
          result.data.forEach((offer: any) => {
            if (offer.product_id) {
              flashOffersMap[offer.product_id] = offer;
            }
          });
          
          setProductFlashOffers(flashOffersMap);
          console.log('Flash offers loaded:', Object.keys(flashOffersMap).length, 'offers');
        }
      } catch (error) {
        console.error('Error fetching flash sales:', error);
      } finally {
        setLoadingFlashSales(false);
      }
    };

    loadFlashSales();
  }, []);

  // Fetch category discounts (priority 2)
  useEffect(() => {
    const loadCategoryDiscounts = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${baseurl}/categories`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categories = await response.json();
        
        const discountMap: Record<string, number> = {};
        const productMap: Record<string, number> = {};
        
        if (Array.isArray(categories)) {
          categories.forEach((category: any) => {
            if (category.discount > 0) {
              discountMap[category.id] = parseFloat(category.discount) || 0;
            }
          });
        }
        
        setCategoryDiscounts(discountMap);
        
        // Also fetch products to map product IDs to category IDs
        try {
          const productsResponse = await fetch(`${baseurl}/get-sales-products`);
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
          
          const orderData = await fetchOrderForEdit(editOrderNumber);
          
          if (orderData?.items?.length > 0) {
            console.log('Found order items:', orderData.items);
            
            await clearCart();
            await addOrderItemsToCart(orderData.items);
            await syncCartWithBackend();
          } else {
            console.warn('No items found in order');
            await syncCartWithBackend();
          }
        } else {
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

  // Get user discount percentage (retailer discount - priority 3)
  const userDiscountPercentage = user?.discount ? parseFloat(user.discount) : 0;

  // Get flash offer for a product
  const getProductFlashOffer = (product: any) => {
    if (!product || !product.id) return null;
    
    const flashOffer = productFlashOffers[product.id];
    
    if (flashOffer) {
      console.log(`Flash offer found for product ${product.id}: Buy ${flashOffer.buy_quantity} Get ${flashOffer.get_quantity}`);
    }
    
    return flashOffer || null;
  };

  // Get category discount for a product
  const getProductCategoryDiscount = (product: any) => {
    if (!product || !product.id) return 0;
    
    const categoryId = product.category_id || productCategoryMap[product.id];
    
    if (categoryId && categoryDiscounts[categoryId]) {
      return categoryDiscounts[categoryId];
    }
    
    return 0;
  };

  // FIXED: Check if qualifies for flash offer (ONLY exact buy_quantity)
  const hasFlashOffer = (cartItem: any) => {
    const flashOffer = getProductFlashOffer(cartItem.product);
    if (!flashOffer) return false;
    
    const buyQuantity = parseInt(flashOffer.buy_quantity) || 0;
    const cartQuantity = parseInt(cartItem.quantity) || 1;
    
    // Only return true if cart quantity is EXACTLY equal to buy_quantity
    // For buy_quantity=2: quantity should be EXACTLY 2
    return cartQuantity === buyQuantity;
  };

  // Check if product has category discount
  const hasCategoryDiscount = (product: any) => {
    return getProductCategoryDiscount(product) > 0;
  };

  // Calculate free quantity from flash offer (Buy X Get Y)
  const calculateFreeQuantity = (cartItem: any, flashOffer: any) => {
    if (!flashOffer || !flashOffer.buy_quantity || !flashOffer.get_quantity) {
      return 0;
    }
    
    const buyQuantity = parseInt(flashOffer.buy_quantity) || 0;
    const getQuantity = parseInt(flashOffer.get_quantity) || 0;
    const cartQuantity = parseInt(cartItem.quantity) || 1;
    
    if (buyQuantity <= 0 || cartQuantity !== buyQuantity) {
      return 0;
    }
    
    // Since quantity must equal buy_quantity, we just return get_quantity
    return getQuantity;
  };

  const calculateItemBreakdown = (item: any) => {
    const mrp = parseFloat(item.product.mrp) || 0;
    const salePrice = parseFloat(item.product.price) || 0;
    const editedSalePrice = parseFloat(item.product.edited_sale_price) || salePrice;
    const gstRate = parseFloat(item.product.gst_rate) || 0;
    const isInclusiveGST = item.product.inclusive_gst === "Inclusive";
    const quantity = parseInt(item.quantity) || 1;
    const creditPercentage = parseFloat(item.creditPercentage) || 0;

    const flashOffer = getProductFlashOffer(item.product);
    // FIXED: Check if quantity is EXACTLY equal to buy_quantity
    const qualifiesForFlash = flashOffer && quantity === (parseInt(flashOffer.buy_quantity) || 0);
    const hasFlash = qualifiesForFlash; // Only true if quantity equals buy_quantity exactly
    const flashFreeQuantity = hasFlash ? calculateFreeQuantity(item, flashOffer) : 0;
    const totalQuantityForBackend = hasFlash ? (quantity + flashFreeQuantity) : quantity;
    
    const categoryDiscountPercentage = getProductCategoryDiscount(item.product);
    const hasCategory = categoryDiscountPercentage > 0 && !hasFlash;

    let applicableDiscountPercentage = 0;
    let discountType = 'none';
    let flash_offer_value = 0;

    if (hasFlash && flashOffer) {
      discountType = 'flash';

      flash_offer_value = `Buy ${flashOffer.buy_quantity || 0} Get ${flashOffer.get_quantity || 0}`;
      
    } else if (hasCategory) {
      // Only apply category discount if NO qualifying flash offer
      discountType = 'category';
      applicableDiscountPercentage = categoryDiscountPercentage;
    } else if (userDiscountPercentage > 0) {
      // Only apply retailer discount if NO flash or category
      discountType = 'retailer';
      applicableDiscountPercentage = userDiscountPercentage;
    }

    console.log(`Product ${item.product.id} (${item.product.name}):`);
    console.log(`- Flash offer: ${hasFlash ? `Buy ${flashOffer?.buy_quantity} Get ${flashOffer?.get_quantity}` : 'No'}`);
    console.log(`- Quantity: ${quantity}, Buy Quantity: ${flashOffer?.buy_quantity}`);
    console.log(`- Exactly equal? ${quantity === (parseInt(flashOffer?.buy_quantity) || 0)}`);
    console.log(`- Category discount = ${categoryDiscountPercentage}%`);
    console.log(`- Retailer discount = ${userDiscountPercentage}%`);
    console.log(`- Applied type = ${discountType}`);

    // Step 1: Calculate credit charge (percentage of edited_sale_price)
    const creditChargePerUnit = (editedSalePrice * creditPercentage) / 100;

    // Step 2: Calculate price after credit charge
    const priceAfterCredit = editedSalePrice + creditChargePerUnit;

    // Step 3: Apply discount (for non-flash offers)
    const discountAmountPerUnit = applicableDiscountPercentage > 0 ? (priceAfterCredit * applicableDiscountPercentage) / 100 : 0;
    const priceAfterDiscount = priceAfterCredit - discountAmountPerUnit;

    // Final price per unit (for flash offers, backend will handle pricing)
    const finalPricePerUnit = priceAfterDiscount;

    // Step 4: Calculate tax (GST handling based on inclusive/exclusive)
    let taxableAmountPerUnit = 0;
    let taxAmountPerUnit = 0;

    if (isInclusiveGST) {
      taxableAmountPerUnit = finalPricePerUnit / (1 + (gstRate / 100));
      taxAmountPerUnit = finalPricePerUnit - taxableAmountPerUnit;
    } else {
      taxableAmountPerUnit = finalPricePerUnit;
      taxAmountPerUnit = (taxableAmountPerUnit * gstRate) / 100;
    }

    // Calculate CGST/SGST (split equally)
    const sgstPercentage = gstRate / 2;
    const cgstPercentage = gstRate / 2;
    const sgstAmountPerUnit = taxAmountPerUnit / 2;
    const cgstAmountPerUnit = taxAmountPerUnit / 2;

    // Calculate final amount per unit (including tax if exclusive)
    const finalAmountPerUnit = isInclusiveGST ? finalPricePerUnit : finalPricePerUnit + taxAmountPerUnit;

    const customerSalePricePerUnit = finalPricePerUnit;

    // Calculate totals (use quantity for calculations, backend will handle flash pricing)
    const totalMRP = mrp * quantity;
    const totalSalePrice = salePrice * quantity;
    const totalEditedSalePrice = editedSalePrice * quantity;
    const totalCreditCharge = creditChargePerUnit * quantity;
    const totalDiscountAmount = discountAmountPerUnit * quantity;
    const totalItemTotal = finalPricePerUnit * quantity;
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
      flash_offer: flash_offer_value,
      flash_free_quantity: flashFreeQuantity,
      total_quantity_for_backend: totalQuantityForBackend,
      category_discount_percentage: categoryDiscountPercentage,
      retailer_discount_percentage: userDiscountPercentage,
      applicable_discount_percentage: applicableDiscountPercentage,
      discount_amount: discountAmountPerUnit,
      customer_sale_price: customerSalePricePerUnit,
      item_total: finalPricePerUnit,
      taxable_amount: taxableAmountPerUnit,
      tax_percentage: gstRate,
      tax_amount: taxAmountPerUnit,
      sgst_percentage: sgstPercentage,
      sgst_amount: sgstAmountPerUnit,
      cgst_percentage: cgstPercentage,
      cgst_amount: cgstAmountPerUnit,
      final_amount: finalAmountPerUnit,
      total_amount: finalAmountPerUnit * quantity,
      
      // Quantity info
      isInclusiveGST,
      quantity,
      free_quantity: flashFreeQuantity,
      total_quantity: totalQuantityForBackend,
      
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
        totalCustomerSalePrice,
        finalPayableAmount,
        totalFreeQuantity: flashFreeQuantity
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
        total_quantity_for_backend: breakdown.total_quantity_for_backend,
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
            flash_offer: breakdown.flash_offer,
            flash_free_quantity: breakdown.flash_free_quantity,
            total_quantity_for_backend: breakdown.total_quantity_for_backend,
            category_discount_percentage: breakdown.category_discount_percentage,
            retailer_discount_percentage: breakdown.retailer_discount_percentage,
            applicable_discount_percentage: breakdown.applicable_discount_percentage,
            discount_amount: breakdown.discount_amount,
            customer_sale_price: breakdown.customer_sale_price,
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
          quantity: breakdown.quantity,
          free_quantity: breakdown.free_quantity,
          total_quantity: breakdown.total_quantity_for_backend
        }
      };
    });

    // Calculate order totals
    let totalFlashFreeItems = 0;
    let totalCategoryDiscounts = 0;
    let totalRetailerDiscounts = 0;
    let totalCustomerSalePrice = 0;
    
    const orderTotals = {
      subtotal: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalEditedSalePrice;
      }, 0),
      
      totalCreditCharges: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        return sum + breakdown.totals.totalCreditCharge;
      }, 0),
      
      totalFlashFreeItems: cart.reduce((sum, item) => {
        const breakdown = calculateItemBreakdown(item);
        totalFlashFreeItems += breakdown.totals.totalFreeQuantity;
        return sum + breakdown.totals.totalFreeQuantity;
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
      totalFlashFreeItemsValue: totalFlashFreeItems,
      totalCategoryDiscountsValue: totalCategoryDiscounts,
      totalRetailerDiscountsValue: totalRetailerDiscounts,
      totalCustomerSalePriceValue: totalCustomerSalePrice,
      itemCount: cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0)
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
      if (newQuantity < 1) newQuantity = 1;
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

  // FIXED: Show flash badge only for exact buy_quantity
  const getDiscountBadge = (cartItem: any) => {
    const product = cartItem.product;
    const quantity = cartItem.quantity || 1;
    const flashOffer = getProductFlashOffer(product);
    const categoryDiscount = getProductCategoryDiscount(product);
    
    // Check if quantity is EXACTLY equal to buy_quantity
    const qualifiesForFlash = flashOffer && quantity === (parseInt(flashOffer.buy_quantity) || 0);
    
    // PRIORITY 1: Flash offer (only if exact buy_quantity)
    if (flashOffer && qualifiesForFlash) {
      return (
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full">
          <Zap className="h-3 w-3" />
          FLASH: Buy {flashOffer.buy_quantity} Get {flashOffer.get_quantity} FREE
        </span>
      );
    }
    // Show message if flash offer exists but doesn't qualify
    else if (flashOffer && !qualifiesForFlash) {
      const buyQuantity = parseInt(flashOffer.buy_quantity);
      const neededQuantity = buyQuantity - quantity;
      
      return (
        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs px-2 py-1 rounded-full">
          <Zap className="h-3 w-3" />
          ADD {neededQuantity} MORE FOR FLASH OFFER
        </span>
      );
    }
    // PRIORITY 2: Category discount (only if no qualifying flash offer)
    else if (categoryDiscount > 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          <TagIcon className="h-3 w-3" />
          {categoryDiscount}% Category Discount
        </span>
      );
    }
    // PRIORITY 3: Retailer discount (only if no flash or category)
    else if (userDiscountPercentage > 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
          <User className="h-3 w-3" />
          {userDiscountPercentage}% Retailer Discount
        </span>
      );
    }
    
    return null;
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

  if (loading || loadingCategories || loadingFlashSales) {
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

  const itemsWithFlashOffer = cart.filter(item => 
    hasFlashOffer(item)  
  ).length;
  
  const itemsWithCategoryDiscount = cart.filter(item => 
    hasCategoryDiscount(item.product) && !hasFlashOffer(item)
  ).length;
  
  const itemsWithRetailerDiscount = cart.filter(item => 
    !hasFlashOffer(item) && !hasCategoryDiscount(item.product) && userDiscountPercentage > 0
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

        {/* FLASH OFFER BANNER */}
        {orderTotals.totalFlashFreeItemsValue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 animate-pulse" />
              <div>
                <p className="font-semibold text-lg">⚡ FLASH SALE ACTIVE! ⚡</p>
                <p className="text-sm opacity-90">
                  {itemsWithFlashOffer} item(s) with flash offers
                  <br />
                  <span className="font-bold">Free Items: {orderTotals.totalFlashFreeItemsValue}</span>
                  <br />
                  <span className="text-xs opacity-75">(Highest Priority - Buy X Get Y Free)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CATEGORY DISCOUNT BANNER */}
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
                  <span className="ml-2 text-xs opacity-75">(Priority 2 - After flash offers)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* RETAILER DISCOUNT BANNER */}
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
                  Applied to {itemsWithRetailerDiscount} item(s)
                  <br />
                  <span className="font-bold">Saved: ₹{orderTotals.totalRetailerDiscountsValue.toLocaleString()}</span>
                  <span className="ml-2 text-xs opacity-75">(Priority 3 - After flash & category)</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CART ITEMS */}
        {cart.map((item, index) => {
          const breakdown = calculateItemBreakdown(item);
          const finalPayableAmount = breakdown.totals.finalPayableAmount;
          const hasFlash = breakdown.discount_type === 'flash';
          const flashOffer = getProductFlashOffer(item.product);
          
          // Check if quantity is exactly equal to buy_quantity for display
          const isExactBuyQuantity = flashOffer && item.quantity === parseInt(flashOffer.buy_quantity);

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
                        {getDiscountBadge(item)}
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
                    
                    {/* Flash Offer Info - Only show if exactly buy_quantity */}
                    {flashOffer && isExactBuyQuantity && (
                      <div className="mt-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-600 animate-pulse" />
                          <span className="text-sm font-bold text-yellow-700">
                            ⚡ FLASH OFFER: Buy {flashOffer.buy_quantity} Get {flashOffer.get_quantity} FREE
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">Selected Quantity:</span>
                            <span className="font-bold">{breakdown.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">You Get FREE:</span>
                            <span className="font-bold text-green-600 flex items-center gap-1">
                              <Gift className="h-3 w-3" /> +{breakdown.free_quantity} units
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Total for backend:</span>
                            <span className="font-bold text-blue-600">
                              {breakdown.total_quantity} units
                            </span>
                          </div>
                          <div className="text-xs text-yellow-500 mt-1">
                            * Backend will calculate final price for {breakdown.total_quantity} units
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Non-Flash Discount Information */}
                    {!hasFlash && breakdown.applicable_discount_percentage > 0 && (
                      <div className="mt-1">
                        <div className="text-sm text-muted-foreground">
                          <span className={breakdown.discount_type === 'category' ? 'text-blue-600 font-medium' : 'text-purple-600 font-medium'}>
                            {breakdown.discount_type === 'category' ? 'Category' : 'Retailer'} Discount: {breakdown.applicable_discount_percentage}%
                          </span>
                          <span className="ml-2 text-green-600">
                            -₹{breakdown.discount_amount.toLocaleString()} per unit
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Final Amount */}
                  <div className="text-sm mb-4">
                    <div className="flex justify-between pt-1">
                      <span className="font-semibold">Base Amount:</span>
                      <span className="font-bold text-primary">
                        ₹{finalPayableAmount.toLocaleString()} 
                        {hasFlash && breakdown.free_quantity > 0 && (
                          <span className="ml-1 text-xs text-green-600">
                            (for {breakdown.quantity} units)
                          </span>
                        )}
                      </span>
                    </div>
                    {hasFlash && (
                      <div className="text-xs text-yellow-600 mt-1">
                        * Final amount will be calculated by backend for {breakdown.total_quantity} total units
                      </div>
                    )}
                  </div>

                  {/* Quantity and Credit Controls */}
                  <div className="space-y-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2">
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
                        
                        {/* Flash offer quantity hint */}
                        {flashOffer && (
                          <div className="text-xs text-yellow-600">
                            {isExactBuyQuantity ? (
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                You qualify for flash offer! Get {flashOffer.get_quantity} free item(s)
                              </span>
                            ) : (
                              <span>
                                Add {parseInt(flashOffer.buy_quantity) - item.quantity} more to activate flash offer
                              </span>
                            )}
                          </div>
                        )}
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
              <span className="text-muted-foreground">Items in Cart</span>
              <span>{orderTotals.itemCount} items</span>
            </div>

            {orderTotals.totalFlashFreeItemsValue > 0 && (
              <>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Flash Free Items</span>
                  </div>
                  <span className="font-bold text-green-600">+{orderTotals.totalFlashFreeItemsValue} FREE</span>
                </div>
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  * Backend will calculate final price including free items
                </div>
              </>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
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
                <span>Base Total</span>
                <span className="text-primary">₹{orderTotals.finalTotal.toLocaleString()}</span>
              </div>
              {orderTotals.totalFlashFreeItemsValue > 0 && (
                <div className="text-xs text-yellow-600 mt-2">
                  * Final total will be adjusted by backend for flash offers
                </div>
              )}
            </div>

            {(orderTotals.totalCategoryDiscountsValue > 0 || orderTotals.totalRetailerDiscountsValue > 0) && (
              <div className="text-center pt-2">
                <p className="text-sm text-green-600">
                  🎉 Discount Savings: ₹{orderTotals.totalDiscount.toLocaleString()}
                  {orderTotals.totalCategoryDiscountsValue > 0 && (
                    <span>
                      {' '}(Category: ₹{orderTotals.totalCategoryDiscountsValue.toLocaleString()})
                    </span>
                  )}
                  {orderTotals.totalRetailerDiscountsValue > 0 && (
                    <span>
                      {' '}(Retailer: ₹{orderTotals.totalRetailerDiscountsValue.toLocaleString()})
                    </span>
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
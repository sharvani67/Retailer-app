import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CheckCircle, Truck, Home as HomeIcon, Phone, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';
import flourImage from '@/assets/flour-product.jpg';


interface OrderItem {
  id: string;
  item_name: string;
  product_id: string;
  price: number;
  quantity: number;
  total_amount: number;
  final_amount: number;
  credit_period: number;
  credit_percentage: number;
  mrp?: number;
  sale_price?: number;
  discount_percentage?: number;
  discount_amount?: number;
  taxable_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  item_total?: number;
  sgst_percentage?: number;
  sgst_amount?: number;
  cgst_percentage?: number;
  cgst_amount?: number;
  discount_applied_scheme?: string;
}

interface ApiOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_total: number | string;
  discount_amount: number | string;
  taxable_amount: number | string;
  tax_amount: number | string;
  net_payable: number | string;
  credit_period: number;
  status: string;
  estimated_delivery_date: string;
  created_at: string;
  order_placed_by: string;
  ordered_by?: string;
  staff_id?: string;
  assigned_staff?: string;
  order_mode?: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  invoice_status?: number;
  order_status?: string;
  updated_at?: string;
  items?: OrderItem[];
}

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  // Get order number from navigation state
  const orderNumber = location.state?.orderNumber;
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productMap, setProductMap] = useState<Map<string, any>>(new Map());



  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${baseurl}/get-sales-products`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const products = await res.json();

      const map = new Map<string, any>();
      products.forEach((p: any) => {
        map.set(p.id.toString(), p);
      });

      setProductMap(map);
    } catch (err) {
      console.error("Error fetching products for images:", err);
    }
  };

  fetchProducts();
}, []);


const getProductImage = (item: OrderItem) => {
  const product = productMap.get(item.product_id?.toString());

  if (!product) return flourImage;

  let images: string[] = [];

  try {
    images = product.images
      ? Array.isArray(product.images)
        ? product.images
        : JSON.parse(product.images)
      : [];
  } catch {
    images = [];
  }

  if (images.length === 0) return flourImage;

  const firstImage = images[0];

  return firstImage.startsWith("http")
    ? firstImage
    : `${baseurl}${firstImage}`;
};



  // Fetch order details from API
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber) {
        setError('Order number not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${baseurl}/orders/details/${orderNumber}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order details: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.order) {
          throw new Error('Order not found');
        }
        
        // Transform API response to match our interface
        const transformedOrder: ApiOrder = {
          ...data.order,
          // Ensure status field exists (use order_status from API if status doesn't exist)
          status: data.order.status || data.order.order_status || 'pending',
          // Parse string numbers to numbers for calculations
          order_total: parseFloat(data.order.order_total) || 0,
          discount_amount: parseFloat(data.order.discount_amount) || 0,
          taxable_amount: parseFloat(data.order.taxable_amount) || 0,
          tax_amount: parseFloat(data.order.tax_amount) || 0,
          net_payable: parseFloat(data.order.net_payable) || 0,
          credit_period: parseInt(data.order.credit_period) || 0,
          items: data.items?.map((item: any) => ({
            ...item,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0,
            final_amount: parseFloat(item.final_amount) || 0,
            mrp: parseFloat(item.mrp) || 0,
            sale_price: parseFloat(item.sale_price) || 0,
            discount_amount: parseFloat(item.discount_amount) || 0,
            discount_percentage: parseFloat(item.discount_percentage) || 0,
            taxable_amount: parseFloat(item.taxable_amount) || 0,
            tax_amount: parseFloat(item.tax_amount) || 0,
            item_total: parseFloat(item.item_total) || 0,
            sgst_amount: parseFloat(item.sgst_amount) || 0,
            cgst_amount: parseFloat(item.cgst_amount) || 0,
            credit_period: parseInt(item.credit_period) || 0,
            credit_percentage: parseFloat(item.credit_percentage) || 0,
          })) || []
        };
        
        setOrder(transformedOrder);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber]);

  // Update status mapping based on API order_status
  const getStatusKey = (status: string = ''): string => {
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Packed': 'packed',
      'Shipped': 'shipped',
      'Out for Delivery': 'out_for_delivery',
      'Delivered': 'delivered'
    };
    
    return statusMap[status] || status.toLowerCase() || 'pending';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date not available';
    }
  };

  // Calculate numeric values safely
  const getNumericValue = (value: string | number | undefined): number => {
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'number') return value;
    return 0;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-6">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <span className="font-semibold">Track Order</span>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="bg-muted rounded-full p-8 mb-6"
          >
            <Package className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Loading Order Details</h2>
          <p className="text-muted-foreground">Please wait while we fetch your order information</p>
        </div>
        <TabBar />
      </div>
    );
  }

  // Error state or no order
  if (error || !order) {
    return (
      <div className="min-h-screen bg-background pb-6">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <span className="font-semibold">Track Order</span>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-50 rounded-full p-12 mb-6 border border-red-200"
          >
            <Package className="h-20 w-20 text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || 'Unable to load order details'}</p>
          <Button onClick={() => navigate('/orders')} variant="outline">
            Back to Orders
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  // Now we can safely access order properties since we've returned early if order is null
  const currentStatusKey = getStatusKey(order?.status);
  
  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: CheckCircle, completed: true },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, completed: ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(currentStatusKey) },
    { key: 'packed', label: 'Packed', icon: Package, completed: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(currentStatusKey) },
    { key: 'shipped', label: 'Shipped', icon: Truck, completed: ['shipped', 'out_for_delivery', 'delivered'].includes(currentStatusKey) },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, completed: ['out_for_delivery', 'delivered'].includes(currentStatusKey) },
    { key: 'delivered', label: 'Delivered', icon: HomeIcon, completed: currentStatusKey === 'delivered' },
  ];

  const currentStatusIndex = statuses.findIndex((s) => s.key === currentStatusKey);

  // Get estimated delivery date
  const getEstimatedDelivery = () => {
    if (order?.estimated_delivery_date) {
      return formatDate(order.estimated_delivery_date);
    }
    
    // Fallback: add 5 days to order date
    if (order?.created_at) {
      const orderDate = new Date(order.created_at);
      const estimatedDate = new Date(orderDate.setDate(orderDate.getDate() + 5));
      return formatDate(estimatedDate.toISOString());
    }
    
    return 'Not estimated yet';
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
          <span className="font-semibold">Track Order</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 pb-28">
        {/* 🧾 Order Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono font-bold text-primary">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">
                ₹{getNumericValue(order.net_payable).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Order Status Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            {order.status || order.order_status || 'Pending'}
          </div>

          {/* Order Date */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CalendarClock className="h-4 w-4" />
              <span>Order Date & Time</span>
            </div>
            <p className="font-semibold text-lg">
              {formatDate(order.created_at)}
            </p>
          </div>

          {/* Delivery Info */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
            <p className="font-semibold text-lg">
              {getEstimatedDelivery()}
            </p>
          </div>

          {/* Order Mode and Staff Info */}
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
            {order.order_mode && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Mode</p>
                <p className="font-semibold">{order.order_mode}</p>
              </div>
            )}
            
            
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ordered By</p>
                <p className="font-semibold">{order.ordered_by}</p>
              </div>
           
          </div>

          {/* Invoice Info */}
          {order.invoice_number && (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">Invoice Number</p>
              <p className="font-mono font-semibold">{order.invoice_number}</p>
              {order.invoice_date && (
                <p className="text-sm text-muted-foreground mt-1">
                  Invoice Date: {formatDate(order.invoice_date)}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* 🚚 Tracking Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          <h2 className="text-lg font-semibold mb-6">Order Status</h2>

          <div className="space-y-6">
            {statuses.map((status, index) => {
              const Icon = status.icon;
              const isActive = index === currentStatusIndex;
              const isCompleted = status.completed;
              const isLast = index === statuses.length - 1;

              return (
                <div key={status.key} className="relative">
                  <div className="flex items-start gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative z-10"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted text-muted-foreground'
                        } ${isActive ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.1 }}
                      className="flex-1 pt-2"
                    >
                      <p className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {status.label}
                      </p>
                      {isActive && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Your order is currently {status.label.toLowerCase()}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {!isLast && (
                    <div
                      className={`absolute left-6 top-12 w-0.5 h-6 -translate-x-1/2 transition-all ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 🛍 Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          <h2 className="text-lg font-semibold mb-4">Order Items ({order.items?.length || 0})</h2>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => {
                const itemPrice = getNumericValue(item.final_amount);
                const itemMRP = getNumericValue(item.mrp);
                const itemTotal = getNumericValue(item.total_amount) || getNumericValue(item.item_total);
                const discountAmount = getNumericValue(item.discount_amount);
                const taxAmount = getNumericValue(item.tax_amount);
                
                return (
                  <div
                    key={item.id || index}
                    className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    {/* Product Image Placeholder */}
                    <img
                      src={getProductImage(item)}
                      alt={item.item_name || 'Product'}
                      className="w-16 h-16 object-cover rounded-lg bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = flourImage;
                      }}
                    />
                    
                    <div className="flex-1">
                      <p className="font-semibold line-clamp-2">{item.item_name || 'Product'}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{itemPrice.toLocaleString('en-IN')}/unit</span>
                      </div>
                      
                      {/* Price Breakdown */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm">
                          {itemMRP > itemPrice && (
                            <span className="text-muted-foreground line-through mr-2">
                              ₹{itemMRP.toLocaleString('en-IN')}
                            </span>
                          )}
                          <span className="font-semibold text-green-600">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        {/* Credit Info */}
                        {item.credit_period > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            {item.credit_period}d credit
                          </span>
                        )}
                      </div>

                      {/* Discount Info */}
                      {/* {discountAmount > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          {item.discount_percentage}% discount (₹{discountAmount.toLocaleString('en-IN')})
                        </div>
                      )}

                     
                      {taxAmount > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Tax: ₹{taxAmount.toLocaleString('en-IN')}
                          {item.sgst_amount && item.cgst_amount && (
                            <span className="text-muted-foreground ml-2">
                              (SGST: ₹{getNumericValue(item.sgst_amount).toLocaleString('en-IN')}, 
                              CGST: ₹{getNumericValue(item.cgst_amount).toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      )}

                    
                      {item.discount_applied_scheme && (
                        <div className="text-xs text-purple-600 mt-1">
                          Scheme: {item.discount_applied_scheme}
                        </div>
                      )} */}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No items found in this order</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {order.items && order.items.length > 0 && (
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              {/* <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{getNumericValue(order.order_total).toLocaleString('en-IN')}</span>
              </div>

               {getNumericValue(order.credit_period) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Credit Charges</span>
                  <span>+₹{getNumericValue(order.credit_period).toLocaleString('en-IN')}</span>
                </div>
              )}
              
              {getNumericValue(order.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{getNumericValue(order.discount_amount).toLocaleString('en-IN')}</span>
                </div>
              )} */}
              
              {getNumericValue(order.taxable_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span>₹{getNumericValue(order.taxable_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              
              {getNumericValue(order.tax_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>+₹{getNumericValue(order.tax_amount).toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total Payable</span>
                <span className="text-primary">₹{getNumericValue(order.net_payable).toLocaleString('en-IN')}</span>
              </div>
              
              {/* {order.credit_period > 0 && (
                <div className="flex justify-between text-sm text-orange-600 pt-2">
                  <span>Credit Period</span>
                  <span>{order.credit_period} days</span>
                </div>
              )} */}
            </div>
          )}
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default OrderTracking;
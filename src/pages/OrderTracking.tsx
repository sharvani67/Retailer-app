import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CheckCircle, Truck, Home as HomeIcon, Phone, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';
import flourImage from '@/assets/flour-product.jpg';
const getProductImage = (item: OrderItem) => {
  return flourImage;
};

interface OrderItem {
  id: string;
  item_name: string;
  product_id: string;
  price: number;
  quantity: number;
  total_amount: number;
  credit_period: number;
  credit_percentage: number;
  mrp?: number;
  sale_price?: number;
  discount_percentage?: number;
  discount_amount?: number;
}

interface ApiOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_total: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  net_payable: number;
  credit_period: number;
  status: string;
  estimated_delivery_date: string;
  created_at: string;
  order_placed_by: string;
  items?: OrderItem[];
}

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  // ✅ Get values from navigation
  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;
  const orderData = location.state?.orderData;
  
  const [order, setOrder] = useState<ApiOrder | null>(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details from API if not passed via state
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderData) {
        setOrder(orderData);
        return;
      }

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
        setOrder({
          ...data.order,
          items: data.items || []
        });
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber, orderData]);

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

  // Status configuration
  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: CheckCircle, completed: true },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, completed: ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'packed', label: 'Packed', icon: Package, completed: ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'shipped', label: 'Shipped', icon: Truck, completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, completed: ['out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'delivered', label: 'Delivered', icon: HomeIcon, completed: order.status === 'delivered' },
  ];

  const currentStatusIndex = statuses.findIndex((s) => s.key === order.status);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get estimated delivery date
  const getEstimatedDelivery = () => {
    if (order.estimated_delivery_date) {
      return formatDate(order.estimated_delivery_date);
    }
    
    // Fallback: add 5 days to order date
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate.setDate(orderDate.getDate() + 5));
    return formatDate(estimatedDate.toISOString());
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
              <p className="text-xl font-bold">₹{order.net_payable?.toLocaleString() || order.order_total?.toLocaleString() || '0'}</p>
            </div>
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
              order.items.map((item, index) => (
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
                      <span>₹{item.price?.toLocaleString()}/unit</span>
                    </div>
                    
                    {/* Price Breakdown */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm">
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-muted-foreground line-through mr-2">
                            ₹{item.mrp.toLocaleString()}
                          </span>
                        )}
                        <span className="font-semibold text-green-600">
                          ₹{item.total_amount?.toLocaleString()}
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
                    {item.discount_percentage && item.discount_percentage > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        {item.discount_percentage}% discount applied
                      </div>
                    )}
                  </div>
                </div>
              ))
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.order_total?.toLocaleString()}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount_amount?.toLocaleString()}</span>
                </div>
              )}
              
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>+₹{order.tax_amount?.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">₹{order.net_payable?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* 🧭 Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Continue Shopping
          </Button>
          <Button variant="secondary" size="lg" className="flex-1">
            <Phone className="h-5 w-5 mr-2" />
            Contact Support
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default OrderTracking;
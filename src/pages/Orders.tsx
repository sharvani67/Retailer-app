import { motion } from 'framer-motion';
import { Package, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';

interface OrderItem {
  id: string;
  item_name: string;
  product_id: string;
  price: number;
  quantity: number;
  total_amount: number;
  credit_period: number;
  credit_percentage: number;
  image?: string;
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

const Orders = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseurl}/orders/customer-orders/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const ordersData = await response.json();
      
      // Fetch detailed items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order: ApiOrder) => {
          try {
            const detailsResponse = await fetch(`${baseurl}/orders/details/${order.order_number}`);
            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              return {
                ...order,
                items: details.items || []
              };
            }
            return order;
          } catch (error) {
            console.error(`Error fetching details for order ${order.order_number}:`, error);
            return order;
          }
        })
      );
      
      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Pending';
    
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDownloadInvoice = (order: ApiOrder) => {
    // Generate invoice URL based on your backend
    const invoiceUrl = `${baseurl}/invoices/${order.order_number}`;
    const link = document.createElement('a');
    link.href = invoiceUrl;
    link.download = `Invoice_${order.order_number}.pdf`;
    link.target = '_blank'; // Open in new tab for PDF
    link.click();
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleViewDetails = (order: ApiOrder) => {
    navigate('/order-tracking', { 
      state: { 
        orderId: order.id,
        orderNumber: order.order_number,
        orderData: order
      } 
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get estimated delivery date
  const getEstimatedDelivery = (order: ApiOrder) => {
    if (order.estimated_delivery_date) {
      return formatDate(order.estimated_delivery_date);
    }
    
    // Fallback: add 5 days to order date
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate.setDate(orderDate.getDate() + 5));
    return formatDate(estimatedDate.toISOString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Loading your orders...</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="bg-muted rounded-full p-8 mb-6"
          >
            <RefreshCw className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Loading Orders</h2>
          <p className="text-muted-foreground">Please wait while we fetch your order history</p>
        </div>
        <TabBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your order history</p>
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
          <h2 className="text-2xl font-bold mb-2">Failed to Load Orders</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your order history</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-muted rounded-full p-12 mb-6"
          >
            <Package className="h-20 w-20 text-muted-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-8">Start shopping to see your orders here!</p>
          <Button onClick={() => navigate('/home')}>
            Start Shopping
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-sm text-muted-foreground">
                {orders.length} order{orders.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Order List */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-lg border border-border hover:shadow-xl transition-shadow"
          >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-primary">{order.order_number}</p>
              </div>
              <Badge className={`${getStatusColor(order.status)} border`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            {/* Product Preview */}
            {/* <div
              className="flex items-center gap-3 mb-4 pb-4 border-b border-border cursor-pointer"
              onClick={() => handleViewDetails(order)}
            >
              {order.items && order.items.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground"
                >
                  {item.item_name?.substring(0, 2).toUpperCase() || 'PD'}
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  +{order.items.length - 3}
                </div>
              )}
              {(!order.items || order.items.length === 0) && (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  No Items
                </div>
              )}
            </div> */}

            {/* Order Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">₹{order.net_payable?.toLocaleString() || order.order_total?.toLocaleString() || '0'}</p>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                onClick={() => handleViewDetails(order)}
              >
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Download Invoice Button */}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadInvoice(order)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>
                Ordered on {formatDate(order.created_at)}
              </span>
              <span>
                Est. Delivery: {getEstimatedDelivery(order)}
              </span>
            </div>
          </motion.div>
        ))}
      </main>

      <TabBar />
    </div>
  );
};

export default Orders;
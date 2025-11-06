import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const { orders } = useApp();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-success text-success-foreground';
      case 'out_for_delivery':
        return 'bg-warning text-warning-foreground';
      case 'shipped':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

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
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} order{orders.length > 1 ? 's' : ''}</p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate('/order-tracking', { state: { orderId: order.id } })}
            className="bg-card rounded-2xl p-5 shadow-lg border border-border cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-primary">{order.id}</p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              {order.items.slice(0, 3).map((item, idx) => (
                <img
                  key={idx}
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded-lg bg-muted"
                />
              ))}
              {order.items.length > 3 && (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  +{order.items.length - 3}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">₹{order.total.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>
                Ordered on {new Date(order.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span>
                Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
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

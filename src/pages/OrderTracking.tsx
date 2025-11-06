import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CheckCircle, Truck, Home as HomeIcon, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

const OrderTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useApp();
  
  const orderId = location.state?.orderId;
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return <div>Order not found</div>;
  }

  const statuses = [
    { key: 'ordered', label: 'Order Placed', icon: CheckCircle, completed: true },
    { key: 'packed', label: 'Packed', icon: Package, completed: order.status !== 'ordered' },
    { key: 'shipped', label: 'Shipped', icon: Truck, completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, completed: ['out_for_delivery', 'delivered'].includes(order.status) },
    { key: 'delivered', label: 'Delivered', icon: HomeIcon, completed: order.status === 'delivered' },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.key === order.status);

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

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-bold text-primary">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">₹{order.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
            <p className="font-semibold text-lg">
              {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </motion.div>

        {/* Tracking Timeline */}
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

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border"
        >
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg bg-muted"
                />
                <div className="flex-1">
                  <p className="font-semibold line-clamp-1">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Button
            onClick={() => navigate('/checkout', { 
              state: { directBuy: order.items } 
            })}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Reorder
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            <Phone className="h-5 w-5 mr-2" />
            Contact Supplier
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default OrderTracking;

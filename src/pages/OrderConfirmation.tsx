import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total } = location.state || {};

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#6366f1', '#8b5cf6', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="bg-success/10 rounded-full p-8">
            <CheckCircle className="h-24 w-24 text-success" strokeWidth={1.5} />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-2"
          >
            <Package className="h-6 w-6" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Order Placed Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your order. We'll process it right away!
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-bold text-primary">{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold">₹{total?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Estimated Delivery</span>
            <span className="font-semibold">5-7 days</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 pt-4"
        >
          <Button
            onClick={() => navigate('/orders')}
            size="lg"
            className="w-full"
          >
            View Orders
          </Button>
          <Button
            onClick={() => navigate('/home')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Continue Shopping
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;

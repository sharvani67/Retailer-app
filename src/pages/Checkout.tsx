import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import TabBar from '@/components/TabBar';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, placeOrder,user } = useApp();
  const directBuyItems = location.state?.directBuy;
  const items = directBuyItems || cart;

  // Address
const [address, setAddress] = useState({
  name: user?.name || "",
  businessName: user?.business_name || "",
  phone: user?.mobile_number || "",
  addressLine: 
    `${user?.shipping_address_line1 || ""}, ` +
    `${user?.shipping_address_line2 || ""}, ` +
    `${user?.shipping_city || ""}, ` +
    `${user?.shipping_state || ""} - ` +
    `${user?.shipping_pin_code || ""}, ` +
    `${user?.shipping_country || ""}`,
  city: user?.shipping_city || "",
  pincode: user?.shipping_pin_code || "",
});


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.id]: e.target.value });
  };

  // 🧾 Base calculations
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const baseTotal = total ;

  const finalTotal = baseTotal;

  const handlePlaceOrder = () => {
    const orderId = placeOrder(items, address);
    navigate('/order-confirmation', {
      state: { orderId, total: finalTotal },
    });
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
          <span className="font-semibold">Checkout</span>
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

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-lg border border-border space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-semibold">
                  ₹{(item.product.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          
            
            <div className="flex justify-between text-xl font-bold pt-2">
              <span>Total</span>
              <span className="text-primary">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Place Order Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handlePlaceOrder}
            size="lg"
            className="w-full"
            disabled={
              !address.name ||
              !address.phone ||
              !address.addressLine ||
              !address.city ||
              !address.pincode
            }
          >
            Place Order - ₹{finalTotal.toLocaleString()}
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Checkout;

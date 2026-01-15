import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, Package, Home as HomeIcon, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

const OrderUpdatedConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    orderId,
    orderNumber,
    total,
    orderTotals,
    orderMode,
    isUpdate = true,
    previousTotal,
    changeAmount,
    staffName,
    staffIncentive
  } = location.state || {};

  useEffect(() => {
    // Trigger confetti animation for updates too!
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ['#3b82f6', '#10b981', '#8b5cf6']; // Blue, Green, Purple

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
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

  // Determine if total increased or decreased
  const hasPriceChange = changeAmount !== undefined && changeAmount !== 0;
  const isPriceIncrease = changeAmount > 0;
  const isPriceDecrease = changeAmount < 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="bg-blue-100 rounded-full p-8">
            <RefreshCw className="h-24 w-24 text-blue-600" strokeWidth={1.5} />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2"
          >
            <CheckCircle className="h-6 w-6" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-6 max-w-md w-full"
      >
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-blue-800">Order Updated Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            Your order has been modified and confirmed.
          </p>
        </div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 space-y-6"
        >
          {/* Order Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold">Order #{orderNumber || orderId}</p>
              <p className="text-sm text-muted-foreground">
                Updated on {new Date().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Updated Total */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Updated Total</span>
              <span className="text-2xl font-bold text-blue-700">
                ₹{total?.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Price Change Comparison */}
            {isUpdate && previousTotal !== undefined && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.8 }}
                className={`p-4 rounded-lg border ${
                  isPriceIncrease
                    ? 'bg-red-50 border-red-200'
                    : isPriceDecrease
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Previous Total:</span>
                  <span className="text-sm line-through">₹{previousTotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isPriceIncrease ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : isPriceDecrease ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : null}
                    <span className="text-sm font-medium">
                      {isPriceIncrease ? 'Increase' : isPriceDecrease ? 'Decrease' : 'No Change'}
                    </span>
                  </div>
                  <span className={`font-semibold ${
                    isPriceIncrease ? 'text-red-600' : 
                    isPriceDecrease ? 'text-green-600' : 
                    'text-gray-600'
                  }`}>
                    {changeAmount > 0 ? '+' : ''}₹{Math.abs(changeAmount)?.toLocaleString('en-IN')}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Order Mode */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted-foreground">Order Mode</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                orderMode === 'PAKKA' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {orderMode} {orderMode === 'PAKKA' ? '✓' : '⏳'}
              </span>
            </div>

            {/* Staff Information (if available) */}
            {staffName && staffName !== 'Unassigned' && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Assigned Staff</span>
                <div className="text-right">
                  <span className="font-semibold">{staffName}</span>
                  {staffIncentive > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Incentive: {staffIncentive}%
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <span className="font-semibold">5-7 business days</span>
            </div>

            {/* Summary of Changes */}
            {orderTotals && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-4 border-t border-gray-100"
              >
                <p className="text-sm text-muted-foreground mb-2">Summary:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {orderTotals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount Applied:</span>
                      <span className="font-semibold text-green-600">
                        -₹{orderTotals.totalDiscount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {orderTotals.totalCreditCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Credit Charges:</span>
                      <span className="font-semibold">
                        +₹{orderTotals.totalCreditCharges?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {orderTotals.totalTax > 0 && (
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span className="font-semibold">
                        +₹{orderTotals.totalTax?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3 pt-4"
        >
      
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => navigate('/orders')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              All Orders
            </Button>
            <Button
              onClick={() => navigate('/home')}
              size="lg"
              className="w-full"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Shop More
            </Button>
          </div>
          
          {/* Download/Print Option */}
          {/* <Button
            onClick={() => window.print()}
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Download Receipt
          </Button> */}
        </motion.div>

        {/* Success Message */}
       
      </motion.div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderUpdatedConfirmation;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
        className="mb-8"
      >
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <Package className="h-24 w-24 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-center space-y-3"
      >
        <h1 className="text-5xl font-bold text-white tracking-tight">BulkBuy</h1>
        <p className="text-xl text-white/90 font-medium">Order Smart, Save More</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-12"
      >
        <div className="flex gap-2">
          <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="h-1.5 w-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>
    </div>
  );
};

export default Splash;

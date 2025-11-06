import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, TrendingDown, Truck, BarChart3 } from 'lucide-react';

const slides = [
  {
    icon: TrendingDown,
    title: 'Order in Bulk & Save More',
    description: 'Get the best wholesale prices on quality products. The more you buy, the more you save!',
    gradient: 'from-blue-600 via-indigo-500 to-purple-500',
  },
  {
    icon: Truck,
    title: 'Fast Delivery from Trusted Suppliers',
    description: 'Partner with verified suppliers for reliable and timely deliveries across the country.',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Track Orders Seamlessly',
    description: 'Stay updated with real-time order tracking and manage your inventory efficiently.',
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-32 h-32 flex items-center justify-center"
            >
              <div className={`bg-gradient-to-br ${slide.gradient} rounded-3xl p-8 shadow-2xl animate-float`}>
                <Icon className="h-16 w-16 text-white" strokeWidth={1.5} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold">{slide.title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {slide.description}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 mt-12"
        >
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </motion.div>
      </div>

      <div className="p-6 pb-8">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full max-w-md mx-auto flex gap-2"
        >
          {currentSlide < slides.length - 1 ? 'Next' : 'Get Started'}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;

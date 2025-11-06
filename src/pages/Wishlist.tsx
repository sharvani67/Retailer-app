import { motion } from 'framer-motion';
import { ArrowLeft, Heart as HeartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import ProductCard from '@/components/ProductCard';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, moveToCart } = useApp();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-6 w-6" />
            </motion.button>
            <span className="font-semibold">My Wishlist</span>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-muted rounded-full p-12 mb-6"
          >
            <HeartIcon className="h-20 w-20 text-muted-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-8">Save your favorite products here!</p>
          <Button onClick={() => navigate('/home')} size="lg">
            Explore Products
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">My Wishlist ({wishlist.length})</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {wishlist.map((item, index) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={item.product} />
            </motion.div>
          ))}
        </div>
      </main>

      <TabBar />
    </div>
  );
};

export default Wishlist;

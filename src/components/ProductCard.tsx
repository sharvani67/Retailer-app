import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, addToWishlist, wishlist, priceMultiplier } = useApp();
  const navigate = useNavigate();
  const isWishlisted = wishlist.some(item => item.product.id === product.id);
  

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border"
    >
      <div 
        className="relative h-48 bg-muted cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            addToWishlist(product);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md ${
            isWishlisted 
              ? 'bg-destructive/90 text-destructive-foreground' 
              : 'bg-card/90 text-foreground'
          } shadow-lg`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </motion.button>
        {product.stock < 50 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-warning text-warning-foreground text-xs font-semibold rounded-full">
            Low Stock
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{product.supplier}</p>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
  ₹{(product.price * priceMultiplier).toFixed(2)}
</span>
          <span className="text-sm text-muted-foreground">/ {product.unit}</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1);
            }}
            className="flex-1"
            variant="default"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/checkout', { state: { directBuy: [{ product, quantity: 1 }] } });
            }}
            variant="secondary"
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-1" />
            Buy
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

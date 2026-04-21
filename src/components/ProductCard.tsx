import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  quantity?: number; 
}

const ProductCard = ({ product }: ProductCardProps) => {
  console.log("Product in card:", product);
  
  const { addToCart, wishlist, user } = useApp();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(0);

  const isWishlisted = wishlist.some(item => item.product.id === product.id);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (quantity === 0) {
      alert("Please select at least 1 quantity");
      return;
    }

    try {
      const images: string[] =
        product.images && product.images.length > 0
          ? product.images
          : [product.image];

      await addToCart(
        {
          ...product,
          image: images[0],
          images,
        },
        quantity
      );
      
      setQuantity(0);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border"
    >
      {/* Product Image */}
      <div
        className="relative h-48 bg-muted cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {product.stock < 50 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-warning text-warning-foreground text-xs font-semibold rounded-full">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{product.supplier}</p>
        </div>

        {/* Price */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            ₹{product.price.toFixed(2)}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">Stock: {product.quantity}</p>
        </div>

        {/* Quantity Selector */}
        <div className="w-full overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">

            <div className="flex items-center gap-0 bg-muted rounded-full p-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(quantity - 1);
                }}
                className="rounded-full h-5 w-5"
                disabled={quantity <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>

              <input
                type="text"
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setQuantity(0);
                  } else {
                    const newValue = parseInt(value);
                    if (!isNaN(newValue) && newValue >= 0) {
                      setQuantity(newValue);
                    }
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-8 text-center text-sm font-semibold bg-transparent focus:outline-none"
                placeholder="0"
              />

              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(quantity + 1);
                }}
                className="rounded-full h-5 w-5"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              className="min-w-[50px] whitespace-nowrap"
              variant="default"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add 
            </Button>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  console.log("Product in card:", product);
  
  const { addToCart, wishlist, user } = useApp();
  const navigate = useNavigate();

  const isWishlisted = wishlist.some(item => item.product.id === product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      navigate('/login');
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
          image: images[0], // ✅ correct main image
          images,
        },
        1
      );
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
          {/* <p className="text-xs text-muted-foreground mt-0.5">
      Type: {product.product_type || "N/A"}
    </p> */}
        </div>

        {/* Price */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            ₹{product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">{product.unit}</span>
        </div>

        {/* Add to Cart Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1"
            variant="default"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;

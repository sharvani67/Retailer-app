import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Minus, Plus, Store, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';
import { useApp } from '@/contexts/AppContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToWishlist, wishlist } = useApp();

  if (!product) {
    return <div>Product not found</div>;
  }

  const isWishlisted = wishlist.some(item => item.product.id === product.id);
  const similarProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </motion.button>
          <span className="font-semibold">Product Details</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addToWishlist(product)}
            className={`p-2 hover:bg-muted rounded-full ${
              isWishlisted ? 'text-destructive' : ''
            }`}
          >
            <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative h-80 bg-muted"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.stock < 50 && (
            <div className="absolute top-4 left-4 px-4 py-2 bg-warning text-warning-foreground text-sm font-semibold rounded-full">
              Only {product.stock} left in stock!
            </div>
          )}
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{product.supplier}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">per {product.unit}</div>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-2 text-sm">
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Unit: <span className="font-semibold text-foreground">{product.unit}</span></span>
            </div>
          </motion.div>

          {/* Quantity Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <label className="text-sm font-semibold">Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-full h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-full h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: <span className="text-lg font-bold text-foreground">₹{(product.price * quantity).toLocaleString()}</span>
              </div>
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
              onClick={() => {
                addToCart(product, quantity);
                navigate('/cart');
              }}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              onClick={() => navigate('/checkout', { state: { directBuy: [{ product, quantity }] } })}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              Buy Now
            </Button>
          </motion.div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold">Similar Products</h2>
              <div className="grid grid-cols-2 gap-4">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

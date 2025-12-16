import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Bell, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import TabBar from '@/components/TabBar';
import { banners, fetchCategories, fetchProducts } from '@/data/products';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Category, Product } from '@/types';
import { toast } from "sonner";
import RetailerScore from './RetailerScore'; // ADD THIS IMPORT

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const { cart, syncCartWithBackend, user } = useApp();
  const navigate = useNavigate();

  // Get retailer ID from user context or use default
  const retailerId = user?.id?.toString() || '43'; // Default to 43 for demo

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setProductsLoading(true);

        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);

        setCategoriesList(categoriesData);
        setProductsList(productsData);

        await syncCartWithBackend();
      } catch (error) {
        console.error('Failed to load data:', error);
        setCategoriesList([]);
        setProductsList([]);
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      syncCartWithBackend();
    }
  }, [user]);

  const filteredProducts = productsList.filter(product => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    if (!searchQuery.trim()) return matchesCategory;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      (product.supplier && product.supplier.toLowerCase().includes(query)) ||
      (product.description && product.description.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const clearSearch = () => setSearchQuery('');

  return (
    <>
      <div className="min-h-screen bg-background pb-20">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">RetailPro</h1>
                <p className="text-sm text-muted-foreground">Find the best deals</p>
              </div>

              <div className="flex gap-2">

                {/* Cart */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/cart')}
                  className="relative p-2 hover:bg-muted rounded-full"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </motion.button>

                {/* Bell Notification */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toast.info("No new notifications found")}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <Bell className="h-6 w-6" />
                </motion.button>

              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto">

          {/* Retailer Score Component - ADDED HERE */}
          <RetailerScore 
            retailerId={retailerId} 
            retailerName={user?.name || 'Retailer'}
          />

          {/* Category Slider */}
          <div className="px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                All
              </motion.button>

              {loading ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(item => (
                    <div
                      key={item}
                      className="px-4 py-2 rounded-full bg-muted text-foreground animate-pulse"
                    >
                      <span className="invisible">Loading...</span>
                    </div>
                  ))}
                </div>
              ) : (
                categoriesList.map(category => (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {category.icon} {category.name}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products, suppliers, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <motion.button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="bg-muted rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-300 h-32 rounded-lg mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded mb-1"></div>
                    <div className="bg-gray-300 h-3 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </main>

        <TabBar />
      </div>
    </>
  );
};

export default Home;
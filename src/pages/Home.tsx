import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, ShoppingCart, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import TabBar from '@/components/TabBar';
import { banners, fetchCategories, fetchProducts } from '@/data/products'; // Import the functions
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Category, Product } from '@/types';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const { cart, wishlist } = useApp();
  const navigate = useNavigate();

  // Load categories and products
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setProductsLoading(true);
        
        // Load categories and products in parallel
        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
        
        setCategoriesList(categoriesData);
        setProductsList(productsData);
        
        console.log('Loaded categories:', categoriesData);
        console.log('Loaded products:', productsData);
        
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

  const filteredProducts = productsList.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.supplier && product.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* <CreditPeriodPopup /> */}
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">BulkBuy</h1>
                <p className="text-sm text-muted-foreground">Find the best deals</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/wishlist')}
                  className="relative p-2 hover:bg-muted rounded-full"
                >
                  <Heart className="h-6 w-6" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </motion.button>
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
                <motion.button whileTap={{ scale: 0.9 }} className="p-2 hover:bg-muted rounded-full">
                  <Bell className="h-6 w-6" />
                </motion.button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto">
          {/* Banner Carousel */}
          <div className="p-4 space-y-3">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${banner.gradient} rounded-2xl p-6 text-white shadow-lg`}
              >
                <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                <p className="text-sm text-white/90">{banner.subtitle}</p>
              </motion.div>
            ))}
          </div>

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
              
              {/* Show loading state */}
              {loading ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="px-4 py-2 rounded-full bg-muted text-foreground animate-pulse"
                    >
                      <span className="invisible">Loading...</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Show actual categories when loaded
                categoriesList.map((category) => (
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

          {/* Products Grid */}
          <div className="p-4">
            {productsLoading ? (
              // Loading state for products
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
              // Actual products when loaded
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

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products found</p>
                {productsList.length > 0 && (
                  <p className="text-sm mt-2">
                    Try selecting a different category or clearing your search
                  </p>
                )}
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
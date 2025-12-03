import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, ShoppingCart, Bell, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import TabBar from '@/components/TabBar';
import { banners, fetchCategories, fetchProducts } from '@/data/products';
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
  const { cart, syncCartWithBackend, user } = useApp();
  const navigate = useNavigate();

  // Load categories, products, AND cart
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

  // Sync cart whenever user changes
  useEffect(() => {
    if (user) {
      syncCartWithBackend();
    }
  }, [user]);

  const filteredProducts = productsList.filter(product => {
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    // If no search query, only filter by category
    if (!searchQuery.trim()) return matchesCategory;
    
    // Filter by search query (name, supplier, OR description)
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      product.name.toLowerCase().includes(query) ||
      (product.supplier && product.supplier.toLowerCase().includes(query)) ||
      (product.description && product.description.toLowerCase().includes(query));
    
    return matchesCategory && matchesSearch;
  });

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
  };

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

          {/* Search Bar - MOVED BELOW CATEGORIES */}
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
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={clearSearch}
                  className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
            
            {/* Search Results Summary */}
            {/* {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </p>
                  {filteredProducts.length === 0 && productsList.length > 0 && (
                    <button
                      onClick={clearSearch}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </motion.div>
            )} */}
          </div>

          {/* Products Grid */}
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

            {!productsLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium mb-2">No products found</p>
                {searchQuery ? (
                  <p className="text-sm">
                    No results for "{searchQuery}" in {selectedCategory === 'all' ? 'all categories' : 'this category'}
                  </p>
                ) : (
                  <p className="text-sm">Try selecting a different category</p>
                )}
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                  >
                    View All Products
                  </button>
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 bg-muted text-foreground rounded-full text-sm font-medium"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
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
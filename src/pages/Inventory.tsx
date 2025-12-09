import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Search, Plus, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface Product {
  id?: number;
  sNo?: number;
  category_name: string;
  product_name: string;
  available_quantity: number;
  unit?: string;
  lowStock?: boolean;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['All', 'Home Accessories', 'Mobile', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:5000/api/inventory');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform API data to match our component structure
          const transformedProducts = data.data.map((product: Product, index: number) => ({
            id: index + 1,
            sNo: index + 1,
            category_name: product.category_name,
            product_name: product.product_name,
            available_quantity: product.available_quantity,
            unit: 'pcs', // Default unit
            lowStock: product.available_quantity <= 5, // Mark as low stock if quantity <= 5
          }));
          setProducts(transformedProducts);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
        // Optionally, you can keep some sample data for demo purposes
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter items based on category and search
  const filteredItems = products.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category_name === selectedCategory;
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const getStockColor = (stock: number, lowStock: boolean) => {
    if (stock === 0) return 'text-red-500';
    if (lowStock) return 'text-amber-500';
    return 'text-green-500';
  };

  const getStockStatusText = (stock: number, lowStock: boolean) => {
    if (stock === 0) return 'Out of Stock';
    if (lowStock) return 'Low Stock';
    return 'In Stock';
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 3;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pageNumbers.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 1) {
        pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Handle retry fetching
  const handleRetry = () => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedCategory('All');
    // You could refetch here if needed
  };

  // Add a Category Filter Bar
  const CategoryFilter = () => (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className={`text-xs rounded-full whitespace-nowrap ${
            selectedCategory === category ? 'gradient-primary' : ''
          }`}
          onClick={() => {
            setSelectedCategory(category);
            setCurrentPage(1);
          }}
        >
          {category}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Inventory</h1>
              <p className="text-sm text-muted-foreground">Manage your products</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-card border-border rounded-2xl"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <CategoryFilter />
            
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="col-span-1 text-xs font-semibold text-muted-foreground">S.No</div>
            <div className="col-span-4 text-xs font-semibold text-muted-foreground">Category</div>
            <div className="col-span-4 text-xs font-semibold text-muted-foreground">Product</div>
            <div className="col-span-3 text-xs font-semibold text-muted-foreground text-right">Stock</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <Warehouse className="h-12 w-12 mx-auto text-red-500/50 mb-2" />
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              </div>
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="grid grid-cols-12 gap-2 p-4 hover:bg-accent/10 transition-colors cursor-pointer"
                  onClick={() => {/* Handle product detail view */}}
                >
                  <div className="col-span-1 text-sm font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </div>
                  <div className="col-span-4">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {item.category_name}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-bold ${getStockColor(item.available_quantity, item.lowStock || false)}`}>
                      {item.available_quantity} {item.unit || 'pcs'}
                    </p>
                    <p className={`text-xs ${getStockColor(item.available_quantity, item.lowStock || false)}`}>
                      {getStockStatusText(item.available_quantity, item.lowStock || false)}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No products found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && !error && filteredItems.length > itemsPerPage && (
            <div className="p-4 border-t border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Page Info */}
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} products
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="icon"
                          className={`h-8 w-8 ${currentPage === page ? 'gradient-primary' : ''}`}
                          onClick={() => goToPage(page as number)}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>

                  {/* Next Page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Show:</span>
                  <select
                    className="bg-transparent border-none focus:outline-none"
                    value={itemsPerPage}
                    onChange={(e) => {
                      // If you want to make itemsPerPage dynamic
                      // setItemsPerPage(Number(e.target.value));
                      // setCurrentPage(1);
                    }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                  <span className="text-muted-foreground">per page</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer for when no pagination needed */}
          {!loading && !error && filteredItems.length <= itemsPerPage && filteredItems.length > 0 && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing all {filteredItems.length} products</span>
                <div className="text-muted-foreground">
                  Page 1 of 1
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Inventory;
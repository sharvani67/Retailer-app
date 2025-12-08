import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Search, Plus, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const Inventory = () => {
  const navigate = useNavigate();

  // Sample inventory data
  const inventoryItems = [
    {
      id: 1,
      sNo: 1,
      categoryName: 'Electronics',
      productName: 'iPhone 15 Pro',
      stockAvailable: 24,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 2,
      sNo: 2,
      categoryName: 'Electronics',
      productName: 'MacBook Air M2',
      stockAvailable: 12,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 3,
      sNo: 3,
      categoryName: 'Fashion',
      productName: 'Men\'s T-Shirt',
      stockAvailable: 5,
      unit: 'pcs',
      lowStock: true,
    },
    {
      id: 4,
      sNo: 4,
      categoryName: 'Home & Kitchen',
      productName: 'Coffee Maker',
      stockAvailable: 8,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 5,
      sNo: 5,
      categoryName: 'Books',
      productName: 'React Development Guide',
      stockAvailable: 0,
      unit: 'pcs',
      lowStock: true,
    },
    {
      id: 6,
      sNo: 6,
      categoryName: 'Sports',
      productName: 'Yoga Mat',
      stockAvailable: 15,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 7,
      sNo: 7,
      categoryName: 'Beauty',
      productName: 'Face Cream',
      stockAvailable: 3,
      unit: 'units',
      lowStock: true,
    },
    {
      id: 8,
      sNo: 8,
      categoryName: 'Electronics',
      productName: 'Wireless Earbuds',
      stockAvailable: 32,
      unit: 'pairs',
      lowStock: false,
    },
    {
      id: 9,
      sNo: 9,
      categoryName: 'Electronics',
      productName: 'Smart Watch',
      stockAvailable: 18,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 10,
      sNo: 10,
      categoryName: 'Fashion',
      productName: 'Women\'s Handbag',
      stockAvailable: 7,
      unit: 'pcs',
      lowStock: true,
    },
    {
      id: 11,
      sNo: 11,
      categoryName: 'Home & Kitchen',
      productName: 'Air Fryer',
      stockAvailable: 14,
      unit: 'pcs',
      lowStock: false,
    },
    {
      id: 12,
      sNo: 12,
      categoryName: 'Books',
      productName: 'JavaScript Mastery',
      stockAvailable: 22,
      unit: 'pcs',
      lowStock: false,
    },
  ];

  const categories = ['All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Beauty'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter items based on category and search
  const filteredItems = inventoryItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.categoryName === selectedCategory;
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
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
            <Button
              size="icon"
              className="rounded-full gradient-primary"
              onClick={() => {/* Handle add new product */}}
            >
              <Plus className="h-5 w-5" />
            </Button>
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
                setCurrentPage(1); // Reset to first page when searching
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
          {/* <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`rounded-full whitespace-nowrap ${
                  selectedCategory === category ? 'gradient-primary' : ''
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentPage(1); // Reset to first page when changing category
                }}
              >
                {category}
              </Button>
            ))}
          </div> */}

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl p-4 border border-border"
            >
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{filteredItems.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-border"
            >
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold">
                {filteredItems.filter(item => item.stockAvailable > 0).length}
              </p>
            </motion.div>
          </div>
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
            {currentItems.length > 0 ? (
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
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                  </div>
                  <div className="col-span-3 text-right">
                    <p className={`text-sm font-bold ${getStockColor(item.stockAvailable, item.lowStock)}`}>
                      {item.stockAvailable} {item.unit}
                    </p>
                    <p className={`text-xs ${getStockColor(item.stockAvailable, item.lowStock)}`}>
                      {getStockStatusText(item.stockAvailable, item.lowStock)}
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
          {filteredItems.length > itemsPerPage && (
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
          {filteredItems.length <= itemsPerPage && filteredItems.length > 0 && (
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

        {/* Add Product Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-24"
        >
          <Button
            className="w-full rounded-2xl gradient-primary shadow-lg"
            size="lg"
            onClick={() => {/* Handle add product */}}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
        </motion.div>
      </main>

      <TabBar />
    </div>
  );
};

export default Inventory;
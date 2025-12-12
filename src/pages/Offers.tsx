import React, { useEffect, useState, useCallback } from 'react';
import { Tag, Search, Filter, ChevronRight, ExternalLink, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import TabBar from '@/components/TabBar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Offer {
  id: number;
  title: string;
  description: string;
  discount_percentage: string; // Comes as string from API
  minimum_amount: string; // Comes as string from API
  valid_from: string;
  valid_until: string;
  image_url: string | null;
  offer_type: 'global' | 'category' | 'product'; // Updated based on API
  status: 'active' | 'inactive';
  category_name: string | null;
  category_id: number | null;
  product_name: string | null;
  product_id: number | null;
  created_at: string;
  updated_at: string;
  product_goods_name: string | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const Offers = () => {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Filters - use 'all' instead of empty string
  const [search, setSearch] = useState('');
  const [offerType, setOfferType] = useState('all');
  const [status, setStatus] = useState('all');
  
  // Debounced search
  const [searchInput, setSearchInput] = useState('');

  const fetchOffers = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      // Create params, excluding 'all' values from the API call
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(offerType && offerType !== 'all' && { offer_type: offerType }),
        ...(status && status !== 'all' && { status }),
        ...filters
      });

      const response = await fetch(`http://localhost:5000/api/offers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }

      const data = await response.json();
      
      setOffers(data.offers || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      });
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, offerType, status, toast]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchOffers(1);
  }, [fetchOffers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOffers(pagination.currentPage);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOffers(newPage);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setOfferType('all');
    setStatus('all');
  };

  const getOfferTypeColor = (type: string) => {
    switch (type) {
      case 'global': return 'bg-blue-100 text-blue-800';
      case 'category': return 'bg-green-100 text-green-800';
      case 'product': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'global': return 'Global Offer';
      case 'category': return 'Category Offer';
      case 'product': return 'Product Offer';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOfferActive = (offer: Offer) => {
    try {
      const now = new Date();
      const start = new Date(offer.valid_from);
      const end = new Date(offer.valid_until);
      return now >= start && now <= end && offer.status === 'active';
    } catch (error) {
      console.error('Error checking offer validity:', error);
      return false;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `"${text}" copied to clipboard`,
    });
  };

  const getDiscountText = (offer: Offer) => {
    const discount = parseFloat(offer.discount_percentage);
    if (isNaN(discount)) return 'Discount';
    return `${discount}% OFF`;
  };

  const getMinimumAmount = (offer: Offer) => {
    const amount = parseFloat(offer.minimum_amount);
    if (isNaN(amount) || amount === 0) return 'No minimum';
    return `₹${amount}`;
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    // If it's a relative path, prepend the base URL
    if (url.startsWith('/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Offers & Coupons</h1>
            <p className="text-muted-foreground text-sm">Special deals and discounts</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search offers by title or description..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={offerType} onValueChange={setOfferType}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Offer Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="global">Global Offers</SelectItem>
                <SelectItem value="category">Category Offers</SelectItem>
                <SelectItem value="product">Product Offers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* <div className="flex-1">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="p-4">
        {loading && !refreshing ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No offers found</h3>
            <p className="text-muted-foreground">
              {search || (offerType !== 'all') || (status !== 'all')
                ? 'Try changing your filters' 
                : 'No offers available at the moment'}
            </p>
          </div>
        ) : (
          <>
            {/* Offers Grid */}
            <div className="space-y-4">
              {offers.map((offer) => {
                const isActive = isOfferActive(offer);
                const imageUrl = getImageUrl(offer.image_url);
                
                return (
                  <Card key={offer.id} className={`overflow-hidden border ${!isActive ? 'opacity-75' : ''}`}>
                    {imageUrl && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={offer.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, hide the image container
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.style.height = '0';
                          }}
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{offer.title}</CardTitle>
                            <Badge className={getStatusColor(offer.status)}>
                              {offer.status}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {offer.description}
                          </CardDescription>
                        </div>
                        <Badge className={getOfferTypeColor(offer.offer_type)}>
                          {getOfferTypeLabel(offer.offer_type)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="space-y-3">
                        {/* Discount Value */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Discount</span>
                          <span className="text-2xl font-bold text-primary">
                            {getDiscountText(offer)}
                          </span>
                        </div>

                        {/* Offer Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Min. Order</span>
                            <p className="font-medium">{getMinimumAmount(offer)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Offer Type</span>
                            <p className="font-medium capitalize">{offer.offer_type}</p>
                          </div>
                          {offer.category_name && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Category</span>
                              <p className="font-medium">{offer.category_name}</p>
                            </div>
                          )}
                          {offer.product_name && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Product</span>
                              <p className="font-medium">{offer.product_name}</p>
                            </div>
                          )}
                        </div>

                        {/* Validity */}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <div className="text-center flex-1">
                              <span className="text-muted-foreground block text-xs">Starts</span>
                              <p className="font-medium">{formatDate(offer.valid_from)}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                            <div className="text-center flex-1">
                              <span className="text-muted-foreground block text-xs">Ends</span>
                              <p className="font-medium">{formatDate(offer.valid_until)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="border-t pt-4">
                      <div className="w-full flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => copyToClipboard(offer.title)}
                        >
                          Copy Title
                        </Button>
                        <Button 
                          className="flex-1"
                          disabled={!isActive}
                          onClick={() => {
                            const offerText = `${offer.title}: ${getDiscountText(offer)} on ${offer.offer_type === 'product' ? offer.product_name : offer.offer_type === 'category' ? offer.category_name : 'all products'}`;
                            copyToClipboard(offerText);
                          }}
                        >
                          {isActive ? (
                            <>
                              Share Offer
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                            'Offer Expired'
                          )}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.currentPage - 2,
                      pagination.totalPages - 4
                    )) + i;
                    
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
};

export default Offers;
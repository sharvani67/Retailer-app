import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Download,
  RefreshCw,
  X,
  Check,
  X as XIcon,
  Edit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { baseurl } from '@/Api/Baseurl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface OrderItem {
  id: string;
  item_name: string;
  product_id: string;
  price: number;
  quantity: number;
  total_amount: number;
  credit_period: number;
  credit_percentage: number;
  image?: string;
}

interface ApiOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_total: number;
  discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  net_payable: number;
  credit_period: number;
  status: string;
  estimated_delivery_date: string;
  created_at: string;
  order_placed_by: string;
  ordered_by: string;
  order_status: string;
  invoice_status: number;
  approval_status?: string; 
  items?: OrderItem[];
}

const Orders = () => {
  const { user, clearCart } = useApp(); // Add clearCart here
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [updatingApproval, setUpdatingApproval] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseurl}/orders/customer-orders/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const ordersData = await response.json();
      
      // Fetch detailed items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order: ApiOrder) => {
          try {
            const detailsResponse = await fetch(`${baseurl}/orders/details/${order.order_number}`);
            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              return {
                ...order,
                items: details.items || []
              };
            }
            return order;
          } catch (error) {
            console.error(`Error fetching details for order ${order.order_number}:`, error);
            return order;
          }
        })
      );
      
      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Pending';
    
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleViewDetails = (order: ApiOrder) => {
    navigate('/order-tracking', { 
      state: { 
        orderNumber: order.order_number,
      } 
    });
  };

  const handleDownloadInvoice = (orderNumber: string) => {
    navigate('/invoice-download', { 
      state: { 
        orderNumber: orderNumber,
      } 
    });
  };

  // Check if order can be cancelled
  const canCancelOrder = (order: ApiOrder) => {
    // For orders placed by user
    if (order.order_placed_by === user?.id) {
      return order.invoice_status === 0 && 
             order.order_status?.toLowerCase() === 'pending';
    }
    
    // For orders placed by someone else, only if approved
    if (order.order_placed_by !== user?.id && order.approval_status === 'Approved') {
      return order.invoice_status === 0 && 
             order.order_status?.toLowerCase() === 'pending';
    }
    
    return false;
  };

  // Check if order needs approval (placed by someone else)
  const needsApproval = (order: ApiOrder) => {
    return order.order_placed_by !== user?.id && 
           (!order.approval_status || order.approval_status === 'Pending');
  };

  // Check if order is pending approval
  const isPendingApproval = (order: ApiOrder) => {
    return needsApproval(order) && 
           (!order.approval_status || order.approval_status === 'Pending');
  };

  // Check if order is approved (placed by someone else)
  const isApprovedOrder = (order: ApiOrder) => {
    return order.order_placed_by !== user?.id && 
           order.approval_status === 'Approved';
  };

  // Check if order is rejected (placed by someone else)
  const isRejectedOrder = (order: ApiOrder) => {
    return order.order_placed_by !== user?.id && 
           order.approval_status === 'Rejected';
  };

  // Check if user has already approved/rejected
  const hasDecidedApproval = (order: ApiOrder) => {
    return order.order_placed_by !== user?.id && 
           order.approval_status && 
           order.approval_status !== 'Pending';
  };

  // Update approval status
  const handleUpdateApproval = async (orderNumber: string, approvalStatus: 'Approved' | 'Rejected') => {
    try {
      setUpdatingApproval(`${orderNumber}-${approvalStatus.toLowerCase()}`);
      
      const response = await fetch(`${baseurl}/orders/update-approval-status/${orderNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval_status: approvalStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update approval status');
      }

      // Update the approval status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_number === orderNumber 
            ? { ...order, approval_status: approvalStatus }
            : order
        )
      );

      return await response.json();
    } catch (err) {
      console.error('Error updating approval status:', err);
      throw err;
    } finally {
      setUpdatingApproval(null);
    }
  };

  // Cancel order function
  const handleCancelOrder = async (orderNumber: string) => {
    try {
      setCancellingOrder(orderNumber);
      
      const response = await fetch(`${baseurl}/orders/cancel/${orderNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const result = await response.json();
      
      // Update the order status locally
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_number === orderNumber 
            ? { ...order, order_status: 'Cancelled' }
            : order
        )
      );
      
      return result;
    } catch (err) {
      console.error('Error cancelling order:', err);
      throw err;
    } finally {
      setCancellingOrder(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get estimated delivery date
  const getEstimatedDelivery = (order: ApiOrder) => {
    if (order.estimated_delivery_date) {
      return formatDate(order.estimated_delivery_date);
    }
    
    // Fallback: add 5 days to order date
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate.setDate(orderDate.getDate() + 5));
    return formatDate(estimatedDate.toISOString());
  };

  // Enhanced Edit Order function
  const handleEditOrder = async (orderNumber: string) => {
    try {
      // Clear existing cart first
      await clearCart();
      
      // Fetch order details to load into cart
      const response = await fetch(`${baseurl}/orders/details/${orderNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const orderDetails = await response.json();
      
      // You might want to store the order details in state or context
      // to pre-load the cart with these items
      console.log('Order details for editing:', orderDetails);
      
      // Navigate to cart with order number for editing
      navigate(`/cart/${orderNumber}`);
    } catch (error) {
      console.error('Error preparing to edit order:', error);
      alert('Failed to load order for editing. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Loading your orders...</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="bg-muted rounded-full p-8 mb-6"
          >
            <RefreshCw className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">Loading Orders</h2>
          <p className="text-muted-foreground">Please wait while we fetch your order history</p>
        </div>
        <TabBar />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your order history</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-50 rounded-full p-12 mb-6 border border-red-200"
          >
            <Package className="h-20 w-20 text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Orders</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  // No orders state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track your order history</p>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-muted rounded-full p-12 mb-6"
          >
            <Package className="h-20 w-20 text-muted-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-8">Start shopping to see your orders here!</p>
          <Button onClick={() => navigate('/home')}>
            Start Shopping
          </Button>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-sm text-muted-foreground">
                {orders.length} order{orders.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Order List */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-lg border border-border hover:shadow-xl transition-shadow"
          >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-semibold text-primary">{order.order_number}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={`${getStatusColor(order.order_status || order.status)} border`}>
                  {getStatusLabel(order.order_status || order.status)}
                </Badge>
                
                {/* Show approval status if order was placed by someone else */}
                {order.order_placed_by !== user?.id && order.approval_status && (
                  <Badge className={`${getApprovalStatusColor(order.approval_status)} border text-xs`}>
                    {order.approval_status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">₹{order.net_payable?.toLocaleString() || order.order_total?.toLocaleString() || '0'}</p>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleViewDetails(order)}
              >
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Approval Actions (if order placed by someone else and pending) */}
            {isPendingApproval(order) && (
              <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-3">
                  This order placed by {order.ordered_by}, requires your approval to proceed
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleUpdateApproval(order.order_number, 'Approved')}
                    disabled={updatingApproval === `${order.order_number}-approved`}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {updatingApproval === `${order.order_number}-approved` ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </motion.div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <XIcon className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject order <span className="font-semibold">{order.order_number}</span>? 
                          This order will not proceed further.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await handleUpdateApproval(order.order_number, 'Rejected');
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Failed to reject order');
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={updatingApproval === `${order.order_number}-rejected`}
                        >
                          {updatingApproval === `${order.order_number}-rejected` ? 'Rejecting...' : 'Yes, Reject Order'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            {/* Action Buttons (for orders placed by user OR approved orders placed by others) */}
            {(order.order_placed_by === user?.id || isApprovedOrder(order)) && (
              <div className="mt-4 space-y-2">
                {/* Download Invoice Button - Show only if invoice_status is 1 */}
                {order.invoice_status === 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadInvoice(order.order_number)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Invoice{order.items && order.items.length > 1 ? 's' : ''}
                  </Button>
                )}

                {/* Edit & Cancel Buttons - Only if order can be cancelled */}
                {canCancelOrder(order) && (
                  <div className="flex gap-2">
                    {/* EDIT ORDER BUTTON */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrder(order.order_number)}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>

                    {/* CANCEL ORDER BUTTON */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancellingOrder === order.order_number}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          {cancellingOrder === order.order_number ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </motion.div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel order{" "}
                            <span className="font-semibold">{order.order_number}</span>? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await handleCancelOrder(order.order_number);
                              } catch (error) {
                                alert(
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to cancel order"
                                );
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Cancel Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Message (for rejected orders) */}
            {isRejectedOrder(order) && (
              <div className="mt-4 p-3 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">
                  You have rejected this order. It will not proceed further.
                </p>
              </div>
            )}

            {/* Footer with Estimated Delivery */}
            <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>
                Ordered on {formatDate(order.created_at)}
              </span>
              {(order.order_placed_by === user?.id || isApprovedOrder(order)) && 
               order.order_status?.toLowerCase() !== 'cancelled' && (
                <span>
                  Est. Delivery: {getEstimatedDelivery(order)}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </main>

      <TabBar />
    </div>
  );
};

export default Orders;
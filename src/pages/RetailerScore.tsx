import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, CreditCard, Package, Calendar, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreDetails {
  score: number;
  tier: string;
  details: {
    total_purchases: string;
    order_count: number;
    avg_order_value: string;
    last_order_date: string;
    avg_credit_days: string;
    days_since_last_order: number;
    pending_payments: string;
    total_transactions: number;
    unique_products: number;
    total_items: number;
    individual_scores: {
      volumeScore: number;
      frequencyScore: number;
      valueScore: number;
      recencyScore: number;
      paymentScore: number;
      diversityScore: number;
    };
  };
  individual_scores: {
    volumeScore: number;
    frequencyScore: number;
    valueScore: number;
    recencyScore: number;
    paymentScore: number;
    diversityScore: number;
  };
}

interface ScoreBreakdown {
  recent_orders: Array<{
    order_number: string;
    created_at: string;
    net_payable: string;
    credit_period: number;
    order_status: string;
    item_count: number;
  }>;
  payment_history: Array<{
    InvoiceNumber: string;
    Date: string;
    TotalAmount: string;
    paid_amount: string;
    balance_amount: string;
    status: string;
  }>;
  growth_trend: Array<{
    month: string;
    order_count: number;
    monthly_total: string;
  }>;
  last_updated: string;
}

interface RetailerScoreProps {
  retailerId: string;
  retailerName?: string;
}

const RetailerScore = ({ retailerId, retailerName = 'Retailer' }: RetailerScoreProps) => {
  const [scoreData, setScoreData] = useState<ScoreDetails | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/retailer-scores/${retailerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch retailer score');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setScoreData(data.data.detailed_scores);
          setBreakdown(data.data.score_breakdown);
        } else {
          throw new Error(data.error || 'Failed to load score');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load score');
        console.error('Error fetching retailer score:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
  }, [retailerId]);

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return 'text-amber-500 bg-amber-500/10';
      case 'advanced':
        return 'text-purple-500 bg-purple-500/10';
      case 'intermediate':
        return 'text-blue-500 bg-blue-500/10';
      case 'basic':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="mb-4 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border-border/50">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <p>Unable to load score</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) return null;

  const { score, tier, details, individual_scores } = scoreData;
  const scorePercentage = Math.min(score * 10, 100); // Convert 0-10 scale to 0-100

  return (
    <Card className="mb-4 border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Main Score Display */}
        <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${getTierColor(tier)}`}>
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{retailerName}'s Score</h3>
                <p className="text-xs text-muted-foreground">Last updated: {formatDate(breakdown?.last_updated || '')}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-2xl font-bold">{score.toFixed(1)}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(tier)}`}>
                    {tier} Tier
                  </span>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          
          <Progress value={scorePercentage} className="mt-3 h-2" />
        </div>

        {/* Expanded Details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 p-4 space-y-4"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Orders</span>
                </div>
                <div className="text-xl font-bold mt-1">{details.order_count}</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium">Total Spend</span>
                </div>
                <div className="text-xl font-bold mt-1">{formatCurrency(details.total_purchases)}</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium">Last Order</span>
                </div>
                <div className="text-xl font-bold mt-1">{details.days_since_last_order}d ago</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium">Avg Order</span>
                </div>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(details.avg_order_value)}
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Score Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(individual_scores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">
                      {key.replace('Score', '')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Progress value={value * 5} className="w-24 h-2" />
                      <span className="font-medium">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Recent Orders</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {breakdown?.recent_orders.slice(0, 3).map((order) => (
                  <div key={order.order_number} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                    <div>
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)} • {order.item_count} items
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(order.net_payable)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default RetailerScore;
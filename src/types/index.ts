export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
    mrp: number; 
    edited_sale_price:number,
  images?: string[];
  image: string;
  category: string;        // category_id as string
  category_name?: string;  // readable category name from API
  supplier: string;
  stock: number;
  gst_rate: number;        // e.g., 18
  inclusive_gst: string;   // "Inclusive" or "Exclusive"
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  discount?: number;
  discountEndDate?: string;
}

export interface CartItem {
  id?: number; // Database ID
  product: Product;
  quantity: number;
  creditPeriod: string;
  priceMultiplier: number;
  creditPercentage?: number;
}


export interface WishlistItem {
  product: Product;
}

export interface Order {
  id: string;
  items: CartItem[];
  address: {
    name: string;
    businessName: string;
    phone: string;
    addressLine: string;
    city: string;
    pincode: string;
  };
  total: number;
  status: 'ordered' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  date: string;
  estimatedDelivery: string;
}


export interface CreditPeriod {
  days: number;
  percentage: number;
  multiplier: number;
}
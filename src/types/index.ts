export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  supplier: string;
  stock: number;
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
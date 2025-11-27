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
  product: Product;
  quantity: number;
 

  // ✅ Add these two new fields
  priceMultiplier: number;
  creditPeriod: string;
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

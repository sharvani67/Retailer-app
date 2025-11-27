import { Product,Category } from '@/types';
import riceImage from '@/assets/rice-product.jpg';
import dalImage from '@/assets/dal-product.jpg';
import sugarImage from '@/assets/sugar-product.jpg';
import oilImage from '@/assets/oil-product.jpg';
import flourImage from '@/assets/flour-product.jpg';
import spicesImage from '@/assets/spices-product.jpg';
import { baseurl } from '@/Api/Baseurl';

// API URL for categories
const CATEGORIES_API_URL = `${baseurl}/categories`;

// Function to fetch categories from API
const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(CATEGORIES_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Map the API response to match your Category type
    return data.map((category: any) => ({
      id: category.id.toString(),
      name: category.category_name,
      discount: category.discount,
      discountEndDate: category.discount_end_date,
      // You can add default icons based on category name or keep it simple
      icon: getCategoryIcon(category.category_name),
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return fallback categories if API fails
  
  }
};

// Helper function to assign icons based on category names
const getCategoryIcon = (categoryName: string): string => {
  const iconMap: { [key: string]: string } = {
    'Home Accessories': '🏠',
    'Snacks': '🍪',
    'Kitchen': '🔪',
    'Laptops': '💻',
    'Mobile': '📱',
    'Rice': '🍚',
    'Pulses': '🫘',
    'Oils': '🛢️',
    'Grains': '🌾',
    'Spices': '🌶️',
    'Sugar': '🧂',
    'Beverages': '☕',
    
  };
  
  return iconMap[categoryName] || '📦'; // Default icon
};

export const categories: Promise<Category[]> = fetchCategories();

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Basmati Rice',
    description: 'Long grain aromatic basmati rice, aged 2 years for perfect texture and aroma.',
    price: 2500,
    unit: '50kg bag',
    image: riceImage,
    category: 'rice',
    supplier: 'India Rice Mills',
    stock: 150,
  },
  {
    id: '2',
    name: 'Toor Dal (Arhar)',
    description: 'Premium quality split pigeon peas, rich in protein and perfect for daily meals.',
    price: 8500,
    unit: '100kg sack',
    image: dalImage,
    category: 'pulses',
    supplier: 'Dal Traders Co.',
    stock: 80,
  },
  {
    id: '3',
    name: 'White Sugar',
    description: 'Pure crystal white sugar, ideal for retail and commercial use.',
    price: 1600,
    unit: '25kg bag',
    image: sugarImage,
    category: 'sugar',
    supplier: 'Sweet Suppliers Ltd',
    stock: 200,
  },
  {
    id: '4',
    name: 'Sunflower Oil',
    description: 'Refined sunflower cooking oil, cholesterol-free and heart-healthy.',
    price: 1400,
    unit: '10L can',
    image: oilImage,
    category: 'oils',
    supplier: 'Golden Oil Mills',
    stock: 120,
  },
  {
    id: '5',
    name: 'Whole Wheat Flour',
    description: 'Stone-ground whole wheat flour (atta), 100% natural with no additives.',
    price: 2200,
    unit: '50kg bag',
    image: flourImage,
    category: 'grains',
    supplier: 'Chakki Fresh Mills',
    stock: 100,
  },
  {
    id: '6',
    name: 'Red Chilli Powder',
    description: 'Premium quality ground red chilli powder, perfect spice level and color.',
    price: 3500,
    unit: '25kg bag',
    image: spicesImage,
    category: 'spices',
    supplier: 'Spice Kingdom',
    stock: 60,
  },
  {
    id: '7',
    name: 'Turmeric Powder',
    description: 'Pure turmeric powder with high curcumin content, bright yellow color.',
    price: 4200,
    unit: '25kg bag',
    image: spicesImage,
    category: 'spices',
    supplier: 'Spice Kingdom',
    stock: 75,
  },
  {
    id: '8',
    name: 'Moong Dal (Green Gram)',
    description: 'Husked split green gram, excellent source of protein for healthy diet.',
    price: 9200,
    unit: '100kg sack',
    image: dalImage,
    category: 'pulses',
    supplier: 'Dal Traders Co.',
    stock: 65,
  },
  {
    id: '9',
    name: 'Instant Tea Premix',
    description: 'Ready-to-serve tea premix with perfect blend of tea, milk, and sugar.',
    price: 2800,
    unit: '20kg box',
    image: flourImage,
    category: 'beverages',
    supplier: 'Chai Master Co.',
    stock: 90,
  },
  {
    id: '10',
    name: 'Namkeen Mix',
    description: 'Assorted savory snack mix, crispy and flavorful for retail sale.',
    price: 1800,
    unit: '15kg box',
    image: flourImage,
    category: 'snacks',
    supplier: 'Snack Factory Ltd',
    stock: 110,
  },
  {
    id: '11',
    name: 'Brown Sugar',
    description: 'Natural brown sugar with molasses, perfect for baking and beverages.',
    price: 1900,
    unit: '25kg bag',
    image: sugarImage,
    category: 'sugar',
    supplier: 'Sweet Suppliers Ltd',
    stock: 85,
  },
  {
    id: '12',
    name: 'Mustard Oil',
    description: 'Pure cold-pressed mustard oil, strong flavor and aroma.',
    price: 1650,
    unit: '10L can',
    image: oilImage,
    category: 'oils',
    supplier: 'Golden Oil Mills',
    stock: 95,
  },
];

export const banners = [
  {
    id: '1',
    title: '🎉 New Year Sale',
    subtitle: 'Up to 25% off on all rice varieties',
    gradient: 'from-blue-600 via-indigo-500 to-purple-500',
  },
  {
    id: '2',
    title: '🔥 Hot Deal',
    subtitle: 'Buy 10 bags of dal, get 1 free!',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    id: '3',
    title: '⚡ Flash Offer',
    subtitle: 'Free delivery on orders above ₹50,000',
    gradient: 'from-amber-400 via-orange-500 to-yellow-500',
  },
];

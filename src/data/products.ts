import { Product, Category } from '@/types';
import riceImage from '@/assets/rice-product.jpg';
import dalImage from '@/assets/dal-product.jpg';
import sugarImage from '@/assets/sugar-product.jpg';
import oilImage from '@/assets/oil-product.jpg';
import flourImage from '@/assets/flour-product.jpg';
import spicesImage from '@/assets/spices-product.jpg';
import { baseurl } from '@/Api/Baseurl';

// API URLs
const CATEGORIES_API_URL = `${baseurl}/categories`;
const PRODUCTS_API_URL = `${baseurl}/get-sales-products`;

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
      icon: getCategoryIcon(category.category_name),
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return fallback categories if API fails
    return [];
  }
};

// Function to fetch products from API
const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(PRODUCTS_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    console.log('API Response:', data); // Debug log
    
    // Map the API response to match your Product type
    return data.map((product: any) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description || `${product.name} - Premium quality product`,
      price: Number(product.price) || 0, // Convert string to number
      unit: product.unit,
      image: getProductImage(product.category),
      category: product.category_id?.toString(), // Use category_id for filtering
      supplier: product.supplier,
      stock: product.stock || 50,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array if API fails
    return [];
  }
};

// Function to fetch a single product by ID
const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const products = await fetchProducts();
    return products.find(product => product.id === id) || null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
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

// Helper function to assign images based on category
const getProductImage = (category: string): string => {
  const imageMap: { [key: string]: string } = {
    'rice': riceImage,
    'pulses': dalImage,
    'dal': dalImage,
    'sugar': sugarImage,
    'oils': oilImage,
    'oil': oilImage,
    'grains': flourImage,
    'flour': flourImage,
    'spices': spicesImage,
    'mobile': flourImage, // Add mappings for your new categories
    'laptops': flourImage,
  };
  
  return imageMap[category?.toLowerCase()] || flourImage; // Default image
};

// Export the fetch functions
export { fetchCategories, fetchProducts, fetchProductById };

// Export the static banners (unchanged)
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
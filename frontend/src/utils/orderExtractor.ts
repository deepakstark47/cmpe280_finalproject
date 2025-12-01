import { Product } from '../types/types';

export interface OrderItem {
  item: string;
  price: number;
  quantity: number;
}

export interface ChatbotMemory {
  agent?: string;
  order?: OrderItem[];
  [key: string]: any;
}

/**
 * Extract order from chatbot API response memory
 */
export const extractOrderFromMemory = (responseData: any): OrderItem[] => {
  try {
    // Check if response has output.memory.order
    if (responseData?.output?.memory?.order && Array.isArray(responseData.output.memory.order)) {
      return responseData.output.memory.order;
    }
    
    // Check if response has memory.order directly
    if (responseData?.memory?.order && Array.isArray(responseData.memory.order)) {
      return responseData.memory.order;
    }
    
    // Check if response.data has memory
    if (responseData?.data?.memory?.order && Array.isArray(responseData.data.memory.order)) {
      return responseData.data.memory.order;
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting order from memory:', error);
    return [];
  }
};

/**
 * Match order item to actual product
 */
export const matchOrderItemToProduct = (orderItem: OrderItem, products: Product[]): Product | null => {
  const itemName = orderItem.item.toLowerCase().trim();
  
  // Exact match
  let match = products.find(p => p.name.toLowerCase() === itemName);
  if (match) return match;
  
  // Partial match
  match = products.find(p => {
    const productName = p.name.toLowerCase();
    return productName.includes(itemName) || itemName.includes(productName);
  });
  if (match) return match;
  
  // Word-based match
  const itemWords = itemName.split(/\s+/);
  match = products.find(p => {
    const productWords = p.name.toLowerCase().split(/\s+/);
    return itemWords.some(word => 
      productWords.some(pWord => pWord.includes(word) || word.includes(pWord))
    );
  });
  
  return match || null;
};

/**
 * Check if message indicates order completion
 */
export const isOrderCompletion = (message: string): boolean => {
  const lowerMessage = message.toLowerCase().trim();
  const completionPhrases = [
    'that will be all',
    "that's all",
    'that is all',
    'all done',
    "i'm done",
    'finish order',
    'complete order',
    'place order',
    'checkout',
    'proceed to checkout',
    'confirm order',
    'finalize order',
    'submit order',
    'buy now',
    'order now',
    'yes place order',
    'yes checkout',
    'yes that\'s all',
    'yes that will be all'
  ];
  
  return completionPhrases.some(phrase => lowerMessage.includes(phrase));
};


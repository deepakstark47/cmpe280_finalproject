import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageList from '../components/MessageList';
import { MessageInterface, Product } from '../types/types';
import { FiSend, FiMic, FiMicOff } from 'react-icons/fi';
import { callChatBotAPI } from '../services/chatBot';
import toast from 'react-hot-toast';
import chatbotImage from '../../assets/unnamed.jpg';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { speakText } from '../utils/textToSpeech';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchProducts } from '../services/productsService';
import { extractOrderFromMemory, matchOrderItemToProduct, isOrderCompletion, OrderItem } from '../utils/orderExtractor';
import { ref, push } from 'firebase/database';
import { database } from '../config/firebase';
import PaymentModal from '../components/PaymentModal';

interface ChatRoomProps {
  isWidget?: boolean;
  isFullScreen?: boolean;
  messages: MessageInterface[];
  setMessages: React.Dispatch<React.SetStateAction<MessageInterface[]>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatRoom = ({ 
  isWidget = false, 
  isFullScreen = false,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
  inputValue,
  setInputValue,
  isSending,
  setIsSending
}: ChatRoomProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [processedOrders, setProcessedOrders] = useState<Set<string>>(new Set());
  const { addToCart, cartItems, clearCart, getTotalPrice } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const lastOrderHashRef = useRef<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderPlacement, setPendingOrderPlacement] = useState(false);

  // Load products for order matching
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load products for chatbot:', error);
      }
    };
    loadProducts();
  }, []);

  // Place order function (now called after payment success)
  const handlePlaceOrder = async (): Promise<boolean> => {
    if (cartItems.length === 0) {
      return false;
    }

    try {
      const orderData = {
        userId: currentUser?.uid || 'anonymous',
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || '',
        })),
        total: getTotalPrice(),
        status: 'preparing',
        createdAt: new Date().toISOString(),
        customerName: currentUser?.displayName || 'Guest',
        customerEmail: currentUser?.email || '',
        paymentStatus: 'paid',
      };

      const ordersRef = ref(database, 'orders');
      await push(ordersRef, orderData);

      clearCart();
      toast.success('Order placed successfully!');
      return true;
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
      return false;
    }
  };

  // Handle payment success from chatbot flow
  const handlePaymentSuccess = async () => {
    const totalBeforeOrder = getTotalPrice();
    const success = await handlePlaceOrder();
    setShowPaymentModal(false);
    
    if (success && pendingOrderPlacement) {
      // Show success message in chat after payment
      const successMessages = [
        `Order placed successfully! Your order total is $${(totalBeforeOrder * 1.1).toFixed(2)}. Thank you for choosing Merry's Way Coffee Shop!`,
        `Perfect! Your order has been confirmed. Total: $${(totalBeforeOrder * 1.1).toFixed(2)}. We'll have it ready for you soon!`,
        `Great choice! Order confirmed for $${(totalBeforeOrder * 1.1).toFixed(2)}. Thanks for visiting Merry's Way Coffee Shop!`,
        `Your order is on the way! Total: $${(totalBeforeOrder * 1.1).toFixed(2)}. We appreciate your business!`,
        `Order successfully placed! Your total is $${(totalBeforeOrder * 1.1).toFixed(2)}. Thank you for choosing us!`,
      ];
      const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      const botResponse: MessageInterface = {
        role: 'assistant',
        content: randomMessage
      };
      setMessages(prev => [...prev, botResponse]);
      // Reset processed orders after placing order
      setProcessedOrders(new Set());
      lastOrderHashRef.current = '';
      setPendingOrderPlacement(false);
    }
  };

  // Process orders from API response memory
  const processOrdersFromMemory = (orderItems: OrderItem[], fullResponse: any) => {
    // Create a hash of the current order to detect changes
    const orderHash = JSON.stringify(orderItems);
    
    // Only process if this is a new/different order
    if (orderHash === lastOrderHashRef.current) {
      return; // Already processed this order
    }
    
    // Find new items that weren't in the previous order
    const previousOrderHash = lastOrderHashRef.current;
    let previousOrderItems: OrderItem[] = [];
    if (previousOrderHash) {
      try {
        previousOrderItems = JSON.parse(previousOrderHash);
      } catch (e) {
        // If we can't parse, treat as empty
      }
    }
    
    // Create a set of previous items for quick lookup
    const previousItemsSet = new Set(
      previousOrderItems.map(item => `${item.item.toLowerCase()}-${item.quantity}`)
    );
    
    // Find new items (items not in previous order)
    const newItems = orderItems.filter(item => {
      const itemKey = `${item.item.toLowerCase()}-${item.quantity}`;
      return !previousItemsSet.has(itemKey);
    });
    
    lastOrderHashRef.current = orderHash;
    
    let addedCount = 0;
    let notFoundItems: string[] = [];

    // Only process new items
    for (const orderItem of newItems) {
      const product = matchOrderItemToProduct(orderItem, products);
      if (product) {
        // Check if we've already added this exact item in this batch
        const itemKey = `${product.id}-${orderItem.quantity}`;
        if (!processedOrders.has(itemKey)) {
          // Use silent=true to suppress individual toasts, we'll show a combined one
          addToCart(product, orderItem.quantity, true);
          setProcessedOrders(prev => new Set(prev).add(itemKey));
          addedCount++;
        }
      } else {
        notFoundItems.push(orderItem.item);
      }
    }

    if (addedCount > 0) {
      const addedItems = newItems
        .filter(item => matchOrderItemToProduct(item, products))
        .map(item => `${item.quantity}x ${item.item}`)
        .join(', ');
      
      toast.success(`Added to cart: ${addedItems}`, { duration: 3000 });
    }

    if (notFoundItems.length > 0) {
      console.warn('Could not match products:', notFoundItems);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Paste the transcribed text into the input field for review before sending
    setInputValue(transcript);
  };

  const handleVoiceError = (error: string) => {
    toast.error(error);
  };

  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition({
    onTranscript: handleVoiceTranscript,
    onError: handleVoiceError,
  });

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    let message = (messageText || inputValue).trim();
    if (!message || isSending) return;
    
    // Check if user wants to complete the order
    if (isOrderCompletion(message)) {
      if (cartItems.length === 0) {
        toast.error('Your cart is empty. Please add items first.');
        return;
      }
      
      const userMessage: MessageInterface = { content: message, role: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsSending(true);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Show payment modal instead of placing order directly
      setPendingOrderPlacement(true);
      setShowPaymentModal(true);
      setIsSending(false);
      setIsTyping(false);
      return;
    }
    
    try {
        setIsSending(true);
        // Add the user message to the list of messages
        let InputMessages = [...messages, { content: message, role: 'user' }];

        setMessages(InputMessages);
        setInputValue('');
        setIsTyping(true);
        
        const response = await callChatBotAPI(InputMessages);
        const resposnseMessage = response.message;
        const fullResponse = response.fullResponse;
        
        setIsTyping(false);
        setMessages(prevMessages => [...prevMessages, resposnseMessage]);
        
        // Extract and process orders from API response memory
        if (fullResponse) {
          const orderItems = extractOrderFromMemory(fullResponse);
          if (orderItems.length > 0) {
            console.log('Found orders in memory:', orderItems);
            processOrdersFromMemory(orderItems, fullResponse);
          }
        }
        
        // Optional: Speak the bot's response
        // Uncomment the line below to enable text-to-speech
        // speakText(resposnseMessage.content);
        
    } catch(err: any) {
        setIsTyping(false);
        const errorMessage = err.response?.data?.error || err.message || 'Error sending message';
        toast.error(errorMessage);
        
        // Add error message to chat
        const errorResponse: MessageInterface = {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again or check your connection."
        };
        setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
        setIsSending(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex-1 bg-white flex flex-col relative overflow-hidden min-h-0`}>
        {/* Animated Background Elements - only show in full screen */}
        {!isWidget && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-neutral-200/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-40 right-20 w-40 h-40 bg-neutral-200/10 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-neutral-200/10 rounded-full blur-3xl animate-float-slow"></div>
          </div>
        )}

        {/* Header - only show in full screen mode when not in widget full-screen */}
        {!isWidget && !isFullScreen && (
          <>
            <div className='bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-lg relative z-10'>
              <div className='max-w-4xl mx-auto px-4 py-5'>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className='w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden'>
                      <img 
                        src={chatbotImage} 
                        alt="Merry's Way Coffee Shop" 
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white'></div>
                  </div>
                  <div>
                    <h1 className='text-2xl font-bold text-neutral-900 flex items-center gap-2'>
                      <span>Merry's Way</span>
                    </h1>
                    <p className='text-base text-neutral-600 mt-0.5'>
                      Your Coffee Assistant
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className='h-1 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 relative z-10'>
              <div className='h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer'></div>
            </div>
          </>
        )}

        <div className='flex-1 flex flex-col relative z-10 min-h-0'>
            <div className='flex-1 min-h-0 overflow-hidden'>
                <MessageList 
                    messages={messages}
                    isTyping={isTyping}
                />
            </div>

            <div className={`pt-4 pb-5 px-4 bg-white/80 backdrop-blur-md border-t border-neutral-200 shadow-lg flex-shrink-0 z-20 ${isWidget ? '' : ''}`}>
                <div className={`${isWidget ? 'px-2' : 'max-w-4xl mx-auto'}`}>
                  <div className="flex flex-row justify-between items-center border-2 p-3 bg-white/90 backdrop-blur-sm border-neutral-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-neutral-400 group">
                      <input 
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder='Ask me anything about our coffee shop...'
                          className='flex-1 mr-2 outline-none text-base bg-transparent text-neutral-700 placeholder:text-neutral-400 focus:placeholder:text-neutral-500 transition-colors'
                          disabled={isSending || isListening}
                      />
                      {isSupported && (
                        <button
                          onClick={toggleVoiceRecording}
                          disabled={isSending}
                          className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 mr-2 ${
                            isListening
                              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                              : 'bg-neutral-200 hover:bg-neutral-300'
                          } ${isSending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
                        >
                          {isListening ? (
                            <FiMicOff size={20} color="#FFFFFF" />
                          ) : (
                            <FiMic size={20} color="#6B7280" />
                          )}
                        </button>
                      )}
                      <button
                          onClick={() => handleSendMessage()}
                          disabled={isSending || !inputValue.trim() || isListening}
                          className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isSending || !inputValue.trim() || isListening
                              ? 'bg-neutral-200 cursor-not-allowed'
                              : 'bg-neutral-800 hover:bg-neutral-900 active:scale-95 cursor-pointer shadow-md hover:shadow-lg group-hover:scale-105'
                          }`}
                      >
                          <FiSend 
                            size={20} 
                            color={isSending || !inputValue.trim() || isListening ? "#9CA3AF" : "#FFFFFF"}
                          />
                      </button>
                  </div>
                  {isListening && (
                    <div className="flex items-center gap-2 mt-3 ml-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                      </div>
                      <p className="text-sm text-red-600 font-medium">Listening... Speak now</p>
                    </div>
                  )}
                  {isSending && (
                    <div className="flex items-center gap-2 mt-3 ml-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                      <p className="text-sm text-neutral-500">Sending your message...</p>
                    </div>
                  )}
                </div>
            </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingOrderPlacement(false);
          }}
          total={getTotalPrice() * 1.1}
          onPaymentSuccess={handlePaymentSuccess}
        />
    </div>
  )
}

export default ChatRoom


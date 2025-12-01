import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FiTrash2, FiPlus, FiMinus, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import { ref, push } from 'firebase/database';
import { database } from '../config/firebase';
import toast from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // Show payment modal instead of placing order directly
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      const orderData = {
        userId: currentUser?.uid || 'anonymous',
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || '', // Include product image
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

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-neutral-200/50 p-12 max-w-md w-full text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <FiShoppingBag size={64} className="text-neutral-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">Your cart is empty</h2>
          <p className="text-lg text-neutral-600 mb-8">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-neutral-800 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/')}
            className="p-3 hover:bg-neutral-100 rounded-xl transition-all duration-300 hover:scale-110 group"
            aria-label="Back to home"
          >
            <FiArrowLeft size={24} className="text-neutral-700 group-hover:text-neutral-900 transition-colors" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-2">Shopping Cart</h1>
            <p className="text-neutral-600 font-medium">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.product.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Product Image */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                  {item.product.image && item.product.image.trim() !== '' ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn(`Failed to load cart image for ${item.product.name}:`, item.product.image);
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-4xl">
                      ☕
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <h3 className="font-extrabold text-neutral-900 text-lg mb-1 truncate">
                    {item.product.name}
                  </h3>
                  {item.product.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                    {item.product.description}
                  </p>
                  )}
                  <p className="text-xl font-extrabold text-neutral-900">
                    ${item.product.price.toFixed(2)}
                    <span className="text-sm font-medium text-neutral-500 ml-1">each</span>
                  </p>
                </div>

                {/* Quantity Controls and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                {/* Quantity Controls */}
                  <div className="flex items-center border-2 border-neutral-300 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-4 py-3 hover:bg-neutral-100 transition-colors active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus size={18} className="text-neutral-700" />
                    </button>
                    <span className="px-6 py-3 min-w-[4rem] text-center font-bold text-lg bg-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-4 py-3 hover:bg-neutral-100 transition-colors active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <FiPlus size={18} className="text-neutral-700" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-transparent hover:border-red-200"
                    aria-label="Remove from cart"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right sm:text-left sm:ml-auto bg-neutral-50 px-5 py-3 rounded-xl border-2 border-neutral-200 min-w-[7rem]">
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-extrabold text-neutral-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 p-6 md:p-8 sticky top-24 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neutral-100 rounded-xl">
                  <FiShoppingBag size={24} className="text-neutral-700" />
                </div>
                <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Order Summary</h2>
              </div>

              <div className="bg-gradient-to-br from-neutral-50 to-transparent rounded-xl p-5 space-y-4 mb-6 border border-neutral-200/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                    Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-base font-bold text-neutral-800">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Tax (10%)</span>
                  <span className="text-base font-bold text-neutral-800">${(getTotalPrice() * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-neutral-300 pt-4 mt-4 flex justify-between items-center">
                  <span className="text-lg font-extrabold text-neutral-900 uppercase tracking-tight">Total</span>
                  <span className="text-3xl font-extrabold text-neutral-900">${(getTotalPrice() * 1.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
              <button
                onClick={handlePlaceOrder}
                  className="w-full bg-neutral-800 text-white py-4 rounded-xl font-extrabold text-lg hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                  <FiShoppingBag size={20} />
                Place Order
              </button>

              <button
                onClick={clearCart}
                  className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-xl font-bold hover:bg-neutral-200 transition-all duration-300 border-2 border-transparent hover:border-neutral-300"
              >
                Clear Cart
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={getTotalPrice() * 1.1}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Cart;


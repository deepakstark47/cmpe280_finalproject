import { useState, FormEvent } from 'react';
import { FiX, FiCreditCard, FiLock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentSuccess: () => void;
}

const PaymentModal = ({ isOpen, onClose, total, onPaymentSuccess }: PaymentModalProps) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvv(value);
  };

  const validateForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardName.trim()) {
      toast.error('Please enter the cardholder name');
      return false;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cvv || cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    // In a real application, you would integrate with Stripe, PayPal, or another payment gateway
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success (90% success rate for demo)
      const paymentSuccess = Math.random() > 0.1;
      
      if (paymentSuccess) {
        onPaymentSuccess();
        onClose();
      } else {
        toast.error('Payment failed. Please check your card details and try again.');
      }
    } catch (error) {
      toast.error('An error occurred during payment processing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-neutral-200 animate-slide-in-up relative">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-xl shadow-lg">
              <FiCreditCard className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Total Amount Display */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl p-5 border-2 border-neutral-200 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-neutral-600 uppercase tracking-wide">Total Amount</span>
              <span className="text-3xl font-extrabold text-neutral-900">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
              Card Number
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <FiCreditCard className="text-neutral-500" size={18} />
              </div>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium"
                required
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium"
              required
            />
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                CVV
              </label>
              <div className="relative">
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FiLock className="text-neutral-500" size={16} />
                </div>
                <input
                  type="text"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 pr-12 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
            <FiLock className="text-neutral-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-neutral-600 font-medium">
              Your payment information is secure and encrypted. We never store your card details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-100 hover:border-neutral-400 transition-all duration-300 font-bold shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  <span>Pay ${total.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserOrders } from '../services/ordersService';
import { Order } from '../types/types';
import { FiArrowLeft, FiPackage, FiClock, FiCheckCircle, FiXCircle, FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userOrders = await fetchUserOrders(currentUser.uid);
        setOrders(userOrders);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [currentUser?.uid]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <FiXCircle className="text-red-500" size={20} />;
      case 'preparing':
        return <FiLoader className="text-neutral-600 animate-spin" size={20} />;
      default:
        return <FiClock className="text-neutral-500" size={20} />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to page 1 when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-2">Order History</h1>
            <p className="text-neutral-600 font-medium">View and track all your past orders</p>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-lg font-semibold text-neutral-900 mb-1">Loading your orders...</p>
              <p className="text-sm text-neutral-500">Please wait while we fetch your order history</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-neutral-200/50 p-16 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <FiPackage size={64} className="text-neutral-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">No orders yet</h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">Start shopping to see your orders appear here. Discover our amazing coffee selection!</p>
            <button
              onClick={() => navigate('/')}
              className="bg-neutral-800 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentOrders.map((order, orderIndex) => (
              <div
                key={order.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${orderIndex * 100}ms` }}
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 px-6 py-5 border-b border-neutral-200/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Order #</span>
                        <span className="text-xl font-extrabold text-neutral-900 font-mono tracking-tight">
                          {order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock size={14} className="text-neutral-400" />
                        <p className="text-sm text-neutral-600 font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border-2 shadow-sm ${getStatusColor(order.status)} transition-all duration-300 group-hover:scale-105`}>
                        {getStatusIcon(order.status)}
                        <span className="font-bold capitalize text-sm">{order.status}</span>
                      </div>
                      <div className="text-right bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-neutral-200/50">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                          ${(order.total * 1.1).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <FiPackage size={20} className="text-neutral-600" />
                    <h3 className="text-lg font-extrabold text-neutral-900 tracking-tight">Order Items</h3>
                    <span className="ml-2 px-2.5 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-full">
                      {order.items.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white border-2 border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-md transition-all duration-300 group/item"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300 shadow-sm">
                            {item.image && item.image.trim() !== '' ? (
                              <img
                                src={item.image}
                                alt={item.productName || `Product ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to emoji if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<span class="text-neutral-600 font-semibold text-2xl">☕</span>';
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-neutral-600 font-semibold text-2xl">☕</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-neutral-900 truncate mb-1 text-base">
                              {item.productName || `Product ${index + 1}`}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-neutral-600 font-medium">Qty:</span>
                              <span className="font-bold text-neutral-800">{item.quantity}</span>
                              <span className="text-neutral-400">×</span>
                              <span className="font-semibold text-neutral-700">${item.price?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-lg font-extrabold text-neutral-900">
                            ${((item.price || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-8 pt-6 border-t-2 border-neutral-200">
                    <div className="bg-gradient-to-r from-neutral-50 to-transparent rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Subtotal</span>
                        <span className="text-base font-bold text-neutral-800">${order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Tax (10%)</span>
                        <span className="text-base font-bold text-neutral-800">${(order.total * 0.1).toFixed(2)}</span>
                    </div>
                      <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-neutral-300">
                        <span className="text-lg font-extrabold text-neutral-900 uppercase tracking-tight">Total</span>
                        <span className="text-2xl font-extrabold text-neutral-900">${(order.total * 1.1).toFixed(2)}</span>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 shadow-lg">
                <div className="text-sm font-semibold text-neutral-600">
                  Showing <span className="font-extrabold text-neutral-900">{indexOfFirstOrder + 1}</span> to{' '}
                  <span className="font-extrabold text-neutral-900">
                    {Math.min(indexOfLastOrder, orders.length)}
                  </span>{' '}
                  of <span className="font-extrabold text-neutral-900">{orders.length}</span> orders
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === 1
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95'
                    }`}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={20} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[2.5rem] px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                              currentPage === page
                                ? 'bg-neutral-900 text-white shadow-lg scale-105'
                                : 'bg-white text-neutral-700 hover:bg-neutral-100 border-2 border-neutral-200 hover:border-neutral-300 hover:scale-110 active:scale-95'
                            }`}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="text-neutral-400 px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 hover:scale-110 border-2 border-neutral-200 hover:border-neutral-300 active:scale-95'
                    }`}
                    aria-label="Next page"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;


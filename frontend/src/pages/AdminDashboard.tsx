import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllOrders, updateOrderStatus, deleteOrder, updateOrder } from '../services/ordersService';
import { Order, Product, OrderItem } from '../types/types';
import { getAllAdmins, addAdmin, removeAdmin } from '../services/adminService';
import { clearAdminCache } from '../utils/adminCheck';
import { fetchProducts } from '../services/productsService';
import { 
  FiPackage, FiEdit, FiTrash2, FiRefreshCw, FiSearch, FiFilter, FiPlus, 
  FiClock, FiCheckCircle, FiXCircle, FiUsers, FiLogOut, FiDollarSign, 
  FiTrendingUp, FiTrendingDown, FiX, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight,
  FiBarChart2, FiShoppingBag, FiUser, FiMail, FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [admins, setAdmins] = useState<Array<{ userId: string; email: string; createdAt: string; expiresAt?: string }>>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(3);
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    loadOrders();
    loadAdmins();
    loadProducts();
  }, [currentUser, isAdmin, navigate]);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await fetchProducts();
      setProducts(fetchedProducts);
    } catch (error: any) {
      console.error('Failed to load products:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      const allAdmins = await getAllAdmins();
      setAdmins(allAdmins);
    } catch (error: any) {
      console.error('Failed to load admins:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const userId = prompt('Enter the user ID (Firebase UID) for this email:');
    if (!userId) return;

    try {
      await addAdmin(userId, newAdminEmail.trim());
      toast.success('Admin added successfully');
      setNewAdminEmail('');
      await loadAdmins();
      clearAdminCache(userId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove admin privileges from this user?')) {
      return;
    }

    try {
      await removeAdmin(userId);
      toast.success('Admin removed successfully');
      await loadAdmins();
      clearAdminCache(userId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove admin');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await fetchAllOrders();
      setOrders(allOrders);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteOrder(orderId);
      toast.success('Order deleted successfully');
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  const handleSaveEdit = async (updatedOrder: Partial<Order>) => {
    if (!editingOrder) return;

    try {
      const newTotal = updatedOrder.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || editingOrder.total;
      
      await updateOrder(editingOrder.id, {
        ...updatedOrder,
        total: newTotal,
      });
      toast.success('Order updated successfully');
      setEditingOrder(null);
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/50';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50';
      case 'preparing':
        return 'bg-neutral-800 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-neutral-400 to-neutral-500 text-white';
    }
  };

  const statusOptions: Order['status'][] = ['preparing', 'completed', 'cancelled'];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Reset to page 1 when filteredOrders change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, searchQuery, statusFilter]);

  // Calculate statistics
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, order) => sum + order.total * 1.1, 0);
  
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const totalOrders = orders.length;

  if (!currentUser || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 relative overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neutral-200/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Enhanced Header */}
      {!editingOrder && (
      <div className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-neutral-600 font-semibold tracking-wide">Order Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdminManagement(!showAdminManagement)}
                className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-bold backdrop-blur-sm ${
                  showAdminManagement
                    ? 'bg-neutral-900 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-white/90 text-neutral-900 border-2 border-neutral-200 hover:bg-white hover:border-neutral-300'
                }`}
              >
                <FiUsers size={18} />
                {showAdminManagement ? 'Hide Admins' : 'Manage Admins'}
              </button>
              <button
                onClick={logout}
                className="px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-bold bg-neutral-800 text-white hover:bg-neutral-900 shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Logout"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ zIndex: 10 }}>
        {/* Admin Management Section */}
        {showAdminManagement && (
          <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-neutral-200/50 p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-neutral-800 rounded-xl shadow-lg">
                  <FiUsers className="text-white" size={28} />
                </div>
                Admin Management
              </h2>
            </div>
            
            <div className="mb-8 p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-2xl border-2 border-neutral-200 shadow-md">
              <h3 className="text-xl font-extrabold text-neutral-900 mb-5 flex items-center gap-3">
                <div className="p-2 bg-neutral-800 rounded-lg">
                  <FiPlus size={20} className="text-white" />
                </div>
                Add New Admin
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-5 py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all"
                />
                <button
                  onClick={handleAddAdmin}
                  className="px-8 py-3.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 shadow-md"
                >
                  Add Admin
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-4 font-medium">
                Note: You'll need to provide the user's Firebase UID when adding an admin.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-neutral-900 mb-5 flex items-center gap-2">
                <FiUsers size={20} />
                Current Admins
              </h3>
              {admins.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
                  <p className="text-neutral-600 font-semibold">No admins found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.userId}
                      className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div>
                        <p className="font-bold text-neutral-900 text-lg">{admin.email}</p>
                        <p className="text-sm text-neutral-600 mt-1">
                          Added: {new Date(admin.createdAt).toLocaleDateString()}
                          {admin.expiresAt && (
                            <span className="ml-2">
                              (Expires: {new Date(admin.expiresAt).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                      {admin.userId !== currentUser?.uid && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.userId)}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Orders Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiPackage className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{totalOrders}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">All Orders</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <FiTrendingUp size={16} />
                <span>All time</span>
              </div>
            </div>
          </div>

          {/* Preparing Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiClock className="text-white animate-spin-slow" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{preparingCount}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Preparing</p>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600 text-sm font-semibold">
                <FiRefreshCw size={16} className="animate-spin" />
                <span>In progress</span>
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 to-green-100/0 group-hover:from-emerald-100/30 group-hover:to-green-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-xl">
                  <FiCheckCircle className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Success</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">{completedCount}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Completed</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <FiTrendingUp size={16} />
                <span>Finished</span>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-neutral-200 shadow-lg hover:shadow-2xl hover:border-neutral-300 transition-all duration-500 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/0 to-neutral-100/0 group-hover:from-neutral-100/30 group-hover:to-neutral-100/30 transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3.5 bg-neutral-800 rounded-xl shadow-xl">
                  <FiDollarSign className="text-white" size={28} />
                </div>
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Revenue</div>
              </div>
              <div className="mb-3">
                <p className="text-5xl font-extrabold text-neutral-900 mb-2 tracking-tight">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm font-bold text-neutral-600 uppercase tracking-wide">Total Revenue</p>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-600 text-sm font-semibold">
                <FiBarChart2 size={16} />
                <span>From completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Search */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-neutral-200/50 p-6 md:p-8 mb-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-extrabold text-neutral-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-neutral-100 rounded-lg">
                  <FiSearch size={16} className="text-neutral-700" />
                </div>
                Search Orders
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div className="relative">
                  <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-400 group-hover:text-neutral-600 transition-colors z-10" size={20} />
                  <input
                    type="text"
                    placeholder="Search by order ID, customer name, email, or product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-5 py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>
            </div>

            <div className="lg:w-72">
              <label className="block text-sm font-extrabold text-neutral-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="p-1.5 bg-neutral-100 rounded-lg">
                  <FiFilter size={16} className="text-neutral-700" />
                </div>
                Filter by Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'all')}
                  className="w-full px-5 py-3.5 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 font-medium appearance-none shadow-sm hover:shadow-md focus:shadow-lg pr-10"
                >
                  <option value="all" className="bg-white">All Statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status} className="bg-white">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <FiChevronDown className="text-neutral-500" size={20} />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadOrders}
                className="w-full lg:w-auto px-8 py-3.5 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl font-bold transform hover:scale-105 active:scale-95"
              >
                <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
          
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-6 pt-6 border-t-2 border-neutral-200 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-neutral-700 uppercase tracking-wide">Active filters:</span>
              {searchQuery && (
                <span className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-full text-sm font-bold flex items-center gap-2 border-2 border-neutral-200">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-neutral-200 rounded-full p-1 transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-4 py-2 bg-neutral-100 text-neutral-800 rounded-full text-sm font-bold flex items-center gap-2 border-2 border-neutral-200">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="hover:bg-neutral-200 rounded-full p-1 transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-sm text-neutral-700 hover:text-neutral-900 font-bold underline ml-auto transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Orders Table */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-neutral-200/50 p-16 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-xl font-bold text-neutral-900 mb-2">Loading orders...</p>
            <p className="text-sm text-neutral-500">Please wait while we fetch your data</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-neutral-200/50 p-16 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <FiPackage size={80} className="text-neutral-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-200 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">No orders found</h2>
            <p className="text-lg text-neutral-600 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No orders have been placed yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-neutral-200/50 animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200">
                  <tr>
                    <th className="w-24 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Order ID</th>
                    <th className="w-48 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Customer</th>
                    <th className="w-64 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Items</th>
                    <th className="w-28 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Total</th>
                    <th className="w-32 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Status</th>
                    <th className="w-36 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Date</th>
                    <th className="w-24 px-4 py-4 text-left text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {currentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-neutral-50 transition-all duration-300 group border-b border-neutral-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-extrabold text-neutral-900 font-mono tracking-tight">
                          #{order.id.replace(/^-/, '').slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                          <FiUser size={16} className="text-neutral-600 flex-shrink-0" />
                          <span className="truncate">{order.customerName || 'Guest'}</span>
                        </div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2 mt-1.5">
                          <FiMail size={14} className="text-neutral-500 flex-shrink-0" />
                          <span className="truncate">{order.customerEmail || 'No email'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900 font-bold flex items-center gap-2">
                          <FiShoppingBag size={16} className="text-neutral-600 flex-shrink-0" />
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-neutral-600 truncate mt-1.5" title={order.items.map(item => item.productName).join(', ')}>
                          {order.items.map(item => item.productName).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-extrabold text-neutral-900 flex items-center gap-2">
                          <FiDollarSign size={16} className="text-emerald-600 flex-shrink-0" />
                          ${(order.total * 1.1).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                            className={`w-full px-3 py-2 pr-7 rounded-xl text-sm font-bold border-0 focus:ring-2 focus:ring-neutral-400 outline-none transition-all duration-300 cursor-pointer appearance-none ${getStatusColor(order.status)}`}
                        >
                          {statusOptions.map((status) => (
                              <option key={status} value={status} className="bg-white text-neutral-900">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 7L1 3H9L5 7Z" fill="white"/>
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900 font-bold flex items-center gap-2">
                          <FiCalendar size={16} className="text-neutral-600 flex-shrink-0" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1.5">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-2.5 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-neutral-300"
                            title="Edit order"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-red-200"
                            title="Delete order"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-200/50 shadow-lg">
                <div className="text-sm font-semibold text-neutral-600">
                  Showing <span className="font-extrabold text-neutral-900">{indexOfFirstOrder + 1}</span> to{' '}
                  <span className="font-extrabold text-neutral-900">
                    {Math.min(indexOfLastOrder, filteredOrders.length)}
                  </span>{' '}
                  of <span className="font-extrabold text-neutral-900">{filteredOrders.length}</span> orders
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                            onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
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
          </div>
        )}

        {/* Edit Order Modal */}
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            onClose={() => setEditingOrder(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Edit Order Modal Component
interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Partial<Order>) => void;
}

const EditOrderModal = ({ order, onClose, onSave }: EditOrderModalProps) => {
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');
  const [status, setStatus] = useState<Order['status']>(order.status);
  const [items, setItems] = useState(order.items);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ productId: '', productName: '', price: 0, quantity: 1, image: '' });
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
        
        // Update items with missing images by looking up from products
        setItems(currentItems => {
          const updatedItems = currentItems.map(item => {
            if (!item.image || item.image === '') {
              const product = fetchedProducts.find(p => p.id === item.productId);
              if (product && product.image) {
                return { ...item, image: product.image };
              }
            }
            return item;
          });
          return updatedItems;
        });
      } catch (error: any) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
      }
    };
    loadProducts();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customerName,
      customerEmail,
      status,
      items,
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], quantity };
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], price };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Order must have at least one item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setNewItem({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        quantity: newItem.quantity,
        image: selectedProduct.image || '',
      });
    }
  };

  const addNewItem = () => {
    if (!newItem.productId) {
      toast.error('Please select a product');
      return;
    }
    if (newItem.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (newItem.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const itemToAdd: OrderItem = {
      productId: newItem.productId,
      productName: newItem.productName,
      price: newItem.price,
      quantity: newItem.quantity,
      image: newItem.image || '',
    };

    setItems([...items, itemToAdd]);
    setNewItem({ productId: '', productName: '', price: 0, quantity: 1, image: '' });
    setShowAddItem(false);
    toast.success('Item added to order');
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-neutral-200 animate-slide-in-up relative" style={{ zIndex: 10000 }}>
        <div className="h-full max-h-[90vh] overflow-y-auto edit-order-modal-scroll">
        <div className="sticky top-0 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b-2 border-neutral-200 px-8 py-6 flex items-center justify-between z-10">
          <h2 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-neutral-800 rounded-xl shadow-lg">
              <FiEdit className="text-white" size={24} />
            </div>
            Edit Order
          </h2>
          <button
            onClick={onClose}
            className="p-3 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-neutral-300"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-extrabold text-neutral-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <FiUser size={20} className="text-neutral-700" />
              </div>
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-5 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 placeholder-neutral-500 font-medium shadow-sm hover:shadow-md transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-neutral-900 mb-2 uppercase tracking-wide">
              Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Order['status'])}
              className="w-full px-5 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 font-medium shadow-sm hover:shadow-md transition-all"
            >
              <option value="preparing" className="bg-white">Preparing</option>
              <option value="completed" className="bg-white">Completed</option>
              <option value="cancelled" className="bg-white">Cancelled</option>
            </select>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-neutral-900 flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <FiShoppingBag size={20} className="text-neutral-700" />
                </div>
                Order Items
              </h3>
              <button
                type="button"
                onClick={() => setShowAddItem(!showAddItem)}
                className="px-6 py-3 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                <FiPlus size={16} />
                {showAddItem ? 'Cancel' : 'Add Item'}
              </button>
            </div>

            {showAddItem && (
              <div className="mb-6 p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 border-2 border-neutral-200 rounded-xl shadow-md">
                <h4 className="text-base font-extrabold text-neutral-900 mb-5 uppercase tracking-wide">Add New Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Product
                    </label>
                    <select
                      value={newItem.productId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="" className="bg-white">Select a product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id} className="bg-white">
                          {product.name} - ${product.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.price || ''}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-neutral-100 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-sm font-medium"
                      readOnly
                    />
                    <p className="text-xs text-neutral-600 mt-1.5 font-medium">Auto-filled from product</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wide">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-sm font-medium shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addNewItem}
                      disabled={!newItem.productId}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-5 bg-white rounded-xl border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-300">
                  <div className="flex-1">
                    <p className="font-bold text-neutral-900 text-base">{item.productName}</p>
                    <p className="text-sm text-neutral-600 mt-1">Product ID: {item.productId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-neutral-700">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-sm font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-neutral-700">Unit Price:</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-2 bg-white border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none text-neutral-900 text-sm font-medium"
                    />
                  </div>
                  <div className="text-right min-w-[100px] bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200">
                    <p className="text-xs font-bold text-neutral-600 mb-1 uppercase tracking-wide">Total</p>
                    <p className="font-extrabold text-neutral-900 text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 transform hover:scale-110 border-2 border-transparent hover:border-red-200"
                    title="Remove item"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl border-2 border-neutral-200 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-xl font-extrabold text-neutral-900 uppercase tracking-tight">Total:</span>
              <span className="text-3xl font-extrabold text-neutral-900">
                ${(calculateTotal() * 1.1).toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-neutral-600 mt-3 font-medium">
              Subtotal: ${calculateTotal().toFixed(2)} + Tax (10%): ${(calculateTotal() * 0.1).toFixed(2)}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 hover:bg-neutral-100 hover:border-neutral-400 transition-all duration-300 font-bold shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Save Changes
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

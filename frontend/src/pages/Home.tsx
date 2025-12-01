import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { fetchProducts } from '../services/productsService';
import { Product } from '../types/types';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import ChatWidget from '../components/ChatWidget';
import { FiShoppingCart, FiLogOut, FiSearch, FiFilter, FiPackage, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout, currentUser, isAdmin } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const isFetchingRef = useRef(false); // Prevent duplicate fetches

  useEffect(() => {
    // Prevent duplicate fetches (especially in React StrictMode)
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    let isMounted = true; // Flag to prevent state updates if component unmounts
    isFetchingRef.current = true; // Mark as fetching
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products from Firebase...');
        const fetchedProducts = await fetchProducts();
        
        // Deduplicate by ID first
        let uniqueProducts = fetchedProducts.filter((product, index, self) =>
          index === self.findIndex((p) => p.id === product.id)
        );
        
        // Also deduplicate by name+price in case same product has different IDs
        uniqueProducts = uniqueProducts.filter((product, index, self) =>
          index === self.findIndex((p) => 
            p.name === product.name && 
            p.price === product.price &&
            p.description === product.description
          )
        );
        
        console.log('Unique products after deduplication:', uniqueProducts.length);
        console.log('Product IDs:', uniqueProducts.map(p => p.id));
        
        if (isMounted) {
          setProducts(uniqueProducts);
          setFilteredProducts(uniqueProducts);
        }
      } catch (error: any) {
        if (isMounted) {
          toast.error(error.message || 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        isFetchingRef.current = false; // Reset fetching flag
      }
    };

    loadProducts();
    
    // Cleanup function
    return () => {
      isMounted = false;
      isFetchingRef.current = false; // Reset on unmount
    };
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  const handleProductCardClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-neutral-200/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight group-hover:scale-105 transition-transform duration-300">
                Merry's Way
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative">
                  <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-neutral-400 z-10 group-hover:text-neutral-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-5 py-3.5 bg-white/90 backdrop-blur-sm border-2 border-neutral-200 rounded-2xl focus:ring-2 focus:ring-neutral-400/50 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium shadow-sm hover:shadow-md focus:shadow-lg hover:border-neutral-300"
                />
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {/* Admin Dashboard Button (only for admins) */}
              {currentUser && isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="relative p-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 hover:scale-110 group"
                  aria-label="Admin Dashboard"
                  title="Admin Dashboard"
                >
                  <FiSettings size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}
              
              {/* Order History Button */}
              <button
                onClick={() => navigate('/orders')}
                className="p-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 hover:scale-110"
                aria-label="View order history"
                title="Order History"
              >
                <FiPackage size={22} />
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all duration-300 hover:scale-110"
                aria-label="View cart"
              >
                <FiShoppingCart size={22} />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-800 text-white text-xs font-extrabold rounded-full w-6 h-6 flex items-center justify-center shadow-lg pointer-events-none animate-bounce">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4 pl-4 border-l border-neutral-200">
                <span className="text-sm font-bold text-neutral-900 hidden sm:block px-3 py-1.5 bg-neutral-100 rounded-lg">
                  {currentUser?.displayName || currentUser?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-3 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                  aria-label="Logout"
                  title="Logout"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-10 flex items-center gap-4 flex-wrap bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-neutral-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 text-neutral-900">
            <div className="p-2 bg-neutral-100 rounded-xl">
              <FiFilter size={22} className="text-neutral-700" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">Category:</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                  selectedCategory === category
                    ? 'bg-neutral-900 text-white shadow-xl shadow-neutral-900/20 scale-105'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900 shadow-sm'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mb-8 text-base font-bold text-neutral-900 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block border border-neutral-200/50 shadow-md animate-fade-in">
            Showing <span className="text-neutral-800 font-extrabold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
            {filteredProducts.length !== products.length && <span className="text-neutral-600 font-medium"> (of {products.length} total)</span>}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-neutral-200 border-t-neutral-800 mx-auto mb-8"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-xl font-bold text-neutral-900 mb-2">Loading products...</p>
              <p className="text-sm text-neutral-500">Please wait while we fetch the best coffee for you</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-40 bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-xl">
            <div className="text-8xl mb-6 animate-bounce">☕</div>
            <p className="text-3xl font-extrabold text-neutral-900 mb-4 tracking-tight">No products found</p>
            <p className="text-neutral-600 max-w-md mx-auto text-lg">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Products will appear here once added to the database'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in">
            {filteredProducts.map((product) => {
              // Debug: Check for duplicate IDs in filtered list
              const duplicateCount = filteredProducts.filter(p => p.id === product.id).length;
              if (duplicateCount > 1) {
                console.warn(`⚠️ Duplicate product ID in filtered list: ${product.id} - ${product.name} (appears ${duplicateCount} times)`);
              }
              return (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onCardClick={handleProductCardClick}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Home;


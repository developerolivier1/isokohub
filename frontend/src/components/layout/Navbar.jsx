import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, User, ChevronDown, Heart, Store, LogOut, Package, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navLinks = [
  { name: 'Today\'s Deals', href: '/products?deals=true' },
  { name: 'Customer Service', href: '/help' },
  { name: 'Gift Cards', href: '/products?category=gift-cards' },
  { name: 'Sell', href: '/auth/register' },
];

const getSellHref = (isAuthenticated, isVendor) => {
  if (!isAuthenticated) return '/auth/register';
  if (isVendor) return '/vendor';
  return '/auth/register';
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, isVendor, isAdmin, isCustomer, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-4">
          <div className="flex items-center h-14 sm:h-16 gap-1 sm:gap-3">

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 hover:border hover:border-white/40 rounded">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center shrink-0 px-1 sm:px-2 py-1 hover:border hover:border-white/40 rounded">
              <img src="/assets/logo.png" alt="ISOKOHUB" className="h-10 sm:h-12 w-auto" />
            </Link>

            <div className="hidden lg:flex items-center px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer shrink-0">
              <MapPin className="h-4 w-4 text-white/70" />
              <div className="ml-1">
                <p className="text-[10px] text-white/60 leading-none">Deliver to</p>
                <p className="text-xs font-bold leading-tight">Rwanda</p>
              </div>
            </div>

            <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 hover:border hover:border-white/40 rounded ml-auto">
              <Search className="h-5 w-5" />
            </button>

            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 mx-1 lg:mx-4">
              <div className="relative w-full flex">
                <div className="relative">
                  <button type="button" onClick={() => setCatMenuOpen(!catMenuOpen)} className="flex items-center gap-1 h-full px-3 bg-gray-200 text-gray-600 text-xs rounded-l-md hover:bg-gray-300">
                    All <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ISOKOHUB"
                  className="w-full px-3 py-1.5 text-sm text-gray-900 focus:outline-none border-2 border-transparent focus:border-blue-400 min-w-0"
                />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 px-4 sm:px-6 rounded-r-md flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-gray-900" />
                </button>
              </div>
            </form>

            <div className="hidden lg:flex items-center gap-1">
              <div className="px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer">
                <div className="flex items-center gap-1">
                  <img src="https://flagcdn.com/w20/rw.png" alt="RW" className="h-4 w-6" />
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="hidden sm:block px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer text-left whitespace-nowrap">
                  <p className="text-[10px] text-white/60 leading-none">Hello, {user?.name?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs font-bold leading-tight flex items-center gap-0.5">Account & Lists <ChevronDown className="h-3 w-3" /></p>
                </button>
                <Link to="/account" className="sm:hidden px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer">
                  <User className="h-5 w-5" />
                </Link>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-20 text-gray-800">
                      <div className="p-4 bg-gray-50 rounded-t-lg border-b text-center">
                        <p className="text-sm text-gray-600">Hello, {user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        {isCustomer && (
                          <Link to="/account" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setUserMenuOpen(false)}>
                            <User className="h-4 w-4" /> My Account
                          </Link>
                        )}
                        <Link to="/account/orders" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setUserMenuOpen(false)}>
                          <Package className="h-4 w-4" /> My Orders
                        </Link>
                        <Link to="/account/wishlist" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setUserMenuOpen(false)}>
                          <Heart className="h-4 w-4" /> Wishlist
                        </Link>
                        {isVendor && (
                          <Link to="/vendor" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 border-t" onClick={() => setUserMenuOpen(false)}>
                            <Store className="h-4 w-4" /> Vendor Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 border-t" onClick={() => setUserMenuOpen(false)}>
                            <Store className="h-4 w-4" /> Admin Dashboard
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t">
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="hidden sm:block px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer text-left whitespace-nowrap">
                <p className="text-[10px] text-white/60 leading-none">Hello, Sign in</p>
                <p className="text-xs font-bold leading-tight">Account & Lists</p>
              </Link>
            )}

            {isAuthenticated && (
              <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer text-left whitespace-nowrap text-white/70 hover:text-white" title="Sign Out">
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-bold leading-tight inline">Sign Out</span>
              </button>
            )}

            <Link to="/account/orders" className="hidden lg:block px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer text-left whitespace-nowrap">
              <p className="text-[10px] text-white/60 leading-none">Returns</p>
              <p className="text-xs font-bold leading-tight">& Orders</p>
            </Link>

            <Link to="/cart" className="relative px-2 py-1 hover:border hover:border-white/40 rounded cursor-pointer flex items-end gap-0.5">
              <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 left-3.5 sm:left-4 text-blue-400 text-[10px] sm:text-xs font-bold">{itemCount > 99 ? '99+' : itemCount}</span>
              )}
              <span className="hidden sm:inline text-xs font-bold leading-none mb-0.5">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="sm:hidden bg-[#0f172a] pb-3 px-2">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ISOKOHUB"
              className="flex-1 px-3 py-2 text-sm text-gray-900 focus:outline-none rounded-l-md"
              autoFocus
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 px-4 rounded-r-md">
              <Search className="h-5 w-5 text-gray-900" />
            </button>
          </form>
        </div>
      )}

      <div className="bg-[#1e293b] text-white text-xs sm:text-sm">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-4">
          <div className="flex items-center h-9 sm:h-10 overflow-x-auto scrollbar-hide gap-0.5">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="hidden lg:flex items-center gap-1 px-2 py-1.5 hover:border hover:border-white/40 rounded font-bold shrink-0">
              <Menu className="h-4 w-4" /> All
            </button>
            {navLinks.map((link) => (
              <Link key={link.name} to={link.name === 'Sell' ? getSellHref(isAuthenticated, isVendor) : link.href} className="px-2 py-1.5 hover:border hover:border-white/40 rounded whitespace-nowrap shrink-0">
                {link.name}
              </Link>
            ))}
            <Link to="/products" className="px-2 py-1.5 hover:border hover:border-white/40 rounded whitespace-nowrap shrink-0">New Arrivals</Link>
            <Link to="/products?featured=true" className="px-2 py-1.5 hover:border hover:border-white/40 rounded whitespace-nowrap shrink-0">Best Sellers</Link>
            <span className="flex-1 min-w-0" />
            <Link to="/products" className="px-2 py-1.5 font-bold text-blue-300 hover:border hover:border-white/40 rounded whitespace-nowrap shrink-0">
              Shop now & deals <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b shadow-lg text-gray-800 max-h-[80vh] overflow-y-auto">
          <div className="py-2">
            <Link to="/products" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>All Products</Link>
            <Link to="/cart" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Cart {itemCount > 0 && `(${itemCount})`}</Link>
            {isAuthenticated ? (
              <>
                <Link to="/account" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>My Account</Link>
                <Link to="/account/orders" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>My Orders</Link>
                {isVendor && <Link to="/vendor" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Vendor Dashboard</Link>}
                {isAdmin && <Link to="/admin" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="block px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/auth/register" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Create Account</Link>
              </>
            )}
            <hr className="my-2" />
            <Link to="/products?deals=true" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Today's Deals</Link>
            <Link to="/help" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Customer Service</Link>
            <Link to="/products?category=gift-cards" className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Gift Cards</Link>
            <Link to={getSellHref(isAuthenticated, isVendor)} className="block px-4 py-2.5 text-sm hover:bg-gray-100" onClick={() => setMobileOpen(false)}>Sell</Link>
          </div>
        </div>
      )}
    </header>
  );
}

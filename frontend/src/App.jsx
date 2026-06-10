import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import VendorLayout from './layouts/VendorLayout';

import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Checkout from './pages/public/Checkout';
import SearchResults from './pages/public/SearchResults';
import PageNotFound from './pages/public/PageNotFound';
import About from './pages/public/About';
import Help from './pages/public/Help';
import VendorStorefront from './pages/public/VendorStorefront';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import CustomerDashboard from './pages/customer/Dashboard';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Wishlist from './pages/customer/Wishlist';
import Profile from './pages/customer/Profile';
import Wallet from './pages/customer/Wallet';

import VendorDashboard from './pages/vendor/Dashboard';
import ManageProducts from './pages/vendor/ManageProducts';
import AddProduct from './pages/vendor/AddProduct';
import EditProduct from './pages/vendor/EditProduct';
import VendorOrders from './pages/vendor/ManageOrders';
import VendorOrderDetail from './pages/vendor/OrderDetail';
import Analytics from './pages/vendor/Analytics';
import Payouts from './pages/vendor/Payouts';

import AdminDashboard from './pages/admin/Dashboard';
import Tenants from './pages/admin/Tenants';
import Users from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Subscriptions from './pages/admin/Subscriptions';
import SearchAnalytics from './pages/admin/SearchAnalytics';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

import LiveStreamView from './pages/features/LiveStreamView';
import SocialFeed from './pages/features/SocialFeed';
import AffiliateDashboard from './pages/features/AffiliateDashboard';
import Chat from './pages/features/Chat';
import CouponManagement from './pages/features/CouponManagement';
import DeliveryTracking from './pages/features/DeliveryTracking';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="search" element={<SearchResults />} />
        <Route path="live" element={<LiveStreamView />} />
        <Route path="live/:id" element={<LiveStreamView />} />
        <Route path="social" element={<SocialFeed />} />
        <Route path="tracking" element={<DeliveryTracking />} />
        <Route path="tracking/:orderId" element={<DeliveryTracking />} />
        <Route path="about" element={<About />} />
        <Route path="help" element={<Help />} />
        <Route path="vendors/:id" element={<VendorStorefront />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/account" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<CustomerDashboard />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="profile" element={<Profile />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="chat" element={<Chat />} />
        <Route path="affiliate" element={<AffiliateDashboard />} />
      </Route>

      <Route path="/vendor" element={<ProtectedRoute roles={['vendor']}><VendorLayout /></ProtectedRoute>}>
        <Route index element={<VendorDashboard />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/:id/edit" element={<EditProduct />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="payouts" element={<Payouts />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['tenant_admin', 'superadmin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="users" element={<Users />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="search-analytics" element={<SearchAnalytics />} />
        <Route path="coupons" element={<CouponManagement />} />
      </Route>

      <Route path="*" element={<MainLayout><PageNotFound /></MainLayout>} />
    </Routes>
  );
}

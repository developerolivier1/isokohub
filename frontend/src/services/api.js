import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-Id'] = tenantId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (data.success) {
            localStorage.setItem('token', data.data.token);
            originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  registerTenant: (data) => api.post('/auth/register-tenant', data),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (otp) => api.post('/auth/verify-otp', { otp }),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkCreate: (products) => api.post('/products/bulk', { products }),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status, note) => api.put(`/orders/${id}/status`, { status, note }),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  getStatusHistory: (id) => api.get(`/orders/${id}/status-history`),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateQuantity: (productId, quantity, variantId) => api.put(`/cart/items/${productId}`, { quantity, variantId }),
  removeItem: (productId, variantId) => api.delete(`/cart/items/${productId}`, { data: { variantId } }),
  clearCart: () => api.delete('/cart'),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addItem: (productId, variantId, price) => api.post('/wishlist/items', { productId, variantId, price }),
  removeItem: (productId, variantId) => api.delete(`/wishlist/items/${productId}`, { data: { variantId } }),
};

export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  getStatement: (params) => api.get('/wallet/statement', { params }),
  transfer: (data) => api.post('/wallet/transfer', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  getWithdrawals: () => api.get('/wallet/withdrawals'),
};

export const paymentAPI = {
  processPayment: (orderId, method) => api.post('/payments/process', { orderId, method }),
};

export const aiAPI = {
  getRecommendations: (params) => api.get('/ai/recommendations', { params }),
  search: (params) => api.get('/ai/search', { params }),
  autocomplete: (q) => api.get('/ai/autocomplete', { params: { q } }),
  getTrending: () => api.get('/ai/trending'),
  assistant: (query, context) => api.post('/ai/assistant', { query, context }),
  getFeed: () => api.get('/ai/feed'),
};

export const liveAPI = {
  getAll: (params) => api.get('/live', { params }),
  getById: (id) => api.get(`/live/${id}`),
  create: (data) => api.post('/live', data),
  update: (id, data) => api.put(`/live/${id}`, data),
  start: (id) => api.post(`/live/${id}/start`),
  end: (id) => api.post(`/live/${id}/end`),
  addProduct: (id, data) => api.post(`/live/${id}/products`, data),
  removeProduct: (id, productId) => api.delete(`/live/${id}/products/${productId}`),
  addComment: (id, message) => api.post(`/live/${id}/comments`, { message }),
  addReaction: (id, type) => api.post(`/live/${id}/reactions`, { type }),
};

export const adAPI = {
  getAll: (params) => api.get('/ads', { params }),
  getById: (id) => api.get(`/ads/${id}`),
  create: (data) => api.post('/ads', data),
  update: (id, data) => api.put(`/ads/${id}`, data),
  delete: (id) => api.delete(`/ads/${id}`),
  getPlacement: (placement, limit) => api.get('/ads/placement', { params: { placement, limit } }),
  trackClick: (id) => api.post(`/ads/${id}/click`),
  getAnalytics: (params) => api.get('/ads/analytics', { params }),
  getCampaigns: () => api.get('/campaigns'),
  getCampaign: (id) => api.get(`/campaigns/${id}`),
  createCampaign: (data) => api.post('/campaigns', data),
  updateCampaign: (id, data) => api.put(`/campaigns/${id}`, data),
};

export const logisticsAPI = {
  getWarehouses: () => api.get('/warehouses'),
  getNearestWarehouse: (longitude, latitude, maxDistance) =>
    api.get('/warehouses/nearby', { params: { longitude, latitude, maxDistance } }),
  getWarehouse: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (data) => api.post('/warehouses', data),
  updateWarehouse: (id, data) => api.put(`/warehouses/${id}`, data),
  getWarehouseInventory: (id, params) => api.get(`/warehouses/${id}/inventory`, { params }),
  updateWarehouseInventory: (id, data) => api.put(`/warehouses/${id}/inventory`, data),
  getTransfers: () => api.get('/transfers'),
  createTransfer: (data) => api.post('/transfers', data),
  approveTransfer: (id) => api.put(`/transfers/${id}/approve`),
  completeTransfer: (id) => api.put(`/transfers/${id}/complete`),
};

export const deliveryAPI = {
  getDrivers: (params) => api.get('/delivery/drivers', { params }),
  registerDriver: (data) => api.post('/delivery/drivers/register', data),
  updateLocation: (data) => api.put('/delivery/drivers/location', data),
  assignDelivery: (data) => api.post('/delivery/assign', data),
  getTracking: (orderId) => api.get(`/delivery/tracking/${orderId}`),
  updateDeliveryStatus: (orderId, data) => api.put(`/delivery/tracking/${orderId}`, data),
  verifyOTP: (orderId, otp) => api.post(`/delivery/tracking/${orderId}/verify-otp`, { otp }),
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params) => api.get('/reports/sales', { params }),
  getProducts: (params) => api.get('/reports/products', { params }),
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getCustomers: () => api.get('/reports/customers'),
  download: (params) => api.get('/reports/download', { params, responseType: 'blob' }),
  downloadInvoice: (orderId) => api.get(`/reports/invoice/${orderId}`, { responseType: 'blob' }),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

export const tenantAPI = {
  getTenant: () => api.get('/tenant'),
  updateTenant: (data) => api.put('/tenant', data),
  getSettings: () => api.get('/tenant/settings'),
  updateSetting: (data) => api.put('/tenant/settings', data),
  getStats: () => api.get('/tenant/stats'),
  getDomains: () => api.get('/tenant/domains'),
  addDomain: (data) => api.post('/tenant/domains', data),
  verifyDomain: (id) => api.post(`/tenant/domains/${id}/verify`),
  removeDomain: (id) => api.delete(`/tenant/domains/${id}`),
  getSubscription: () => api.get('/tenant/subscription'),
  updateSubscription: (data) => api.put('/tenant/subscription', data),
};

export const vendorAPI = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  verify: (id, status, rejectionReason) => api.put(`/vendors/${id}/verify`, { status, rejectionReason }),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const socialAPI = {
  getFeed: () => api.get('/social/feed'),
  createPost: (data) => api.post('/social/posts', data),
  follow: (userId) => api.post(`/social/follow/${userId}`),
  unfollow: (userId) => api.delete(`/social/follow/${userId}`),
  getFollowers: (userId) => api.get(`/social/followers/${userId}`),
  getFollowing: (userId) => api.get(`/social/following/${userId}`),
  toggleLike: (data) => api.post('/social/like', data),
};

export const affiliateAPI = {
  getDashboard: () => api.get('/affiliate/dashboard'),
  register: (data) => api.post('/affiliate/register', data),
  getCommissions: () => api.get('/affiliate/commissions'),
  withdraw: (data) => api.post('/affiliate/withdraw', data),
};

export const couponAPI = {
  getAll: () => api.get('/coupons'),
  validate: (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
  create: (data) => api.post('/coupons', data),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (userId) => api.get(`/chat/${userId}`),
  sendMessage: (userId, data) => api.post(`/chat/${userId}`, data),
};

export const uploadAPI = {
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;

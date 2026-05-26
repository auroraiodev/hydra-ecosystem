import { tokenStore } from '../utils/tokenStore';
import type { Tcg } from '../types/tcg';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Get current token from in-memory store (never touches localStorage)
    const token = tokenStore.get();

    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle Silent Refresh for 401s (excluding auth routes)
      if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        if (!this.refreshPromise) {
          this.refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
            .then(async (res) => {
              if (res.ok) {
                const refreshData = await res.json();
                if (refreshData.token) {
                  tokenStore.set(refreshData.token);
                  return refreshData.token as string;
                }
              }
              return null;
            })
            .catch(() => null)
            .finally(() => {
              this.refreshPromise = null;
            });
        }

        const newToken = await this.refreshPromise;
        if (newToken) {
          // Retry the original request
          const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          response = await fetch(url, { ...options, headers: newHeaders });
        }
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }

      throw new ApiError('An unexpected error occurred.', 500);
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async loginWithGoogle() {
    return this.request('/auth/google', {
      method: 'POST',
    });
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async updateProfile(profileData: Record<string, unknown>) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Product endpoints
  async getProducts(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      categoryIds?: string[];
      minPrice?: number;
      maxPrice?: number;
      languageIds?: string[];
      conditionIds?: string[];
      tcgIds?: string[];
      rarityIds?: string[];
      sortBy?: string;
      sortOrder?: string;
      showOnlyInStock?: boolean;
    } = {}
  ) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const query = searchParams.toString();
    return this.request(`/singles${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/singles/${id}`);
  }

  async createProduct(productData: Record<string, unknown>) {
    return this.request('/singles', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: Record<string, unknown>) {
    return this.request(`/singles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/singles/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductStats() {
    return this.request('/singles/stats');
  }

  // Cart endpoints
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: string, quantity: number) {
    return this.request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: string) {
    return this.request(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async getOrders(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData: Record<string, unknown>) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: Record<string, unknown>) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getUsers(params: { page?: number; limit?: number; search?: string } = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async updateUser(id: string, userData: Record<string, unknown>) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Category endpoints
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(categoryData: Record<string, unknown>) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: Record<string, unknown>) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification endpoints
  async getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // TCG endpoints
  async getTcgs() {
    return this.request<Tcg[]>('/tcgs');
  }

  async getActiveTcgs() {
    return this.request<Tcg[]>('/tcgs/active');
  }

  // File upload
  async uploadFile(file: File, type: 'product' | 'avatar' = 'product') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = tokenStore.get();
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...headers,
      },
    });
  }
  // Feature flags
  async getFeatureFlags() {
    return this.request<{ key: string; enabled: boolean; label: string }[]>('/feature-flags');
  }
}

// Create singleton instance
export const api = new ApiClient();

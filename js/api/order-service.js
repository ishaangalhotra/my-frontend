import { apiClient } from './api-client';

export const OrderService = {
  async placeOrder(orderData) {
    return apiClient.post('/orders', orderData);
  },

  async getSellerOrders(sellerId) {
    return apiClient.get(`/orders?seller=${sellerId}`);
  },

  async getCustomerOrders() {
    return apiClient.get('/orders/customer');
  },

  async getOrderDetails(orderId) {
    return apiClient.get(`/orders/${orderId}`);
  },

  async updateOrderStatus(orderId, status) {
    return apiClient.put(`/orders/${orderId}/status`, { status });
  }
};

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
// js/api/orders-service.js
import { api } from "./api-client.js";

export const ordersService = {
  async getOrders() {
    return api.get("/api/v1/orders/myorders");
  },
  async getOrderById(orderId) {
    return api.get(`/api/v1/orders/${orderId}`);
  }
};
// js/api/orders-service.js
import { api } from "./api-client.js";

export const ordersService = {
  async getMyOrders() {
    return api.get("/api/v1/orders/myorders");
  },
  async getOrderById(orderId) {
    return api.get(`/api/v1/orders/${orderId}`);
  }
};



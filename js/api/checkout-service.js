// js/api/checkout-service.js
import { api } from "./api-client.js";

export const checkoutService = {
  async createOrder(orderData) {
    return api.post("/api/v1/orders", orderData);
  },
  async getPaymentToken(orderId) {
    return api.get(`/api/v1/payment/token/${orderId}`);
  },
  async verifyPayment(paymentDetails) {
    return api.post("/api/v1/payment/verify", paymentDetails);
  }
};

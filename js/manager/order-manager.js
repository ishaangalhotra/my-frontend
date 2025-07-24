import { OrderService } from '../api/order-service';
import { CartManager } from './cart-manager';

export class OrderManager {
  static async placeOrder(orderData) {
    try {
      const order = await OrderService.placeOrder(orderData);
      CartManager.clearCart();
      return order;
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  static async getSellerOrders(sellerId) {
    try {
      return await OrderService.getSellerOrders(sellerId);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId, status) {
    try {
      return await OrderService.updateOrderStatus(orderId, status);
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }
}
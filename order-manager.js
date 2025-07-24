const API_BASE_URL = 'https://ecommerce-backend-8ykq.onrender.com';

export class OrderManager {
  static async placeOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) throw new Error('Order failed');
      return await response.json();
    } catch (error) {
      console.error('Order error:', error);
      throw error;
    }
  }

  static async getSellerOrders(sellerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders?seller=${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error('Fetch orders error:', error);
      throw error;
    }
  }
}
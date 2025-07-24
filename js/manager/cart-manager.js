export class CartManager {
  static getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
  }

  static addToCart(productId, quantity = 1) {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    this.updateCartCount();
    return cart;
  }

  static removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    this.updateCartCount();
    return cart;
  }

  static clearCart() {
    localStorage.removeItem('cart');
    this.updateCartCount();
  }

  static updateCartCount() {
    const count = this.getCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'block' : 'none';
    });
  }

  static getCartTotal(products) {
    const cart = this.getCart();
    return cart.reduce((total, item) => {
      const product = products.find(p => p._id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }
}
// Multi-channel Notification Service for QuickLocal
class MultiChannelNotificationService {
  constructor() {
    // FIXED: Use backend URL instead of frontend origin
    this.baseURL = window.API_CONFIG?.full || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.token = null; // FIXED: Don't use localStorage in constructor
    this.emailTemplates = new Map();
    this.smsTemplates = new Map();
    this.loadToken(); // Call loadToken on initialization
  }

  // Load token from localStorage
  loadToken() {
    try {
      let token = null;

      // Priority 1: Check the dedicated token keys
      token = localStorage.getItem('quicklocal_access_token') || 
              localStorage.getItem('supabase_access_token') ||
              localStorage.getItem('token');

      // Priority 2: Fallback to checking inside the user object (as a last resort)
      if (!token) {
        const storedUser = localStorage.getItem('quicklocal_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            token = parsed?.access_token || parsed?.token || parsed?.accessToken;
          } catch (e) {
            console.warn(`[${this.constructor.name}] Failed to parse user object:`, e);
          }
        }
      }

      this.token = token;

      if (!token) {
        console.log(`[${this.constructor.name}] No auth token found (user may not be logged in)`);
      } else {
        console.log(`[${this.constructor.name}] ✅ Auth token loaded successfully`);
      }
    } catch (error) {
      console.warn(`[${this.constructor.name}] Failed to load token:`, error);
      this.token = null;
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.warn('Unable to save token to localStorage:', error);
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // EMAIL NOTIFICATION METHODS

  // Send email notification
  async sendEmail(emailData) {
    return await this.makeRequest('/notifications/email', {
      method: 'POST',
      body: JSON.stringify({
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        body: emailData.body,
        template: emailData.template,
        templateData: emailData.templateData,
        attachments: emailData.attachments,
        priority: emailData.priority || 'normal',
        sendAt: emailData.sendAt, // For scheduled emails
        trackingEnabled: emailData.trackingEnabled !== false
      })
    });
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(orderData) {
    const emailData = {
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      template: 'order-confirmation',
      templateData: {
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        orderDate: new Date(orderData.orderDate).toLocaleDateString(),
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        estimatedDelivery: orderData.estimatedDelivery,
        trackingUrl: `${window.location.origin}/order-tracking.html?order=${orderData.orderNumber}`
      },
      priority: 'high'
    };

    return await this.sendEmail(emailData);
  }

  // Send delivery notification email
  async sendDeliveryNotificationEmail(deliveryData) {
    const emailData = {
      to: deliveryData.customerEmail,
      subject: `Your Order is Out for Delivery - ${deliveryData.orderNumber}`,
      template: 'delivery-notification',
      templateData: {
        customerName: deliveryData.customerName,
        orderNumber: deliveryData.orderNumber,
        deliveryPersonName: deliveryData.deliveryPersonName,
        deliveryPersonPhone: deliveryData.deliveryPersonPhone,
        estimatedDelivery: deliveryData.estimatedDelivery,
        trackingUrl: `${window.location.origin}/order-tracking.html?order=${deliveryData.orderNumber}`,
        liveTrackingEnabled: true
      },
      priority: 'high'
    };

    return await this.sendEmail(emailData);
  }

  // Send promotional email
  async sendPromotionalEmail(promoData) {
    const emailData = {
      to: promoData.recipients,
      subject: promoData.subject,
      template: 'promotion',
      templateData: {
        title: promoData.title,
        description: promoData.description,
        discountCode: promoData.discountCode,
        discountPercentage: promoData.discountPercentage,
        validUntil: promoData.validUntil,
        ctaUrl: promoData.ctaUrl,
        ctaText: promoData.ctaText || 'Shop Now',
        featuredProducts: promoData.featuredProducts,
        unsubscribeUrl: `${window.location.origin}/unsubscribe`
      },
      priority: 'low'
    };

    return await this.sendEmail(emailData);
  }

  // Get email templates
  async getEmailTemplates() {
    const response = await this.makeRequest('/notifications/email/templates');
    
    // Cache templates locally
    response.templates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });
    
    return response;
  }

  // Create email template
  async createEmailTemplate(templateData) {
    return await this.makeRequest('/notifications/email/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: templateData.name,
        subject: templateData.subject,
        htmlContent: templateData.htmlContent,
        textContent: templateData.textContent,
        variables: templateData.variables,
        category: templateData.category,
        description: templateData.description
      })
    });
  }

  // Get email delivery stats
  async getEmailStats(timeframe = '7d') {
    return await this.makeRequest(`/notifications/email/stats?timeframe=${timeframe}`);
  }

  // Track email opens
  async trackEmailOpen(emailId, recipientId) {
    return await this.makeRequest('/notifications/email/track/open', {
      method: 'POST',
      body: JSON.stringify({
        emailId: emailId,
        recipientId: recipientId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: 'client-side' // Server will get actual IP
      })
    });
  }

  // Track email clicks
  async trackEmailClick(emailId, recipientId, linkUrl) {
    return await this.makeRequest('/notifications/email/track/click', {
      method: 'POST',
      body: JSON.stringify({
        emailId: emailId,
        recipientId: recipientId,
        linkUrl: linkUrl,
        timestamp: new Date().toISOString()
      })
    });
  }

  // SMS NOTIFICATION METHODS

  // Send SMS notification
  async sendSMS(smsData) {
    return await this.makeRequest('/notifications/sms', {
      method: 'POST',
      body: JSON.stringify({
        to: smsData.to,
        message: smsData.message,
        template: smsData.template,
        templateData: smsData.templateData,
        priority: smsData.priority || 'normal',
        sendAt: smsData.sendAt, // For scheduled SMS
        shortUrl: smsData.shortUrl, // Enable URL shortening
        unicode: smsData.unicode || false // For emoji and special characters
      })
    });
  }

  // Send order status SMS
  async sendOrderStatusSMS(orderData, status) {
    const statusMessages = {
      confirmed: {
        template: 'order-confirmed',
        message: `Hi ${orderData.customerName}! Your order ${orderData.orderNumber} has been confirmed. Track it: {{trackingUrl}}`
      },
      preparing: {
        template: 'order-preparing',
        message: `Good news! Your order ${orderData.orderNumber} is being prepared. We'll notify you when it's ready for delivery.`
      },
      out_for_delivery: {
        template: 'out-for-delivery',
        message: `🚚 Your order ${orderData.orderNumber} is out for delivery! ETA: ${orderData.estimatedDelivery}. Track live: {{trackingUrl}}`
      },
      delivered: {
        template: 'delivered',
        message: `✅ Delivered! Your order ${orderData.orderNumber} has been delivered. Enjoy your items from QuickLocal!`
      }
    };

    const messageConfig = statusMessages[status];
    if (!messageConfig) {
      throw new Error(`Unknown order status: ${status}`);
    }

    const smsData = {
      to: orderData.customerPhone,
      template: messageConfig.template,
      templateData: {
        customerName: orderData.customerName,
        orderNumber: orderData.orderNumber,
        estimatedDelivery: orderData.estimatedDelivery,
        trackingUrl: this.shortenUrl(`${window.location.origin}/order-tracking.html?order=${orderData.orderNumber}`)
      },
      message: messageConfig.message,
      priority: status === 'delivered' || status === 'out_for_delivery' ? 'high' : 'normal',
      unicode: true, // Enable emojis
      shortUrl: true
    };

    return await this.sendSMS(smsData);
  }

  // Send delivery alert SMS
  async sendDeliveryAlertSMS(deliveryData) {
    const smsData = {
      to: deliveryData.customerPhone,
      template: 'delivery-alert',
      message: `🚚 Your delivery partner ${deliveryData.deliveryPersonName} is nearby! Order: ${deliveryData.orderNumber}. Call: ${deliveryData.deliveryPersonPhone}`,
      templateData: {
        customerName: deliveryData.customerName,
        orderNumber: deliveryData.orderNumber,
        deliveryPersonName: deliveryData.deliveryPersonName,
        deliveryPersonPhone: deliveryData.deliveryPersonPhone,
        estimatedArrival: deliveryData.estimatedArrival
      },
      priority: 'urgent',
      unicode: true
    };

    return await this.sendSMS(smsData);
  }

  // Send promotional SMS
  async sendPromotionalSMS(promoData) {
    const smsData = {
      to: promoData.recipients,
      template: 'promotion-sms',
      message: `🎉 ${promoData.title}! Use code ${promoData.discountCode} for ${promoData.discountPercentage}% off. Valid until ${promoData.validUntil}. Shop: {{shortUrl}} Reply STOP to opt out.`,
      templateData: {
        title: promoData.title,
        discountCode: promoData.discountCode,
        discountPercentage: promoData.discountPercentage,
        validUntil: new Date(promoData.validUntil).toLocaleDateString(),
        shortUrl: this.shortenUrl(promoData.ctaUrl)
      },
      priority: 'low',
      unicode: true,
      shortUrl: true
    };

    return await this.sendSMS(smsData);
  }

  // Get SMS templates
  async getSMSTemplates() {
    const response = await this.makeRequest('/notifications/sms/templates');
    
    // Cache templates locally
    response.templates.forEach(template => {
      this.smsTemplates.set(template.id, template);
    });
    
    return response;
  }

  // Create SMS template
  async createSMSTemplate(templateData) {
    return await this.makeRequest('/notifications/sms/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: templateData.name,
        content: templateData.content,
        variables: templateData.variables,
        category: templateData.category,
        description: templateData.description,
        maxLength: templateData.maxLength || 160
      })
    });
  }

  // Get SMS delivery stats
  async getSMSStats(timeframe = '7d') {
    return await this.makeRequest(`/notifications/sms/stats?timeframe=${timeframe}`);
  }

  // Handle SMS opt-out
  async handleSMSOptOut(phoneNumber) {
    return await this.makeRequest('/notifications/sms/opt-out', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        timestamp: new Date().toISOString()
      })
    });
  }

  // MULTI-CHANNEL METHODS

  // Send multi-channel notification
  async sendMultiChannelNotification(notificationData) {
    const results = {};
    
    // Send push notification
    if (notificationData.channels.includes('push') && window.pushNotificationService) {
      try {
        results.push = await window.pushNotificationService.sendPushNotification(notificationData.push);
      } catch (error) {
        results.push = { error: error.message };
      }
    }

    // Send email
    if (notificationData.channels.includes('email')) {
      try {
        results.email = await this.sendEmail(notificationData.email);
      } catch (error) {
        results.email = { error: error.message };
      }
    }

    // Send SMS
    if (notificationData.channels.includes('sms')) {
      try {
        results.sms = await this.sendSMS(notificationData.sms);
      } catch (error) {
        results.sms = { error: error.message };
      }
    }

    return results;
  }

  // Send order notification across all channels
  async sendOrderNotification(orderData, status) {
    const channels = await this.getEnabledChannels(orderData.customerId, 'order');
    
    const notificationData = {
      channels: channels,
      push: {
        title: this.getOrderStatusTitle(status),
        body: this.getOrderStatusMessage(orderData, status),
        url: `/order-tracking.html?order=${orderData.orderNumber}`,
        data: { orderId: orderData.id, status: status }
      },
      email: {
        to: orderData.customerEmail,
        subject: `${this.getOrderStatusTitle(status)} - ${orderData.orderNumber}`,
        template: `order-${status}`,
        templateData: orderData
      },
      sms: {
        to: orderData.customerPhone,
        template: `order-${status}`,
        templateData: orderData
      }
    };

    return await this.sendMultiChannelNotification(notificationData);
  }

  // Get enabled notification channels for user
  async getEnabledChannels(userId, notificationType) {
    try {
      const preferences = await window.notificationService?.getNotificationSettings();
      if (preferences && preferences[notificationType]) {
        return Object.keys(preferences[notificationType]).filter(
          channel => preferences[notificationType][channel]
        );
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
    }
    
    // Default channels if preferences not available
    return ['push', 'email'];
  }

  // UTILITY METHODS

  // Shorten URL for SMS
  shortenUrl(url) {
    // In a real implementation, this would use a URL shortening service
    // For demo purposes, we'll just return the original URL
    return url;
  }

  // Get order status title
  getOrderStatusTitle(status) {
    const titles = {
      pending: 'Order Received',
      confirmed: 'Order Confirmed! 🎉',
      preparing: 'Order Being Prepared 👨‍🍳',
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Order Picked Up',
      out_for_delivery: 'Out for Delivery! 🚚',
      delivered: 'Order Delivered! ✅',
      cancelled: 'Order Cancelled'
    };
    return titles[status] || 'Order Update';
  }

  // Get order status message
  getOrderStatusMessage(orderData, status) {
    const messages = {
      pending: 'Your order has been received and is being processed.',
      confirmed: `Your order ${orderData.orderNumber} has been confirmed and will be prepared soon.`,
      preparing: 'Your order is being prepared with care by our partner.',
      ready_for_pickup: 'Your order is ready and waiting for our delivery partner.',
      picked_up: 'Your order has been picked up and is on its way to our delivery hub.',
      out_for_delivery: `Your order is out for delivery! Estimated arrival: ${orderData.estimatedDelivery || 'soon'}.`,
      delivered: 'Your order has been successfully delivered. Enjoy your items!',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact support.'
    };
    return messages[status] || 'Your order status has been updated.';
  }

  // Validate email address
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number
  validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Format phone number for SMS
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Assume US if 10 digits
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  // Get notification analytics
  async getMultiChannelAnalytics(timeframe = '7d') {
    const [emailStats, smsStats, pushStats] = await Promise.allSettled([
      this.getEmailStats(timeframe),
      this.getSMSStats(timeframe),
      window.pushNotificationService?.getPushStats(timeframe)
    ]);

    return {
      email: emailStats.status === 'fulfilled' ? emailStats.value : null,
      sms: smsStats.status === 'fulfilled' ? smsStats.value : null,
      push: pushStats.status === 'fulfilled' ? pushStats.value : null,
      timeframe: timeframe,
      generatedAt: new Date().toISOString()
    };
  }

  // Bulk send notifications
  async bulkSendNotifications(notifications) {
    const results = [];
    const batchSize = 100; // Process in batches to avoid overwhelming the server
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(notification => this.sendMultiChannelNotification(notification))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Schedule notification
  async scheduleNotification(notificationData, scheduleTime) {
    return await this.makeRequest('/notifications/schedule', {
      method: 'POST',
      body: JSON.stringify({
        ...notificationData,
        scheduleTime: scheduleTime.toISOString(),
        channels: notificationData.channels || ['push', 'email']
      })
    });
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId) {
    return await this.makeRequest(`/notifications/schedule/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // Get delivery performance by channel
  async getChannelPerformance(timeframe = '30d') {
    return await this.makeRequest(`/notifications/analytics/channel-performance?timeframe=${timeframe}`);
  }

  // A/B test notifications
  async createABTest(testData) {
    return await this.makeRequest('/notifications/ab-test', {
      method: 'POST',
      body: JSON.stringify({
        name: testData.name,
        description: testData.description,
        variants: testData.variants,
        splitPercentage: testData.splitPercentage || 50,
        successMetric: testData.successMetric || 'open_rate',
        duration: testData.duration || '7d'
      })
    });
  }

  // Initialize multi-channel service
  async initialize() {
    try {
      // Reload token in case it was set after construction
      this.loadToken();

      // Check if we actually have a token before making API calls
      if (!this.token) {
        console.log('[MultiChannelNotificationService] Skipping initialization - no auth token available');
        return false;
      }

      // Load templates (with graceful failure)
      try {
        await this.getEmailTemplates();
        console.log('[MultiChannelNotificationService] ✅ Email templates loaded');
      } catch (error) {
        console.log('[MultiChannelNotificationService] Email templates not available:', error.message);
      }

      try {
        await this.getSMSTemplates();
        console.log('[MultiChannelNotificationService] ✅ SMS templates loaded');
      } catch (error) {
        console.log('[MultiChannelNotificationService] SMS templates not available:', error.message);
      }

      console.log('[MultiChannelNotificationService] ✅ Successfully initialized');
      return true;
    } catch (error) {
      console.error('[MultiChannelNotificationService] Failed to initialize:', error);
      return false;
    }
  }
}

// Create global instance
window.multiChannelNotificationService = new MultiChannelNotificationService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.multiChannelNotificationService) {
    window.multiChannelNotificationService.initialize();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiChannelNotificationService;
}
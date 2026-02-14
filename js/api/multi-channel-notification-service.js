// Multi-channel Notification Service for QuickLocal
class MultiChannelNotificationService {
  constructor() {
    this.baseURL = window.API_CONFIG?.full || '/api/v1';
    this.emailTemplates = new Map();
    this.smsTemplates = new Map();
    // FIXED: Removed all internal token management (this.token, loadToken)
  }

  // FIXED: Replaced entire makeRequest with HybridAuthClient.apiCall
  async makeRequest(endpoint, options = {}) {
    if (!window.HybridAuthClient) {
      console.error('HybridAuthClient is not available!');
      throw new Error('Authentication client not found');
    }
    
    try {
      // Clean the endpoint: apiCall expects 'notifications/email/templates', not '/notifications/email/templates'
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

      const response = await window.HybridAuthClient.apiCall(cleanEndpoint, options);
      
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
  // (All methods below like sendEmail, sendOrderConfirmationEmail, etc.,
  // will now work correctly as they all rely on the fixed makeRequest)

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
        sendAt: emailData.sendAt,
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
    if (response.data && Array.isArray(response.data)) { // FIXED: Access data property based on backend response
      response.data.forEach(template => {
        this.emailTemplates.set(template.id, template);
      });
    }
    
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
        ipAddress: 'client-side'
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
        sendAt: smsData.sendAt,
        shortUrl: smsData.shortUrl,
        unicode: smsData.unicode || false
      })
    });
  }

  // Send order status SMS
  async sendOrderStatusSMS(orderData, status) {
    // ... (rest of the method is unchanged, it relies on sendSMS)
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
    if (response.data && Array.isArray(response.data)) { // FIXED: Access data property
      response.data.forEach(template => {
        this.smsTemplates.set(template.id, template);
      });
    }
    
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
    // ... (This method is unchanged, it relies on other fixed methods)
    const results = {};
    
    if (notificationData.channels.includes('push') && window.pushNotificationService) {
      try {
        results.push = await window.pushNotificationService.sendPushNotification(notificationData.push);
      } catch (error) {
        results.push = { error: error.message };
      }
    }

    if (notificationData.channels.includes('email')) {
      try {
        results.email = await this.sendEmail(notificationData.email);
      } catch (error) {
        results.email = { error: error.message };
      }
    }

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
    // ... (This method is unchanged)
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
      // FIXED: Use window.notificationService
      const response = await window.notificationService?.getNotificationSettings();
      const preferences = response?.data?.settings;
      if (preferences && preferences[notificationType]) {
        return Object.keys(preferences[notificationType]).filter(
          channel => preferences[notificationType][channel]
        );
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
    }
    
    return ['push', 'email']; // Default
  }

  // UTILITY METHODS
  // (All utility methods are unchanged)

  shortenUrl(url) {
    return url;
  }

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

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  }

  async getMultiChannelAnalytics(timeframe = '7d') {
    // ... (unchanged)
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

  async bulkSendNotifications(notifications) {
    // ... (unchanged)
    const results = [];
    const batchSize = 100;
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(notification => this.sendMultiChannelNotification(notification))
      );
      
      results.push(...batchResults);
      
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

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

  async cancelScheduledNotification(notificationId) {
    return await this.makeRequest(`/notifications/schedule/${notificationId}`, {
      method: 'DELETE'
    });
  }

  async getChannelPerformance(timeframe = '30d') {
    return await this.makeRequest(`/notifications/analytics/channel-performance?timeframe=${timeframe}`);
  }

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
      // FIXED: Check auth status using the central client
      if (!window.HybridAuthClient || !window.HybridAuthClient.getCurrentUser()) {
        console.log('[MultiChannelNotificationService] Skipping initialization - no authenticated user');
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
  // Initialization is now handled by the 'auth-ready' event in marketplace.html
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiChannelNotificationService;
}
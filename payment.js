// ============================================================================
// QUICKLOCAL PAYMENT CLIENT - Frontend Payment Processing
// ============================================================================

class QuickLocalPayments {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'https://ecommerce-backend-8ykq.onrender.com/api/v1';
        this.razorpayKeyId = options.razorpayKeyId || null;
        this.stripeKeyId = options.stripeKeyId || null;
        this.currency = options.currency || 'INR';
        this.debug = options.debug || false;
        
        this.stripe = null;
        this.razorpay = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 QuickLocal Payments initializing...');
        
        // Load payment methods from server
        await this.loadPaymentMethods();
        
        // Initialize payment gateways
        await this.initializeGateways();
        
        console.log('✅ QuickLocal Payments ready');
    }

    // ============================================================================
    // INITIALIZATION METHODS
    // ============================================================================

    async loadPaymentMethods() {
        try {
            const response = await fetch(`${this.apiUrl}/payment/methods`);
            const result = await response.json();
            
            if (result.success) {
                this.availableMethods = result.data.availableMethods;
                this.platformCommission = result.data.platformCommission;
                this.paymentGatewayFee = result.data.paymentGatewayFee;
                
                this.log('Available payment methods loaded:', this.availableMethods);
            }
        } catch (error) {
            console.error('Failed to load payment methods:', error);
        }
    }

    async initializeGateways() {
        // Initialize Razorpay if available
        if (this.isRazorpayAvailable()) {
            await this.initializeRazorpay();
        }

        // Initialize Stripe if available
        if (this.isStripeAvailable()) {
            await this.initializeStripe();
        }
    }

    async initializeRazorpay() {
        try {
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                await this.loadScript('https://checkout.razorpay.com/v1/checkout.js');
            }
            
            this.razorpay = window.Razorpay;
            this.log('Razorpay initialized');
        } catch (error) {
            console.error('Failed to initialize Razorpay:', error);
        }
    }

    async initializeStripe() {
        try {
            // Load Stripe script if not already loaded
            if (!window.Stripe) {
                await this.loadScript('https://js.stripe.com/v3/');
            }
            
            if (this.stripeKeyId) {
                this.stripe = window.Stripe(this.stripeKeyId);
                this.log('Stripe initialized');
            }
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    }

    // ============================================================================
    // RAZORPAY PAYMENT PROCESSING
    // ============================================================================

    async processRazorpayPayment(orderData) {
        try {
            this.log('Processing Razorpay payment:', orderData);

            // Step 1: Create Razorpay order
            const razorpayOrder = await this.createRazorpayOrder(orderData);
            
            if (!razorpayOrder.success) {
                throw new Error(razorpayOrder.message);
            }

            // Step 2: Open Razorpay checkout
            const paymentResult = await this.openRazorpayCheckout(razorpayOrder.data, orderData);
            
            // Step 3: Verify payment
            const verificationResult = await this.verifyRazorpayPayment(paymentResult, orderData.orderId);
            
            return verificationResult;

        } catch (error) {
            console.error('Razorpay payment failed:', error);
            throw error;
        }
    }

    async createRazorpayOrder(orderData) {
        const response = await fetch(`${this.apiUrl}/payment/razorpay/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(orderData)
        });

        return await response.json();
    }

    async openRazorpayCheckout(razorpayOrder, orderData) {
        return new Promise((resolve, reject) => {
            const options = {
                key: this.razorpayKeyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'QuickLocal',
                description: `Order #${orderData.orderId}`,
                order_id: razorpayOrder.orderId,
                
                // Customer details
                prefill: {
                    name: orderData.customerName,
                    email: orderData.customerEmail,
                    contact: orderData.customerPhone || ''
                },

                // Success handler
                handler: function(response) {
                    resolve({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                },

                // Modal options
                modal: {
                    ondismiss: function() {
                        reject(new Error('Payment cancelled by user'));
                    }
                },

                theme: {
                    color: '#3399cc'
                }
            };

            const rzp = new this.razorpay(options);
            rzp.open();
        });
    }

    async verifyRazorpayPayment(paymentResult, orderId) {
        const response = await fetch(`${this.apiUrl}/payment/razorpay/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                ...paymentResult,
                orderId: orderId
            })
        });

        return await response.json();
    }

    // ============================================================================
    // STRIPE PAYMENT PROCESSING
    // ============================================================================

    async processStripePayment(orderData) {
        try {
            this.log('Processing Stripe payment:', orderData);

            // Step 1: Create payment intent
            const paymentIntent = await this.createStripePaymentIntent(orderData);
            
            if (!paymentIntent.success) {
                throw new Error(paymentIntent.message);
            }

            // Step 2: Confirm payment
            const confirmationResult = await this.confirmStripePayment(paymentIntent.data.clientSecret);
            
            // Step 3: Update order status
            if (confirmationResult.paymentIntent.status === 'succeeded') {
                await this.confirmStripePaymentOnServer(
                    confirmationResult.paymentIntent.id, 
                    orderData.orderId
                );
            }

            return {
                success: true,
                paymentIntent: confirmationResult.paymentIntent
            };

        } catch (error) {
            console.error('Stripe payment failed:', error);
            throw error;
        }
    }

    async createStripePaymentIntent(orderData) {
        const response = await fetch(`${this.apiUrl}/payment/stripe/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(orderData)
        });

        return await response.json();
    }

    async confirmStripePayment(clientSecret) {
        const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: this.cardElement, // You'll need to create this element
                billing_details: {
                    name: 'Customer Name', // Get from form
                }
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        return { paymentIntent };
    }

    async confirmStripePaymentOnServer(paymentIntentId, orderId) {
        const response = await fetch(`${this.apiUrl}/payment/stripe/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                paymentIntentId,
                orderId
            })
        });

        return await response.json();
    }

    // ============================================================================
    // PAYMENT METHOD SELECTION
    // ============================================================================

    async processPayment(orderData, paymentMethod = 'auto') {
        try {
            // Auto-select payment method based on location/currency
            if (paymentMethod === 'auto') {
                paymentMethod = this.selectOptimalPaymentMethod(orderData);
            }

            switch (paymentMethod) {
                case 'razorpay':
                    return await this.processRazorpayPayment(orderData);
                
                case 'stripe':
                    return await this.processStripePayment(orderData);
                
                default:
                    throw new Error('Unsupported payment method');
            }

        } catch (error) {
            this.handlePaymentError(error, orderData);
            throw error;
        }
    }

    selectOptimalPaymentMethod(orderData) {
        const currency = orderData.currency || this.currency;
        
        // Use Razorpay for INR, Stripe for others
        if (currency === 'INR' && this.isRazorpayAvailable()) {
            return 'razorpay';
        } else if (this.isStripeAvailable()) {
            return 'stripe';
        }
        
        throw new Error('No payment method available');
    }

    // ============================================================================
    // REFUND PROCESSING
    // ============================================================================

    async processRefund(refundData) {
        try {
            const { paymentMethod, paymentId, amount, orderId, reason } = refundData;
            
            let endpoint;
            let payload;

            if (paymentMethod === 'razorpay') {
                endpoint = `${this.apiUrl}/payment/refund/razorpay`;
                payload = { paymentId, amount, orderId, reason };
            } else if (paymentMethod === 'stripe') {
                endpoint = `${this.apiUrl}/payment/refund/stripe`;
                payload = { paymentIntentId: paymentId, amount, orderId, reason };
            } else {
                throw new Error('Unsupported payment method for refund');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(payload)
            });

            return await response.json();

        } catch (error) {
            console.error('Refund processing failed:', error);
            throw error;
        }
    }

    // ============================================================================
    // PAYMENT STATUS & ANALYTICS
    // ============================================================================

    async getPaymentStatus(orderId) {
        try {
            const response = await fetch(`${this.apiUrl}/payment/status/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            return await response.json();

        } catch (error) {
            console.error('Failed to get payment status:', error);
            throw error;
        }
    }

    async getPaymentAnalytics(startDate, endDate) {
        try {
            let url = `${this.apiUrl}/payment/analytics`;
            
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            return await response.json();

        } catch (error) {
            console.error('Failed to get payment analytics:', error);
            throw error;
        }
    }

    // ============================================================================
    // UI HELPER METHODS
    // ============================================================================

    showPaymentModal(orderData, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-modal-content">
                <div class="payment-header">
                    <h3>Complete Payment</h3>
                    <button class="close-btn">&times;</button>
                </div>
                
                <div class="order-summary">
                    <h4>Order Summary</h4>
                    <div class="order-details">
                        <p>Order ID: ${orderData.orderId}</p>
                        <p>Amount: ₹${orderData.amount}</p>
                        <p>Customer: ${orderData.customerName}</p>
                    </div>
                </div>

                <div class="payment-methods">
                    <h4>Select Payment Method</h4>
                    ${this.renderPaymentMethodButtons()}
                </div>

                <div class="payment-processing" style="display: none;">
                    <div class="spinner"></div>
                    <p>Processing payment...</p>
                </div>
            </div>
        `;

        // Add event listeners
        this.addPaymentModalListeners(modal, orderData);

        document.body.appendChild(modal);
        return modal;
    }

    renderPaymentMethodButtons() {
        let buttons = '';

        if (this.isRazorpayAvailable()) {
            buttons += `
                <button class="payment-btn razorpay-btn" data-method="razorpay">
                    <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay">
                    Pay with Razorpay
                </button>
            `;
        }

        if (this.isStripeAvailable()) {
            buttons += `
                <button class="payment-btn stripe-btn" data-method="stripe">
                    <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe">
                    Pay with Stripe
                </button>
            `;
        }

        return buttons;
    }

    addPaymentModalListeners(modal, orderData) {
        // Close button
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.closePaymentModal(modal);
        });

        // Payment method buttons
        modal.querySelectorAll('.payment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const method = e.target.dataset.method;
                await this.handleModalPayment(modal, orderData, method);
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePaymentModal(modal);
            }
        });
    }

    async handleModalPayment(modal, orderData, method) {
        try {
            this.showPaymentProcessing(modal);

            const result = await this.processPayment(orderData, method);

            if (result.success) {
                this.showPaymentSuccess(modal, result);
                setTimeout(() => this.closePaymentModal(modal), 3000);
            } else {
                this.showPaymentError(modal, result.message);
            }

        } catch (error) {
            this.showPaymentError(modal, error.message);
        }
    }

    showPaymentProcessing(modal) {
        modal.querySelector('.payment-methods').style.display = 'none';
        modal.querySelector('.payment-processing').style.display = 'block';
    }

    showPaymentSuccess(modal, result) {
        modal.querySelector('.payment-processing').innerHTML = `
            <div class="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Transaction ID: ${result.payment?.id}</p>
            <p>Amount: ₹${result.payment?.amount}</p>
        `;
    }

    showPaymentError(modal, message) {
        modal.querySelector('.payment-processing').innerHTML = `
            <div class="error-icon">❌</div>
            <h3>Payment Failed</h3>
            <p>${message}</p>
            <button class="retry-btn">Try Again</button>
        `;

        modal.querySelector('.retry-btn').addEventListener('click', () => {
            modal.querySelector('.payment-methods').style.display = 'block';
            modal.querySelector('.payment-processing').style.display = 'none';
        });
    }

    closePaymentModal(modal) {
        modal.remove();
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    isRazorpayAvailable() {
        return this.availableMethods?.some(method => method.provider === 'razorpay');
    }

    isStripeAvailable() {
        return this.availableMethods?.some(method => method.provider === 'stripe');
    }

    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    handlePaymentError(error, orderData) {
        console.error('Payment Error:', {
            error: error.message,
            orderData,
            timestamp: new Date().toISOString()
        });

        // You can implement error tracking here
        // this.trackPaymentError(error, orderData);
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[QuickLocal Payments] ${message}`, data);
        }
    }

    // ============================================================================
    // FORMATTING HELPERS
    // ============================================================================

    formatAmount(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    calculateFees(amount) {
        const gatewayFee = amount * this.paymentGatewayFee;
        const platformFee = amount * this.platformCommission;
        const totalFees = gatewayFee + platformFee;
        
        return {
            gatewayFee,
            platformFee,
            totalFees,
            netAmount: amount - totalFees
        };
    }
}

// ============================================================================
// QUICK SETUP FUNCTIONS
// ============================================================================

// Easy setup for basic usage
window.initQuickLocalPayments = function(options = {}) {
    const defaultOptions = {
        apiUrl: 'https://ecommerce-backend-8ykq.onrender.com/api/v1',
        debug: false
    };

    return new QuickLocalPayments({ ...defaultOptions, ...options });
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickLocalPayments;
}

// ============================================================================
// CSS STYLES (Add to your stylesheet)
// ============================================================================

const paymentStyles = `
<style>
.payment-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.payment-modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
}

.order-summary {
    margin-bottom: 20px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 5px;
}

.payment-methods {
    margin-bottom: 20px;
}

.payment-btn {
    width: 100%;
    padding: 15px;
    margin: 10px 0;
    border: 2px solid #ddd;
    border-radius: 5px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s ease;
}

.payment-btn:hover {
    border-color: #007cba;
    background: #f0f8ff;
}

.payment-btn img {
    width: 24px;
    height: 24px;
}

.payment-processing {
    text-align: center;
    padding: 40px 20px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007cba;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.success-icon, .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.retry-btn {
    background: #007cba;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 15px;
}
</style>
`;

// Inject styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', paymentStyles);
}
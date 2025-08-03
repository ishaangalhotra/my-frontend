// order-success.js - Dedicated script for order success page
const ORDER_API = "https://quicklocal-backend.onrender.com/api/v1/orders";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Order success page loaded");
    loadOrderSuccessData();
});

function loadOrderSuccessData() {
    console.log("Loading order success data...");
    
    // First try to get order data from localStorage
    const recentOrder = JSON.parse(localStorage.getItem("recent_order"));
    
    if (recentOrder) {
        console.log("Found recent order data:", recentOrder);
        displayOrderData(recentOrder);
        displayOrderItems(recentOrder);
        displayShippingAddress(recentOrder);
    } else {
        console.log("No recent order found, checking URL parameters...");
        
        // Try to get order ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        
        if (orderId) {
            console.log("Found order ID in URL:", orderId);
            fetchOrderFromAPI(orderId);
        } else {
            console.log("No order data found, redirecting to marketplace");
            showNotification("Order details not found. Redirecting to marketplace...", "error");
            setTimeout(() => {
                window.location.href = "marketplace.html";
            }, 3000);
        }
    }
}

function displayOrderData(orderData) {
    console.log("Displaying order data:", orderData);
    
    // Update order details
    const orderIdElement = document.getElementById('order-id');
    if (orderIdElement) {
        orderIdElement.textContent = orderData.orderId || 'N/A';
    }
    
    // Update order date
    const orderDateElement = document.getElementById('order-date');
    if (orderDateElement && orderData.orderDate) {
        const orderDate = new Date(orderData.orderDate);
        orderDateElement.textContent = orderDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Update payment method
    const paymentMethodElement = document.getElementById('payment-method');
    if (paymentMethodElement) {
        paymentMethodElement.textContent = 
            orderData.paymentMethod ? formatPaymentMethod(orderData.paymentMethod) : 'N/A';
    }

    // Calculate and update totals
    if (orderData.orderTotal) {
        updateOrderTotals(orderData.orderTotal);
    }
}

function displayOrderItems(orderData) {
    console.log("Displaying order items");
    
    const orderItemsContainer = document.getElementById('order-items');
    if (!orderItemsContainer) return;

    if (!orderData.items || orderData.items.length === 0) {
        orderItemsContainer.innerHTML = '<p>No items found in this order.</p>';
        return;
    }

    // Get cart data for item details (name, image, etc.)
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    
    orderItemsContainer.innerHTML = orderData.items.map(item => {
        // Try to find matching cart item for display details
        const cartItem = cart.find(c => c._id === item.product) || {};
        
        const itemName = cartItem.name || item.name || 'Product';
        const itemPrice = item.price || cartItem.price || 0;
        const itemQuantity = item.quantity || 1;
        const itemTotal = itemPrice * itemQuantity;
        const itemImage = cartItem.image || 'https://via.placeholder.com/60x60?text=Product';
        
        return `
            <div class="order-item">
                <div style="display: flex; align-items: center;">
                    <div class="item-image">
                        <img src="${itemImage}" alt="${escapeHtml(itemName)}" 
                             onerror="this.src='https://via.placeholder.com/60x60?text=Product'">
                    </div>
                    <div class="item-info">
                        <h4>${escapeHtml(itemName)}</h4>
                        <p>Quantity: ${itemQuantity} × ₹${itemPrice.toFixed(2)}</p>
                    </div>
                </div>
                <div class="item-price">₹${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

function displayShippingAddress(orderData) {
    console.log("Displaying shipping address");
    
    const shippingAddressContainer = document.getElementById('shipping-address');
    if (!shippingAddressContainer) return;

    if (!orderData.shippingAddress) {
        shippingAddressContainer.innerHTML = `
            <h3>📍 Shipping Address</h3>
            <p>Address information not available</p>
        `;
        return;
    }

    const address = orderData.shippingAddress;
    shippingAddressContainer.innerHTML = `
        <h3>📍 Shipping Address</h3>
        <div class="address-details">
            <p><strong>Name:</strong> ${escapeHtml(address.name || 'N/A')}</p>
            <p><strong>Email:</strong> ${escapeHtml(address.email || 'N/A')}</p>
            <p><strong>Phone:</strong> ${escapeHtml(address.phone || 'N/A')}</p>
            <p><strong>Address:</strong><br>
                ${escapeHtml(address.address || 'N/A')}<br>
                ${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.pincode || '')}<br>
                ${escapeHtml(address.country || '')}
            </p>
        </div>
    `;
}

function updateOrderTotals(orderTotal) {
    console.log("Updating order totals:", orderTotal);
    
    // Calculate breakdown (approximate)
    const shipping = orderTotal > 500 ? 0 : 50;
    const taxRate = 0.18;
    const subtotalWithShipping = orderTotal - shipping;
    const subtotal = subtotalWithShipping / (1 + taxRate);
    const tax = subtotalWithShipping - subtotal;
    
    // Update elements
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    }
    
    const shippingElement = document.getElementById('shipping');
    if (shippingElement) {
        shippingElement.textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;
    }
    
    const taxElement = document.getElementById('tax');
    if (taxElement) {
        taxElement.textContent = `₹${tax.toFixed(2)}`;
    }
    
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = `₹${orderTotal.toFixed(2)}`;
    }
}

async function fetchOrderFromAPI(orderId) {
    console.log("Fetching order from API:", orderId);
    
    try {
        const user = JSON.parse(localStorage.getItem("quicklocal_user"));
        if (!user || !user.token) {
            throw new Error("User not authenticated");
        }

        const response = await fetch(`${ORDER_API}/${orderId}`, {
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch order: ${response.status}`);
        }

        const orderData = await response.json();
        console.log("Fetched order data from API:", orderData);
        
        displayOrderData(orderData);
        displayOrderItems(orderData);
        displayShippingAddress(orderData);
        
    } catch (error) {
        console.error("Error fetching order from API:", error);
        showNotification("Failed to load order details", "error");
        setTimeout(() => {
            window.location.href = "marketplace.html";
        }, 3000);
    }
}

async function refreshOrderStatus() {
    console.log("Refreshing order status...");
    
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    let orderIdToUse = orderId;
    if (!orderIdToUse) {
        const recentOrder = JSON.parse(localStorage.getItem("recent_order"));
        orderIdToUse = recentOrder?.orderId;
    }
    
    if (!orderIdToUse) {
        showNotification("Order ID not found", "error");
        return;
    }

    try {
        showNotification("Refreshing order status...", "info");
        
        const user = JSON.parse(localStorage.getItem("quicklocal_user"));
        if (!user || !user.token) {
            throw new Error("User not authenticated");
        }

        const response = await fetch(`${ORDER_API}/${orderIdToUse}`, {
            headers: {
                "Authorization": `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh order: ${response.status}`);
        }

        const orderData = await response.json();
        console.log("Refreshed order data:", orderData);
        
        // Update status
        const statusElement = document.getElementById("order-status");
        if (statusElement && orderData.status) {
            statusElement.textContent = orderData.status.toUpperCase();
            statusElement.className = `status status-${orderData.status.toLowerCase()}`;
        }

        // Update estimated delivery if available
        const deliveryElement = document.getElementById("estimated-delivery");
        if (deliveryElement && orderData.estimatedDelivery) {
            const deliveryDate = new Date(orderData.estimatedDelivery);
            deliveryElement.textContent = deliveryDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        showNotification("Order status updated!", "success");
        
    } catch (error) {
        console.error("Error refreshing order status:", error);
        showNotification("Failed to refresh order status", "error");
    }
}

function downloadInvoice() {
    console.log("Downloading invoice...");
    
    const recentOrder = JSON.parse(localStorage.getItem("recent_order"));
    if (!recentOrder) {
        showNotification("Order details not found for invoice", "error");
        return;
    }

    generateInvoice(recentOrder);
}

function generateInvoice(orderData) {
    console.log("Generating invoice for order:", orderData.orderId);
    
    // Create invoice content
    let itemsList = '';
    if (orderData.items && orderData.items.length > 0) {
        itemsList = orderData.items.map(item => {
            const itemName = item.name || 'Product';
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemTotal = itemPrice * itemQuantity;
            return `- ${itemName} x${itemQuantity} = ₹${itemTotal.toFixed(2)}`;
        }).join('\n');
    } else {
        itemsList = 'No items found';
    }
    
    const invoiceContent = `
QUICKLOCAL INVOICE
==================

Order ID: ${orderData.orderId || 'N/A'}
Date: ${orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : 'N/A'}

Customer Information:
--------------------
Name: ${orderData.shippingAddress?.name || 'N/A'}
Email: ${orderData.shippingAddress?.email || 'N/A'}
Phone: ${orderData.shippingAddress?.phone || 'N/A'}

Shipping Address:
----------------
${orderData.shippingAddress?.address || 'N/A'}
${orderData.shippingAddress?.city || ''}, ${orderData.shippingAddress?.state || ''} ${orderData.shippingAddress?.pincode || ''}
${orderData.shippingAddress?.country || ''}

Order Items:
-----------
${itemsList}

Payment Details:
---------------
Payment Method: ${orderData.paymentMethod ? formatPaymentMethod(orderData.paymentMethod) : 'N/A'}
Total Amount: ₹${orderData.orderTotal?.toFixed(2) || '0.00'}

Thank you for shopping with QuickLocal!
Visit us at: https://quicklocal.com
    `;
    
    // Create and download the invoice
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QuickLocal_Invoice_${orderData.orderId || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification("Invoice downloaded successfully!", "success");
}

// Utility functions
function formatPaymentMethod(method) {
    const methodMap = {
        'card': 'Credit/Debit Card',
        'upi': 'UPI Payment',
        'netbanking': 'Net Banking',
        'cod': 'Cash on Delivery'
    };
    return methodMap[method] || method.toUpperCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}
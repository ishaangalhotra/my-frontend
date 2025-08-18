// Enhanced Socket.IO client wrapper with better error handling and browser compatibility
// Works with both ES6 modules and traditional script tags

class SocketClient {
  constructor(config = {}) {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.handlers = new Map();
    this.config = {
      reconnectionAttempts: 5,
      timeout: 20000,
      ...config
    };
    
    // Bind methods to preserve context
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleConnectError = this.handleConnectError.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  async connect() {
    if (this.socket) {
      console.log('Socket already exists, skipping connection');
      return;
    }

    // Check if Socket.IO is available
    if (typeof io === 'undefined') {
      console.error('Socket.IO client not found. Please include the Socket.IO script.');
      this._emitLocal('error', new Error('Socket.IO client not available'));
      return;
    }

    try {
      // Get configuration (support both window.APP_CONFIG and passed config)
      const appConfig = this.getAppConfig();
      const socketUrl = this.config.socketUrl || 
                       (appConfig && appConfig.SOCKET_URL) || 
                       window.location.origin;

      console.log(`🔌 Connecting to socket at: ${socketUrl}`);

      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.config.reconnectionAttempts,
        timeout: this.config.timeout,
        withCredentials: true,
        // Add some additional options for better compatibility
        upgrade: true,
        rememberUpgrade: false
      });

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      this._emitLocal('error', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('connect_error', this.handleConnectError);
    this.socket.on('error', this.handleError);

    // Handle authentication responses
    this.socket.on('authenticated', (data) => {
      this.authenticated = true;
      console.log('✅ Socket authenticated successfully');
      this._emitLocal('authenticated', data);
    });

    this.socket.on('authentication_error', (error) => {
      this.authenticated = false;
      console.error('❌ Socket authentication failed:', error);
      this._emitLocal('authentication_error', error);
    });
  }

  handleConnect() {
    this.connected = true;
    console.log('✅ Socket connected');
    
    // Auto-authenticate if we have a stored token
    const token = this.getStoredToken();
    if (token) {
      console.log('🔐 Auto-authenticating with stored token');
      this.authenticate(token);
    }
    
    this._emitLocal('status', { connected: true });
    this._emitLocal('connect', { timestamp: Date.now() });
  }

  handleDisconnect(reason) {
    this.connected = false;
    this.authenticated = false;
    console.log('❌ Socket disconnected:', reason);
    this._emitLocal('status', { connected: false, reason });
    this._emitLocal('disconnect', { reason, timestamp: Date.now() });
  }

  handleConnectError(error) {
    console.error('🔥 Socket connection error:', error);
    this._emitLocal('connect_error', error);
    this._emitLocal('error', error);
  }

  handleError(error) {
    console.error('🚨 Socket error:', error);
    this._emitLocal('error', error);
  }

  disconnect() {
    if (!this.socket) return;
    
    console.log('🔌 Disconnecting socket');
    
    // Remove event listeners
    this.socket.off('connect', this.handleConnect);
    this.socket.off('disconnect', this.handleDisconnect);
    this.socket.off('connect_error', this.handleConnectError);
    this.socket.off('error', this.handleError);
    
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
  }

  authenticate(token) {
    if (!token) {
      console.warn('No token provided for authentication');
      return;
    }

    // Ensure we're connected first
    if (!this.connected) {
      console.log('Not connected, connecting first...');
      this.connect().then(() => {
        if (this.connected) {
          this.authenticate(token);
        }
      });
      return;
    }

    if (!this.socket) {
      console.error('Socket not available for authentication');
      return;
    }

    console.log('🔐 Authenticating socket connection');
    
    // Send authentication event with callback support
    this.socket.emit('authenticate', { token }, (response) => {
      if (response && response.success) {
        this.authenticated = true;
        console.log('✅ Authentication successful');
        this._emitLocal('auth', { success: true, response });
      } else {
        this.authenticated = false;
        console.error('❌ Authentication failed:', response);
        this._emitLocal('auth', { success: false, response });
      }
    });

    // Store token for future reconnections
    this.storeToken(token);
  }

  on(event, fn) {
    if (typeof fn !== 'function') {
      console.warn(`Handler for event '${event}' is not a function`);
      return;
    }

    // Store in local registry
    this.handlers.set(event, fn);
    
    // Register with socket if available
    if (this.socket) {
      this.socket.on(event, fn);
    } else {
      // Queue for when socket becomes available
      console.log(`Queuing handler for event '${event}' until socket is ready`);
    }
  }

  off(event, fn = null) {
    if (this.socket && this.handlers.has(event)) {
      const handler = fn || this.handlers.get(event);
      this.socket.off(event, handler);
    }
    
    if (!fn) {
      this.handlers.delete(event);
    }
  }

  emit(event, payload, callback = null) {
    if (!this.socket) {
      console.warn('Socket not available, connecting...');
      this.connect().then(() => {
        if (this.socket) {
          this.emit(event, payload, callback);
        }
      });
      return;
    }

    if (!this.connected) {
      console.warn(`Cannot emit '${event}': socket not connected`);
      return;
    }

    try {
      if (callback) {
        this.socket.emit(event, payload, callback);
      } else {
        this.socket.emit(event, payload);
      }
      
      console.log(`📡 Emitted event '${event}'`, payload);
    } catch (error) {
      console.error(`Failed to emit event '${event}':`, error);
      this._emitLocal('error', error);
    }
  }

  joinRoom(room, callback = null) {
    if (!room) {
      console.warn('Room name is required');
      return;
    }

    this.emit('join', { room }, callback);
    console.log(`🏠 Joining room: ${room}`);
  }

  leaveRoom(room, callback = null) {
    if (!room) {
      console.warn('Room name is required');
      return;
    }

    this.emit('leave', { room }, callback);
    console.log(`🚪 Leaving room: ${room}`);
  }

  // Utility methods
  getAppConfig() {
    // Support multiple ways to access config
    if (typeof window !== 'undefined') {
      return window.APP_CONFIG || window.appConfig || null;
    }
    return null;
  }

  getStoredToken() {
    try {
      const appConfig = this.getAppConfig();
      // Use your config's storage key structure
      const storageKey = (appConfig && appConfig.STORAGE && appConfig.STORAGE.TOKEN_KEY) || 
                        (appConfig && appConfig.TOKEN_STORAGE_KEY) || 
                        'quicklocal_access_token';
      
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(storageKey);
      }
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }
    return null;
  }

  storeToken(token) {
    try {
      const appConfig = this.getAppConfig();
      // Use your config's storage key structure
      const storageKey = (appConfig && appConfig.STORAGE && appConfig.STORAGE.TOKEN_KEY) || 
                        (appConfig && appConfig.TOKEN_STORAGE_KEY) || 
                        'quicklocal_access_token';
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, token);
      }
    } catch (error) {
      console.warn('Could not store token:', error);
    }
  }

  _emitLocal(event, data) {
    const handler = this.handlers.get(event);
    if (handler && typeof handler === 'function') {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in local event handler for '${event}':`, error);
      }
    }

    // Also emit on custom event system if available
    if (typeof window !== 'undefined' && window.document) {
      const customEvent = new CustomEvent(`socket:${event}`, { detail: data });
      window.document.dispatchEvent(customEvent);
    }
  }

  // Status getters
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  isAuthenticated() {
    return this.authenticated;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Debug helpers
  getStatus() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      socketId: this.getSocketId(),
      handlersCount: this.handlers.size,
      transport: this.socket ? this.socket.io.engine.transport.name : null
    };
  }

  enableDebug() {
    if (this.socket && this.socket.io) {
      this.socket.io.engine.on('upgrade', () => {
        console.log('🚀 Socket transport upgraded to:', this.socket.io.engine.transport.name);
      });
      
      this.socket.io.engine.on('upgradeError', (error) => {
        console.error('❌ Socket upgrade error:', error);
      });
    }
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = { SocketClient, socketClient };
} else if (typeof define === 'function' && define.amd) {
  // AMD
  define([], () => ({ SocketClient, socketClient }));
} else if (typeof window !== 'undefined') {
  // Browser global
  window.SocketClient = SocketClient;
  window.socketClient = socketClient;
}

// Also support ES6 export if in module context
if (typeof exports !== 'undefined') {
  exports.SocketClient = SocketClient;
  exports.socketClient = socketClient;
}

// Initialize connection when DOM is ready (browser only)
if (typeof window !== 'undefined' && window.document) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔌 SocketClient ready');
    });
  } else {
    console.log('🔌 SocketClient ready');
  }
}
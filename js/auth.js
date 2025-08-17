// Enhanced Authentication Service for QuickLocal
import { APP_CONFIG } from './config.js';
import { socketClient } from './socket-client.js';

// Storage keys and configuration
const STORAGE_KEYS = {
  ACCESS_TOKEN: APP_CONFIG.TOKEN_STORAGE_KEY || 'quicklocal_access_token',
  REFRESH_TOKEN: APP_CONFIG.REFRESH_TOKEN_KEY || 'quicklocal_refresh_token',
  USER_DATA: 'quicklocal_user_data',
  SESSION_DATA: 'quicklocal_session_data',
  REMEMBER_ME: 'quicklocal_remember_me',
  DEVICE_ID: 'quicklocal_device_id',
  LOGIN_ATTEMPTS: 'quicklocal_login_attempts',
  LAST_ACTIVITY: 'quicklocal_last_activity',
  PREFERENCES: 'quicklocal_user_preferences'
};

const API_ENDPOINTS = {
  login: `${APP_CONFIG.API.BASE_URL}/auth/login`,
  register: `${APP_CONFIG.API.BASE_URL}/auth/register`,
  logout: `${APP_CONFIG.API.BASE_URL}/auth/logout`,
  refresh: `${APP_CONFIG.API.BASE_URL}/auth/refresh`,
  me: `${APP_CONFIG.API.BASE_URL}/auth/me`,
  verify: `${APP_CONFIG.API.BASE_URL}/auth/verify-email`,
  forgot: `${APP_CONFIG.API.BASE_URL}/auth/forgot-password`,
  reset: `${APP_CONFIG.API.BASE_URL}/auth/reset-password`,
  changePassword: `${APP_CONFIG.API.BASE_URL}/auth/change-password`,
  enable2FA: `${APP_CONFIG.API.BASE_URL}/auth/2fa/enable`,
  verify2FA: `${APP_CONFIG.API.BASE_URL}/auth/2fa/verify`,
  disable2FA: `${APP_CONFIG.API.BASE_URL}/auth/2fa/disable`,
  sessions: `${APP_CONFIG.API.BASE_URL}/auth/sessions`,
  revokeSession: `${APP_CONFIG.API.BASE_URL}/auth/sessions/revoke`
};

// Enhanced configuration
const AUTH_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  REFRESH_BUFFER: 5 * 60, // 5 minutes before expiry
  ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 8,
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  BIOMETRIC_TIMEOUT: 5 * 60 * 1000 // 5 minutes for biometric auth
};

// Utility functions
class AuthUtils {
  static generateDeviceId() {
    if (this.getDeviceId()) return this.getDeviceId();
    
    const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    return deviceId;
  }

  static getDeviceId() {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  }

  static getDeviceInfo() {
    return {
      deviceId: this.generateDeviceId(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString()
    };
  }

  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    const checks = {
      length: password.length >= AUTH_CONFIG.PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong';
    
    return { ...checks, score, strength, valid: checks.length && score >= 3 };
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  static decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }

  static isTokenExpired(token) {
    const payload = this.decodeJWT(token);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }

  static isTokenExpiringSoon(token, bufferSeconds = AUTH_CONFIG.REFRESH_BUFFER) {
    const payload = this.decodeJWT(token);
    if (!payload?.exp) return true;
    return Date.now() >= (payload.exp - bufferSeconds) * 1000;
  }

  static encrypt(data) {
    // Simple encryption for demo - use proper encryption in production
    return btoa(encodeURIComponent(JSON.stringify(data)));
  }

  static decrypt(encryptedData) {
    try {
      return JSON.parse(decodeURIComponent(atob(encryptedData)));
    } catch {
      return null;
    }
  }
}

// Enhanced Storage Manager
class SecureStorage {
  static set(key, value, encrypt = false) {
    try {
      const data = encrypt ? AuthUtils.encrypt(value) : JSON.stringify(value);
      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  static get(key, decrypt = false) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      return decrypt ? AuthUtils.decrypt(data) : JSON.parse(data);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static setTokens({ accessToken, refreshToken, expiresIn }) {
    if (accessToken) {
      this.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      this.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true); // encrypt refresh token
    }
    if (expiresIn) {
      this.set('quicklocal_token_expires', Date.now() + (expiresIn * 1000));
    }
  }

  static getTokens() {
    return {
      accessToken: this.get(STORAGE_KEYS.ACCESS_TOKEN),
      refreshToken: this.get(STORAGE_KEYS.REFRESH_TOKEN, true)
    };
  }

  static clearTokens() {
    this.remove(STORAGE_KEYS.ACCESS_TOKEN);
    this.remove(STORAGE_KEYS.REFRESH_TOKEN);
    this.remove('quicklocal_token_expires');
  }
}

// Enhanced HTTP Client
class AuthHTTPClient {
  static async request(url, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Device-ID': AuthUtils.getDeviceId(),
      'X-Request-ID': Date.now().toString(),
      ...options.headers
    };

    if (options.auth) {
      const { accessToken } = SecureStorage.getTokens();
      if (accessToken) {
        defaultHeaders.Authorization = `Bearer ${accessToken}`;
      }
    }

    const config = {
      method: 'GET',
      ...options,
      headers: defaultHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `${response.status} ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      // Enhanced error handling
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      throw error;
    }
  }

  static async retryRequest(url, options, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        if (attempt === maxRetries || error.status === 401 || error.status === 403) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
}

// Main Authentication Service
class EnhancedAuthService {
  constructor() {
    this.user = null;
    this.isInitialized = false;
    this.eventListeners = new Map();
    this.refreshTimer = null;
    this.activityTimer = null;
    this.sessionData = null;

    // Initialize service
    this.init();
  }

  async init() {
    try {
      console.log('🔐 Initializing Enhanced Auth Service...');
      
      // Setup activity tracking
      this.setupActivityTracking();
      
      // Setup automatic token refresh
      this.setupTokenRefresh();
      
      // Check for existing session
      await this.restoreSession();
      
      // Setup biometric authentication if available
      this.setupBiometric();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.emit('auth:initialized');
      
      console.log('✅ Auth service initialized successfully');
    } catch (error) {
      console.error('❌ Auth service initialization failed:', error);
      this.emit('auth:error', error);
    }
  }

  // Event Management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Authentication Status
  isAuthenticated() {
    const { accessToken } = SecureStorage.getTokens();
    return accessToken && !AuthUtils.isTokenExpired(accessToken);
  }

  isSessionValid() {
    const sessionData = SecureStorage.get(STORAGE_KEYS.SESSION_DATA);
    if (!sessionData) return false;
    
    const isExpired = Date.now() > sessionData.expiresAt;
    if (isExpired) {
      this.clearSession();
      return false;
    }
    return true;
  }

  getUser() {
    return this.user || SecureStorage.get(STORAGE_KEYS.USER_DATA);
  }

  // Registration
  async register(userData) {
    try {
      this.emit('auth:register:start');
      
      const { name, email, password, confirmPassword, acceptTerms } = userData;
      
      // Validation
      if (!name || !email || !password) {
        throw new Error('All fields are required');
      }
      
      if (!AuthUtils.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      const passwordValidation = AuthUtils.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (!acceptTerms) {
        throw new Error('Please accept the terms and conditions');
      }

      // Prepare registration data
      const registrationData = {
        name: AuthUtils.sanitizeInput(name),
        email: AuthUtils.sanitizeInput(email.toLowerCase()),
        password,
        deviceInfo: AuthUtils.getDeviceInfo()
      };

      const response = await AuthHTTPClient.retryRequest(API_ENDPOINTS.register, {
        method: 'POST',
        body: registrationData
      });

      // Handle successful registration
      if (response.data.accessToken) {
        SecureStorage.setTokens(response.data);
        this.user = response.data.user;
        SecureStorage.set(STORAGE_KEYS.USER_DATA, this.user);
        this.createSession();
      }

      this.emit('auth:register:success', response.data);
      return response.data;

    } catch (error) {
      this.emit('auth:register:error', error);
      throw error;
    }
  }

  // Login
  async login(credentials) {
    try {
      this.emit('auth:login:start');
      
      const { email, password, rememberMe, twoFactorCode } = credentials;
      
      // Check login attempts
      this.checkLoginAttempts(email);
      
      // Validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!AuthUtils.validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Prepare login data
      const loginData = {
        email: AuthUtils.sanitizeInput(email.toLowerCase()),
        password,
        rememberMe: !!rememberMe,
        deviceInfo: AuthUtils.getDeviceInfo()
      };

      if (twoFactorCode) {
        loginData.twoFactorCode = twoFactorCode;
      }

      const response = await AuthHTTPClient.retryRequest(API_ENDPOINTS.login, {
        method: 'POST',
        body: loginData
      });

      // Handle successful login
      this.handleSuccessfulLogin(response.data, rememberMe);
      
      this.emit('auth:login:success', { user: this.user, ...response.data });
      return { user: this.user, ...response.data };

    } catch (error) {
      this.handleLoginError(credentials.email, error);
      throw error;
    }
  }

  // Biometric Login
  async loginWithBiometric() {
    try {
      if (!this.isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
      }

      this.emit('auth:biometric:start');

      // Check if biometric is enabled for this device
      const biometricData = SecureStorage.get('quicklocal_biometric_data');
      if (!biometricData) {
        throw new Error('Biometric authentication not set up');
      }

      // Request biometric authentication
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new TextEncoder().encode('quicklocal-biometric-challenge'),
          rp: { name: 'QuickLocal' },
          user: {
            id: new TextEncoder().encode(biometricData.userId),
            name: biometricData.email,
            displayName: biometricData.name
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: AUTH_CONFIG.BIOMETRIC_TIMEOUT,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      });

      if (credential) {
        // Simulate biometric login success
        const userData = SecureStorage.get(STORAGE_KEYS.USER_DATA);
        if (userData) {
          this.handleSuccessfulLogin({ user: userData }, true);
          this.emit('auth:biometric:success');
          return { user: this.user };
        }
      }

      throw new Error('Biometric authentication failed');

    } catch (error) {
      this.emit('auth:biometric:error', error);
      throw error;
    }
  }

  // Social Login
  async loginWithProvider(provider) {
    try {
      this.emit('auth:social:start', provider);

      // Open OAuth popup
      const popup = window.open(
        `${API_ENDPOINTS.login}/social/${provider}`,
        'socialLogin',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth callback
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Login cancelled by user'));
          }
        }, 1000);

        window.addEventListener('message', (event) => {
          if (event.origin !== window.location.origin) return;

          clearInterval(checkClosed);
          popup.close();

          if (event.data.success) {
            this.handleSuccessfulLogin(event.data);
            this.emit('auth:social:success', provider);
            resolve(event.data);
          } else {
            this.emit('auth:social:error', event.data.error);
            reject(new Error(event.data.error || 'Social login failed'));
          }
        }, { once: true });
      });

    } catch (error) {
      this.emit('auth:social:error', error);
      throw error;
    }
  }

  // Logout
  async logout(options = {}) {
    try {
      this.emit('auth:logout:start');
      
      const { everywhere = false } = options;

      // Call logout endpoint
      try {
        await AuthHTTPClient.request(API_ENDPOINTS.logout, {
          method: 'POST',
          auth: true,
          body: { everywhere }
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }

      // Clear local data
      this.clearSession();
      this.user = null;
      
      // Disconnect socket
      if (socketClient) {
        socketClient.disconnect();
      }

      this.emit('auth:logout:success');

    } catch (error) {
      this.emit('auth:logout:error', error);
      throw error;
    }
  }

  // Token Management
  async refreshToken() {
    try {
      const { refreshToken } = SecureStorage.getTokens();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await AuthHTTPClient.request(API_ENDPOINTS.refresh, {
        method: 'POST',
        body: { refreshToken }
      });

      SecureStorage.setTokens(response.data);
      this.emit('auth:token:refreshed');
      return response.data;

    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSession();
      this.emit('auth:token:refresh:error', error);
      throw error;
    }
  }

  // User Profile Management
  async fetchUserProfile() {
    try {
      const response = await AuthHTTPClient.retryRequest(API_ENDPOINTS.me, {
        auth: true
      });

      this.user = response.data;
      SecureStorage.set(STORAGE_KEYS.USER_DATA, this.user);
      this.emit('auth:profile:updated', this.user);
      return this.user;

    } catch (error) {
      if (error.status === 401) {
        try {
          await this.refreshToken();
          return this.fetchUserProfile();
        } catch (refreshError) {
          this.clearSession();
          throw refreshError;
        }
      }
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await AuthHTTPClient.request(`${API_ENDPOINTS.me}`, {
        method: 'PUT',
        auth: true,
        body: profileData
      });

      this.user = { ...this.user, ...response.data };
      SecureStorage.set(STORAGE_KEYS.USER_DATA, this.user);
      this.emit('auth:profile:updated', this.user);
      return this.user;

    } catch (error) {
      this.emit('auth:profile:error', error);
      throw error;
    }
  }

  // Password Management
  async changePassword({ currentPassword, newPassword }) {
    try {
      const passwordValidation = AuthUtils.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error('New password does not meet security requirements');
      }

      await AuthHTTPClient.request(API_ENDPOINTS.changePassword, {
        method: 'POST',
        auth: true,
        body: { currentPassword, newPassword }
      });

      this.emit('auth:password:changed');
      return true;

    } catch (error) {
      this.emit('auth:password:error', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      await AuthHTTPClient.request(API_ENDPOINTS.forgot, {
        method: 'POST',
        body: { email }
      });

      this.emit('auth:password:reset:sent');
      return true;

    } catch (error) {
      this.emit('auth:password:reset:error', error);
      throw error;
    }
  }

  async resetPassword({ token, newPassword }) {
    try {
      const passwordValidation = AuthUtils.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error('Password does not meet security requirements');
      }

      await AuthHTTPClient.request(API_ENDPOINTS.reset, {
        method: 'POST',
        body: { token, password: newPassword }
      });

      this.emit('auth:password:reset:success');
      return true;

    } catch (error) {
      this.emit('auth:password:reset:error', error);
      throw error;
    }
  }

  // Two-Factor Authentication
  async enable2FA() {
    try {
      const response = await AuthHTTPClient.request(API_ENDPOINTS.enable2FA, {
        method: 'POST',
        auth: true
      });

      this.emit('auth:2fa:enabled');
      return response.data;

    } catch (error) {
      this.emit('auth:2fa:error', error);
      throw error;
    }
  }

  async verify2FA(code) {
    try {
      await AuthHTTPClient.request(API_ENDPOINTS.verify2FA, {
        method: 'POST',
        auth: true,
        body: { code }
      });

      this.emit('auth:2fa:verified');
      return true;

    } catch (error) {
      this.emit('auth:2fa:error', error);
      throw error;
    }
  }

  async disable2FA(code) {
    try {
      await AuthHTTPClient.request(API_ENDPOINTS.disable2FA, {
        method: 'POST',
        auth: true,
        body: { code }
      });

      this.emit('auth:2fa:disabled');
      return true;

    } catch (error) {
      this.emit('auth:2fa:error', error);
      throw error;
    }
  }

  // Session Management
  async getSessions() {
    try {
      const response = await AuthHTTPClient.request(API_ENDPOINTS.sessions, {
        auth: true
      });

      return response.data;

    } catch (error) {
      throw error;
    }
  }

  async revokeSession(sessionId) {
    try {
      await AuthHTTPClient.request(`${API_ENDPOINTS.revokeSession}/${sessionId}`, {
        method: 'DELETE',
        auth: true
      });

      this.emit('auth:session:revoked', sessionId);
      return true;

    } catch (error) {
      throw error;
    }
  }

  // Biometric Support
  isBiometricAvailable() {
    return 'credentials' in navigator && 'PublicKeyCredential' in window;
  }

  async setupBiometric() {
    if (!this.isBiometricAvailable()) return false;

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (available && this.user) {
        SecureStorage.set('quicklocal_biometric_available', true);
        return true;
      }
    } catch (error) {
      console.warn('Biometric setup failed:', error);
    }
    return false;
  }

  // Helper Methods
  handleSuccessfulLogin(data, rememberMe = false) {
    // Store tokens
    SecureStorage.setTokens(data);
    
    // Store user data
    this.user = data.user;
    SecureStorage.set(STORAGE_KEYS.USER_DATA, this.user);
    
    // Create session
    this.createSession(rememberMe);
    
    // Clear login attempts
    SecureStorage.remove(STORAGE_KEYS.LOGIN_ATTEMPTS);
    
    // Connect socket
    if (socketClient && data.accessToken) {
      socketClient.authenticate(data.accessToken);
    }
    
    // Update activity
    this.updateLastActivity();
  }

  handleLoginError(email, error) {
    this.incrementLoginAttempts(email);
    this.emit('auth:login:error', error);
  }

  checkLoginAttempts(email) {
    const attempts = SecureStorage.get(STORAGE_KEYS.LOGIN_ATTEMPTS) || {};
    const emailAttempts = attempts[email];
    
    if (emailAttempts && emailAttempts.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - emailAttempts.lastAttempt;
      if (timeSinceLastAttempt < AUTH_CONFIG.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((AUTH_CONFIG.LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
        throw new Error(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
      } else {
        // Reset attempts after lockout period
        delete attempts[email];
        SecureStorage.set(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
      }
    }
  }

  incrementLoginAttempts(email) {
    const attempts = SecureStorage.get(STORAGE_KEYS.LOGIN_ATTEMPTS) || {};
    attempts[email] = {
      count: (attempts[email]?.count || 0) + 1,
      lastAttempt: Date.now()
    };
    SecureStorage.set(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
  }

  createSession(rememberMe = false) {
    const sessionData = {
      deviceId: AuthUtils.getDeviceId(),
      createdAt: Date.now(),
      expiresAt: Date.now() + (rememberMe ? AUTH_CONFIG.REMEMBER_ME_DURATION : AUTH_CONFIG.SESSION_TIMEOUT),
      rememberMe
    };
    
    SecureStorage.set(STORAGE_KEYS.SESSION_DATA, sessionData);
    SecureStorage.set(STORAGE_KEYS.REMEMBER_ME, rememberMe);
    this.sessionData = sessionData;
  }

  clearSession() {
    SecureStorage.clear();
    this.sessionData = null;
    this.clearTimers();
  }

  async restoreSession() {
    const sessionData = SecureStorage.get(STORAGE_KEYS.SESSION_DATA);
    const userData = SecureStorage.get(STORAGE_KEYS.USER_DATA);
    
    if (sessionData && userData && this.isSessionValid()) {
      this.user = userData;
      this.sessionData = sessionData;
      
      // Try to refresh token if needed
      const { accessToken } = SecureStorage.getTokens();
      if (!accessToken || AuthUtils.isTokenExpiringSoon(accessToken)) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.warn('Token refresh failed during session restore:', error);
          this.clearSession();
          return false;
        }
      }
      
      // Connect socket
      if (socketClient && accessToken) {
        socketClient.authenticate(accessToken);
      }
      
      this.emit('auth:session:restored', this.user);
      return true;
    }
    
    return false;
  }

  setupTokenRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    
    this.refreshTimer = setInterval(async () => {
      const { accessToken } = SecureStorage.getTokens();
      if (accessToken && AuthUtils.isTokenExpiringSoon(accessToken)) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
        }
      }
    }, 60000); // Check every minute
  }

  setupActivityTracking() {
    this.updateLastActivity();
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.throttledActivityUpdate.bind(this), { passive: true });
    });
    
    // Setup activity timeout check
    this.setupActivityTimeout();
  }

  throttledActivityUpdate = this.throttle(() => {
    this.updateLastActivity();
  }, 30000); // Update every 30 seconds max

  setupActivityTimeout() {
    if (this.activityTimer) clearInterval(this.activityTimer);
    
    this.activityTimer = setInterval(() => {
      const lastActivity = SecureStorage.get(STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActivity && Date.now() - lastActivity > AUTH_CONFIG.ACTIVITY_TIMEOUT) {
        this.emit('auth:session:timeout');
        // Optionally auto-logout on inactivity
        // this.logout({ reason: 'inactivity' });
      }
    }, 60000); // Check every minute
  }

  updateLastActivity() {
    SecureStorage.set(STORAGE_KEYS.LAST_ACTIVITY, Date.now());
  }

  throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.emit('auth:network:online');
      // Attempt to refresh token when back online
      if (this.isAuthenticated()) {
        this.refreshToken().catch(console.warn);
      }
    });

    window.addEventListener('offline', () => {
      this.emit('auth:network:offline');
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.emit('auth:visibility:hidden');
      } else {
        this.emit('auth:visibility:visible');
        this.updateLastActivity();
        
        // Check for token refresh when page becomes visible
        if (this.isAuthenticated()) {
          const { accessToken } = SecureStorage.getTokens();
          if (AuthUtils.isTokenExpiringSoon(accessToken)) {
            this.refreshToken().catch(console.warn);
          }
        }
      }
    });

    // Before page unload
    window.addEventListener('beforeunload', () => {
      this.emit('auth:page:unload');
      this.updateLastActivity();
    });
  }

  clearTimers() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Security Features
  async getSecuritySettings() {
    try {
      const response = await AuthHTTPClient.request(`${API_ENDPOINTS.me}/security`, {
        auth: true
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      const response = await AuthHTTPClient.request(`${API_ENDPOINTS.me}/security`, {
        method: 'PUT',
        auth: true,
        body: settings
      });
      
      this.emit('auth:security:updated', response.data);
      return response.data;
    } catch (error) {
      this.emit('auth:security:error', error);
      throw error;
    }
  }

  // Email Verification
  async sendVerificationEmail() {
    try {
      await AuthHTTPClient.request(API_ENDPOINTS.verify, {
        method: 'POST',
        auth: true
      });
      
      this.emit('auth:verification:sent');
      return true;
    } catch (error) {
      this.emit('auth:verification:error', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      await AuthHTTPClient.request(API_ENDPOINTS.verify, {
        method: 'PUT',
        body: { token }
      });
      
      // Update user data
      await this.fetchUserProfile();
      this.emit('auth:verification:success');
      return true;
    } catch (error) {
      this.emit('auth:verification:error', error);
      throw error;
    }
  }

  // Advanced Features
  async exportUserData() {
    try {
      const response = await AuthHTTPClient.request(`${API_ENDPOINTS.me}/export`, {
        auth: true
      });
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quicklocal-user-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.emit('auth:data:exported');
      return true;
    } catch (error) {
      this.emit('auth:data:error', error);
      throw error;
    }
  }

  async deleteAccount(password) {
    try {
      const confirmed = confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      );
      
      if (!confirmed) return false;
      
      await AuthHTTPClient.request(`${API_ENDPOINTS.me}`, {
        method: 'DELETE',
        auth: true,
        body: { password }
      });
      
      // Clear all local data
      this.clearSession();
      this.user = null;
      
      this.emit('auth:account:deleted');
      return true;
    } catch (error) {
      this.emit('auth:account:error', error);
      throw error;
    }
  }

  // Utility Methods
  getAuthHeaders() {
    const { accessToken } = SecureStorage.getTokens();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  isFeatureEnabled(feature) {
    const user = this.getUser();
    return user?.features?.[feature] || false;
  }

  hasPermission(permission) {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role) {
    const user = this.getUser();
    return user?.roles?.includes(role) || false;
  }

  // Guard Methods
  requireAuth() {
    if (!this.isAuthenticated()) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
      return false;
    }
    return true;
  }

  requireRole(role) {
    if (!this.requireAuth()) return false;
    
    if (!this.hasRole(role)) {
      this.emit('auth:access:denied', { reason: 'insufficient_role', required: role });
      throw new Error(`Access denied. Required role: ${role}`);
    }
    return true;
  }

  requirePermission(permission) {
    if (!this.requireAuth()) return false;
    
    if (!this.hasPermission(permission)) {
      this.emit('auth:access:denied', { reason: 'insufficient_permission', required: permission });
      throw new Error(`Access denied. Required permission: ${permission}`);
    }
    return true;
  }

  // Development & Debug Features
  getDebugInfo() {
    if (process.env.NODE_ENV !== 'development') {
      return 'Debug info only available in development mode';
    }
    
    const { accessToken, refreshToken } = SecureStorage.getTokens();
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.user,
      tokens: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenExpiry: accessToken ? AuthUtils.decodeJWT(accessToken)?.exp : null
      },
      session: this.sessionData,
      deviceId: AuthUtils.getDeviceId(),
      lastActivity: SecureStorage.get(STORAGE_KEYS.LAST_ACTIVITY),
      biometricAvailable: this.isBiometricAvailable()
    };
  }

  // Analytics & Monitoring
  trackEvent(event, data = {}) {
    const eventData = {
      event,
      timestamp: new Date().toISOString(),
      userId: this.user?.id,
      deviceId: AuthUtils.getDeviceId(),
      ...data
    };
    
    // Store locally for now (in production, send to analytics service)
    const events = SecureStorage.get('quicklocal_auth_events') || [];
    events.push(eventData);
    
    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    
    SecureStorage.set('quicklocal_auth_events', events);
    this.emit('auth:analytics:event', eventData);
  }

  // Cleanup
  destroy() {
    this.clearTimers();
    this.eventListeners.clear();
    
    // Remove event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.throttledActivityUpdate);
    });
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    this.emit('auth:service:destroyed');
  }
}

// Create and export singleton instance
export const authService = new EnhancedAuthService();

// Make available globally for non-module environments
if (typeof window !== 'undefined') {
  window.authService = authService;
  
  // Development helpers
  if (process.env.NODE_ENV === 'development') {
    window.AuthUtils = AuthUtils;
    window.SecureStorage = SecureStorage;
    window.AUTH_CONFIG = AUTH_CONFIG;
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authService.init());
  } else {
    authService.init();
  }
}

console.log('🚀 Enhanced Authentication Service loaded');
console.log('📊 Features: Biometric, 2FA, Social Login, Session Management, Security Analytics');
console.log('🔒 Security: Token refresh, Activity tracking, Login attempt limiting, Secure storage');
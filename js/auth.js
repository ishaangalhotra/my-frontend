// Authentication Service for QuickLocal
class AuthService {
    constructor() {
        this.API_BASE = 'http://localhost:10000/api/v1';
        this.AUTH_ENDPOINTS = {
            login: `${this.API_BASE}/auth/login`,
            register: `${this.API_BASE}/auth/register`,
            logout: `${this.API_BASE}/auth/logout`,
            refresh: `${this.API_BASE}/auth/refresh`,
            verify: `${this.API_BASE}/auth/verify-email`,
            forgotPassword: `${this.API_BASE}/auth/forgot-password`,
            resetPassword: `${this.API_BASE}/auth/reset-password`
        };
        this.tokenKey = 'quicklocal_access_token';
        this.userKey = 'quicklocal_user';
        this.refreshTokenKey = 'quicklocal_refresh_token';
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) return false;
        
        try {
            // Check if token is expired
            const payload = this.decodeToken(token);
            if (!payload || payload.exp < Date.now() / 1000) {
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            this.logout();
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        try {
            const userData = localStorage.getItem(this.userKey);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Get access token
    getAccessToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Get refresh token
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    // Login user
    async login(email, password, rememberMe = false) {
        try {
            console.log('🔐 Attempting login for:', email);
            
            const response = await fetch(this.AUTH_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include' // Include cookies for refresh token
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.success) {
                // Store tokens and user data
                this.setTokens(data.accessToken, data.refreshToken, rememberMe);
                this.setUserData(data.user);
                
                console.log('✅ Login successful for:', email);
                return {
                    success: true,
                    user: data.user,
                    message: 'Login successful'
                };
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    // Register user
    async register(userData) {
        try {
            console.log('📝 Attempting registration for:', userData.email);
            
            const response = await fetch(this.AUTH_ENDPOINTS.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.success) {
                console.log('✅ Registration successful for:', userData.email);
                return {
                    success: true,
                    message: data.message || 'Registration successful'
                };
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();
            
            if (refreshToken) {
                // Call logout endpoint to invalidate refresh token
                await fetch(this.AUTH_ENDPOINTS.logout, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAccessToken()}`
                    },
                    body: JSON.stringify({ refreshToken }),
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local storage
            this.clearAuthData();
            console.log('✅ Logout successful');
        }
    }

    // Refresh access token
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(this.AUTH_ENDPOINTS.refresh, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.setTokens(data.accessToken, data.refreshToken);
                return data.accessToken;
            } else {
                throw new Error(data.message || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
        }
    }

    // Make authenticated API requests
    async authenticatedRequest(url, options = {}) {
        try {
            let token = this.getAccessToken();
            
            if (!token) {
                throw new Error('No access token available');
            }

            // Add authorization header
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };

            let response = await fetch(url, options);

            // If token is expired, try to refresh
            if (response.status === 401) {
                try {
                    const newToken = await this.refreshToken();
                    options.headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(url, options);
                } catch (refreshError) {
                    this.logout();
                    throw new Error('Authentication expired. Please login again.');
                }
            }

            return response;
        } catch (error) {
            console.error('Authenticated request error:', error);
            throw error;
        }
    }

    // Verify email
    async verifyEmail(token) {
        try {
            const response = await fetch(`${this.AUTH_ENDPOINTS.verify}?token=${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Email verification failed');
            }

            return data;
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }

    // Forgot password
    async forgotPassword(email) {
        try {
            const response = await fetch(this.AUTH_ENDPOINTS.forgotPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            return data;
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    }

    // Reset password
    async resetPassword(token, newPassword) {
        try {
            const response = await fetch(this.AUTH_ENDPOINTS.resetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }

            return data;
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }

    // Helper methods
    setTokens(accessToken, refreshToken, rememberMe = false) {
        localStorage.setItem(this.tokenKey, accessToken);
        if (refreshToken) {
            localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
        
        if (rememberMe) {
            localStorage.setItem('quicklocal_remember', 'true');
        }
    }

    setUserData(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('quicklocal_remember');
    }

    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token decode error:', error);
            return null;
        }
    }

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        
        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        if (password.length >= 12) score++;

        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check if user has required role
    hasRole(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(user.role);
        }
        return user.role === requiredRole;
    }

    // Check if user has permission
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;
        
        return user.permissions.includes(permission);
    }
}

// Create global instance
const authService = new AuthService();

// Export for use in other files
window.authService = authService;

// Auto-refresh token before expiry
setInterval(() => {
    if (authService.isAuthenticated()) {
        const token = authService.getAccessToken();
        const payload = authService.decodeToken(token);
        
        if (payload && payload.exp) {
            const timeUntilExpiry = payload.exp - (Date.now() / 1000);
            
            // Refresh token 5 minutes before expiry
            if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
                console.log('🔄 Refreshing token before expiry...');
                authService.refreshToken().catch(error => {
                    console.error('Auto token refresh failed:', error);
                });
            }
        }
    }
}, 60000); // Check every minute

console.log('🔐 AuthService initialized');

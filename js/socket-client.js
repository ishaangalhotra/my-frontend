// Reusable Socket.IO client wrapper
import { APP_CONFIG } from './config.js';

// IMPORTANT: ensure you include the Socket.IO client script in your HTML:
// <script src="https://cdn.socket.io/4.7.5/socket.io.min.js" crossorigin="anonymous"></script>
// or from your backend: <script src="https://quicklocal-backend.onrender.com/socket.io/socket.io.js"></script>

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.handlers = new Map();
  }

  connect() {
    if (this.socket) return;

    const base = APP_CONFIG.SOCKET_URL || window.location.origin;
    // eslint-disable-next-line no-undef
    this.socket = io(base, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.connected = true;
      // if we had a token earlier, try authenticating again
      const token = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
      if (token) this.authenticate(token);
      this._emitLocal('status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.authenticated = false;
      this._emitLocal('status', { connected: false });
    });

    // generic error logging
    this.socket.on('connect_error', (err) => this._emitLocal('error', err));
    this.socket.on('error', (err) => this._emitLocal('error', err));
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
  }

  authenticate(token) {
    this.connect();
    if (!this.socket) return;
    // convention: backend listens to 'authenticate' event or uses auth middleware; adjust if needed
    this.socket.emit('authenticate', { token }, (ack) => {
      this.authenticated = !!(ack && ack.ok);
      this._emitLocal('auth', { ok: this.authenticated, ack });
    });
  }

  on(event, fn) {
    // app-level event registry
    this.handlers.set(event, fn);
    if (this.socket && event && typeof fn === 'function') {
      this.socket.on(event, fn);
    }
  }

  off(event) {
    const fn = this.handlers.get(event);
    if (this.socket && fn) this.socket.off(event, fn);
    this.handlers.delete(event);
  }

  joinRoom(room) {
    if (!this.socket) this.connect();
    this.socket.emit('join', { room });
  }

  leaveRoom(room) {
    if (!this.socket) return;
    this.socket.emit('leave', { room });
  }

  emit(event, payload) {
    if (!this.socket) this.connect();
    this.socket.emit(event, payload);
  }

  _emitLocal(event, data) {
    const fn = this.handlers.get(event);
    if (fn) fn(data);
  }
}

export const socketClient = new SocketClient();

// Optional global
if (typeof window !== 'undefined') {
  window.socketClient = socketClient;
}

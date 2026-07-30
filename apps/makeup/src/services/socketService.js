import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setBaseURLResolver, API_BASE_URLS } from '../api/client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = null;
    this.listeners = [];
    this.retryIndex = 0;

    setBaseURLResolver((newBaseURL) => {
      if (this.serverUrl !== newBaseURL) {
        this.serverUrl = newBaseURL;
        if (this.socket) {
          console.log(`[SocketService] Reconnecting socket due to base URL change: ${newBaseURL}`);
          this.disconnect();
          this.connect();
        }
      }
    });
  }

  async connect() {
    if (this.socket?.connected) return;
    this.retryIndex = 0;
    this.attemptConnection();
  }

  async attemptConnection() {
    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');

      if (!token || !role) {
        console.log('[SocketService] Missing auth tokens, cannot connect.');
        return;
      }

      // Cycle through IPs if serverUrl is not resolved yet
      const urlToUse = this.serverUrl || API_BASE_URLS[this.retryIndex] || api.defaults.baseURL;
      console.log(`[SocketService] Attempting connection to ${urlToUse} (index ${this.retryIndex})...`);

      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      const socketInstance = io(urlToUse, {
        auth: { token, role },
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket = socketInstance;

      // Re-apply registered listeners to the new instance
      this.listeners.forEach(({ eventName, callback }) => {
        socketInstance.on(eventName, callback);
      });

      socketInstance.on('connect', () => {
        console.log(`[SocketService] Connected successfully to ${urlToUse}`);
        this.serverUrl = urlToUse;
        if (api.defaults.baseURL !== urlToUse) {
          api.defaults.baseURL = urlToUse;
          console.log(`[SocketService] Synchronized Axios baseURL to ${urlToUse}`);
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log(`[SocketService] Disconnected: ${reason}`);
      });

      socketInstance.on('connect_error', (error) => {
        console.warn(`[SocketService] Connection warning for ${urlToUse}:`, error.message);
        
        // Fall back to next IP if we haven't successfully established a connection URL yet
        if (this.socket === socketInstance && !this.serverUrl) {
          this.retryIndex++;
          if (this.retryIndex < API_BASE_URLS.length) {
            console.log(`[SocketService] Falling back to next server URL...`);
            this.attemptConnection();
          } else {
            console.log(`[SocketService] All server URLs exhausted for WebSocket connection.`);
          }
        }
      });

    } catch (error) {
      console.warn('[SocketService] Initialization warning:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName, callback) {
    this.listeners.push({ eventName, callback });
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    this.listeners = this.listeners.filter(
      (l) => !(l.eventName === eventName && l.callback === callback)
    );
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`[SocketService] Tried to emit ${eventName} but socket is null`);
    }
  }
}

export default new SocketService();

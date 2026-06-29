import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  async connect() {
    if (this.socket?.connected) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');

      if (!token || !role) {
        console.log('[SocketService] Missing auth tokens, cannot connect.');
        return;
      }

      // Use the active baseURL from our Axios instance
      const serverUrl = api.defaults.baseURL;
      console.log(`[SocketService] Connecting to ${serverUrl}...`);

      this.socket = io(serverUrl, {
        auth: { token, role },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('[SocketService] Connected to signaling server');
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`[SocketService] Disconnected: ${reason}`);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[SocketService] Connection Error:', error.message);
      });

    } catch (error) {
      console.error('[SocketService] Initialization error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName, callback) {
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

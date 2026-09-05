import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URLs in order of priority (Active Wi-Fi, ADB reverse USB, Android Emulator)
export const API_BASE_URLS = [
  'http://192.168.29.53:5000',  // Active Wi-Fi IP (Laptop on local network)
  'http://192.168.29.53:5000',       // Active Wi-Fi IP (Added from ipconfig)
  'http://192.168.29.53:5000',       // Active Wi-Fi IP (from HEAD)
  'http://192.168.29.53:5000',      // Active Wi-Fi IP (Primary for Wireless)
  'http://127.0.0.1:5000',           // adb reverse loopback fallback
  'http://localhost:5000',           // localhost fallback
  'http://10.0.2.2:5000',            // Android Emulator loopback
  'http://192.168.56.1:5000',        // VirtualBox host-only adapter
];

const api = axios.create({
  baseURL: API_BASE_URLS[0],
  timeout: 30000,
});

let onBaseURLResolved = null;
export const setBaseURLResolver = (cb) => {
  onBaseURLResolved = cb;
  if (api.defaults.baseURL && cb) {
    cb(api.defaults.baseURL);
  }
};

// Wishlist API helpers
export const addArtistToWishlist = async (artistId) => api.post('/wishlist/add', { artistId });
export const removeArtistFromWishlist = async (artistId) => api.post('/wishlist/remove', { artistId });
export const fetchWishlist = async () => api.get('/wishlist');

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const cleanToken = String(token).trim().replace(/[^\x00-\x7F]/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
  } catch (_) {}

  if (config.headers) {
    Object.keys(config.headers).forEach((key) => {
      const val = config.headers[key];
      if (typeof val === 'string') {
        config.headers[key] = val.replace(/[^\x00-\x7F]/g, '');
      }
    });
  }

  return config;
});

// Retry network errors with fallback URLs
api.interceptors.response.use(
  (response) => {
    const baseURL = response?.config?.baseURL;
    if (baseURL && api.defaults.baseURL !== baseURL) {
      api.defaults.baseURL = baseURL;
      if (onBaseURLResolved) onBaseURLResolved(baseURL);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) throw error;

    const isNetworkError =
      error?.message === 'Network Error' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ECONNREFUSED' ||
      !error?.response;

    if (!isNetworkError) throw error;

    const currentUrl = originalRequest.baseURL || api.defaults.baseURL;
    let currentIndex = API_BASE_URLS.indexOf(currentUrl);
    if (currentIndex === -1) currentIndex = 0;

    const retryCount = (originalRequest.__retryCount ?? 0) + 1;
    if (retryCount >= API_BASE_URLS.length) {
      api.defaults.baseURL = API_BASE_URLS[0];
      throw error;
    }

    const nextIndex = (currentIndex + 1) % API_BASE_URLS.length;
    originalRequest.__retryCount = retryCount;
    originalRequest.baseURL = API_BASE_URLS[nextIndex];

    return api.request(originalRequest);
  }
);

export default api;

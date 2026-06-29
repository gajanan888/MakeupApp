import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wishlist API helpers
export const addArtistToWishlist = async (artistId) => api.post('/wishlist/add', { artistId });
export const removeArtistFromWishlist = async (artistId) => api.post('/wishlist/remove', { artistId });
export const fetchWishlist = async () => api.get('/wishlist');

// Host Wi-Fi IP address: 172.19.20.151
const API_BASE_URLS = [


  'http://172.19.20.151:5000',       // adb reverse loopback (numeric, bypasses ROM DNS resolution)
  'http://localhost:5000',       // adb reverse localhost fallback
  'http://172.19.13.83:5000',   // Current Wi-Fi IP fallback

  'http://10.0.2.2:5000',        // Android Emulator loopback
  'http://192.168.56.1:5000',    // VirtualBox host-only adapter

];

const api = axios.create({
  baseURL: API_BASE_URLS[0],
  timeout: 10000,
});

// Dynamic base URL resolver callbacks to synchronize ports with AI backend
let onBaseURLResolved = null;
export const setBaseURLResolver = (cb) => {
  onBaseURLResolved = cb;
  if (api.defaults.baseURL) {
    cb(api.defaults.baseURL);
  }
};

// ── Attach JWT token to every request ────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});

// ── Retry with next IP on network errors and synchronize active host ──────────
api.interceptors.response.use(
  (response) => {
    const baseURL = response?.config?.baseURL;
    if (baseURL && api.defaults.baseURL !== baseURL) {
      api.defaults.baseURL = baseURL;
      console.log(`[API] Updated default baseURL to: ${baseURL}`);
      if (onBaseURLResolved) {
        onBaseURLResolved(baseURL);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (!originalRequest) throw error;

    // Only retry on network / timeout errors (not 4xx / 5xx)
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

    console.log(`[API] Retrying request (attempt ${retryCount}) with: ${API_BASE_URLS[nextIndex]}`);
    return api.request(originalRequest);
  }
);

export default api;

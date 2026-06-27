import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Wishlist API helpers
export const addArtistToWishlist = async (artistId) => api.post('/wishlist/add', { artistId });
export const removeArtistFromWishlist = async (artistId) => api.post('/wishlist/remove', { artistId });
export const fetchWishlist = async () => api.get('/wishlist');

/**
 * API_BASE_URLS — ordered by priority.
 * The app tries each one in sequence on network failure.
 *
 * HOW TO UPDATE THE IP:
 *   On Windows, run: ipconfig
 *   Find the "Wireless LAN adapter Wi-Fi" IPv4 address (e.g. 10.x.x.x or 192.168.x.x)
 *   Replace the first entry below with that IP.
 *
 * Current machine WiFi IP: 172.19.20.153
 */
const API_BASE_URLS = [
  'http://172.19.13.83:5000', // ← Your computer's WiFi IP (physical Android device)
  'http://10.0.2.2:5000',       // Android Emulator loopback
  'http://localhost:5000',       // iOS Simulator / browser
  'http://192.168.56.1:5000',   // VirtualBox host-only adapter
];

const api = axios.create({
  baseURL: API_BASE_URLS[0],
  timeout: 10000,
});

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

// ── Retry with next IP on network errors ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    // Already exhausted all URLs — throw immediately
    if (!originalRequest) throw error;
    const retryIndex = (originalRequest.__retryIndex ?? -1) + 1;
    if (retryIndex >= API_BASE_URLS.length) throw error;

    // Only retry on network / timeout errors (not 4xx / 5xx)
    const isNetworkError =
      error?.message === 'Network Error' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ECONNREFUSED' ||
      !error?.response;

    if (!isNetworkError) throw error;

    originalRequest.__retryIndex = retryIndex;
    originalRequest.baseURL = API_BASE_URLS[retryIndex];

    console.log(`[API] Retrying with: ${API_BASE_URLS[retryIndex]}`);
    return api.request(originalRequest);
  }
);

export default api;

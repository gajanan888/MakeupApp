import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URLS = ['http://10.145.106.212:5000', 'http://172.19.16.171:5000'];

const API_BASE_URL = API_BASE_URLS[0];
  
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error?.config;

    if (!originalRequest || originalRequest.__retriedForNetworkError) {
      throw error;
    }

    const isNetworkError =
      error?.message === 'Network Error' ||
      !error?.response ||
      error?.code === 'ECONNABORTED';

    if (!isNetworkError) {
      throw error;
    }

    const currentBaseURL = originalRequest.baseURL || api.defaults.baseURL;
    const fallbackBaseURL = API_BASE_URLS.find(url => url !== currentBaseURL);

    if (!fallbackBaseURL) {
      throw error;
    }

    originalRequest.__retriedForNetworkError = true;
    originalRequest.baseURL = fallbackBaseURL;

    return api.request(originalRequest);
  },
);

export default api;

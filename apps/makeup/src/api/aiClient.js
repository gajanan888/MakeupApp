import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AI_API_BASE_URLS = [
  'http://192.168.29.53:5000', // Active Wi-Fi IP (Current network host)
  'http://192.168.29.53:8000', // Direct FastAPI port
  'http://172.19.11.224:5000', // Alternate Wi-Fi IP
  'http://172.19.11.224:8000', // Alternate FastAPI port
  'http://127.0.0.1:5000',     // adb reverse USB
  'http://127.0.0.1:8000',     // adb reverse FastAPI USB
  'http://10.0.2.2:5000',      // Android Emulator
];

const aiApi = axios.create({
  baseURL: AI_API_BASE_URLS[0],
  timeout: 30000,
});

// Helper to normalize local file URIs for FormData uploads
const normalizeUri = (uri = '') => {
  if (!uri) return '';
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return uri.startsWith('file:') ? uri.replace(/^file:\/?\/?\/?/, 'file:///') : `file://${uri}`;
};

// Probe & lock base URL
const probeUrl = (baseURL) =>
  axios.get(`${baseURL}/api/v1/`, { timeout: 3000 })
    .then(() => baseURL)
    .catch(() => null);

let _probePromise = null;

export const probeAndLockBaseURL = async () => {
  if (aiApi.defaults.__locked) return aiApi.defaults.baseURL;
  if (_probePromise) return _probePromise;

  _probePromise = (async () => {
    for (const url of AI_API_BASE_URLS) {
      const result = await probeUrl(url);
      if (result) {
        aiApi.defaults.baseURL = result;
        aiApi.defaults.__locked = true;
        return result;
      }
    }
    _probePromise = null;
    return aiApi.defaults.baseURL;
  })();

  const resolved = await _probePromise;
  _probePromise = null;
  return resolved;
};

// Attach JWT token to requests
aiApi.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Response interceptor for dynamic retries
aiApi.interceptors.response.use(
  (response) => {
    const successBase = response?.config?.baseURL;
    if (successBase && aiApi.defaults.baseURL !== successBase) {
      aiApi.defaults.baseURL = successBase;
      aiApi.defaults.__locked = true;
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

    const currentUrl = originalRequest.baseURL || aiApi.defaults.baseURL;
    let currentIndex = AI_API_BASE_URLS.indexOf(currentUrl);
    if (currentIndex === -1) currentIndex = 0;

    const retryCount = (originalRequest.__retryCount ?? 0) + 1;
    if (retryCount >= AI_API_BASE_URLS.length) {
      aiApi.defaults.baseURL = AI_API_BASE_URLS[0];
      aiApi.defaults.__locked = false;
      throw error;
    }

    const nextIndex = (currentIndex + 1) % AI_API_BASE_URLS.length;
    originalRequest.__retryCount = retryCount;
    originalRequest.baseURL = AI_API_BASE_URLS[nextIndex];

    return aiApi.request(originalRequest);
  }
);

export const getAiBaseUrl = () => aiApi.defaults.baseURL || AI_API_BASE_URLS[0];

// ── API Endpoints ────────────────────────────────────────────────────────────

export const recommendLooks = async (file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: normalizeUri(file?.uri),
    name: file?.fileName || file?.name || 'upload.jpg',
    type: file?.type || 'image/jpeg',
  });

  const response = await aiApi.post('/api/v1/recommend/look', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const recommendArtists = async (profile) => {
  const response = await aiApi.post('/api/v1/recommend/artists', profile);
  return response.data;
};

export const refineRecommendations = async (faceShape, skinTone, undertone, measurements = null, landmarks = null) => {
  const response = await aiApi.post('/api/v1/recommend/refine', {
    face_shape: faceShape,
    skin_tone: skinTone,
    undertone: undertone,
    measurements,
    landmarks,
  });
  return response.data;
};

export const simulateMakeup = async (lookId, step, file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: normalizeUri(file?.uri),
    name: file?.fileName || file?.name || 'upload.jpg',
    type: file?.type || 'image/jpeg',
  });

  const response = await aiApi.post(`/api/v1/simulation/makeup?look_id=${lookId}&step=${step}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadPreviewSelfie = async (file) => {
  const formData = new FormData();
  formData.append('file', {
    uri: normalizeUri(file?.uri),
    name: file?.fileName || file?.name || 'upload.jpg',
    type: file?.type || 'image/jpeg',
  });

  const response = await aiApi.post('/api/v1/virtual-preview/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const validatePreviewSelfie = async (selfieId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/validate-image', { selfie_id: selfieId });
  return response.data;
};

export const analyzePreviewFace = async (selfieId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/analyze-face', { selfie_id: selfieId });
  return response.data;
};

export const sendPreviewChatMessage = async (selfieId, chatSessionId, message) => {
  const response = await aiApi.post('/api/v1/virtual-preview/chat', {
    selfie_id: selfieId,
    chat_session_id: chatSessionId,
    message,
  });
  return response.data;
};

export const submitPreviewPreferences = async (selfieId, preferences) => {
  const response = await aiApi.post('/api/v1/virtual-preview/submit-preferences', {
    selfie_id: selfieId,
    preferences,
  });
  return response.data;
};

export const generatePreviewPrompt = async (chatSessionId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/generate-prompt', {
    chat_session_id: chatSessionId,
  });
  return response.data;
};

export const generatePreview = async (selfieId, prompt, chatSessionId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/generate-preview', {
    selfie_id: selfieId,
    prompt,
    chat_session_id: chatSessionId,
  });
  return response.data;
};

export const getPreview = async (previewId) => {
  const response = await aiApi.get(`/api/v1/virtual-preview/preview/${previewId}`);
  return response.data;
};

export const applyVirtualTryon = async (params) => {
  const formData = new FormData();

  if (params.imageUri) {
    formData.append('file', {
      uri: normalizeUri(params.imageUri),
      name: params.imageName || 'selfie.jpg',
      type: params.imageType || 'image/jpeg',
    });
  } else if (params.image) {
    formData.append('file', {
      uri: params.image.startsWith('data:') ? params.image : `data:image/jpeg;base64,${params.image}`,
      name: 'selfie.jpg',
      type: 'image/jpeg',
    });
  }

  formData.append('lipstick', params.lipstick ? 'true' : 'false');
  formData.append('lipstickColor', params.lipstickColor || '');
  formData.append('lipstickStyle', params.lipstickStyle || '');
  formData.append('foundation', params.foundation ? 'true' : 'false');
  formData.append('foundationShade', params.foundationShade || '');
  formData.append('blush', params.blush ? 'true' : 'false');
  formData.append('blushColor', params.blushColor || '');
  formData.append('blushStyle', params.blushStyle || '');
  formData.append('eyeshadow', params.eyeshadow ? 'true' : 'false');
  formData.append('eyeshadowColor', params.eyeshadowColor || '');
  formData.append('eyeshadowStyle', params.eyeshadowStyle || '');
  formData.append('eyeliner', params.eyeliner ? 'true' : 'false');
  formData.append('eyelinerColor', params.eyelinerColor || '');
  formData.append('eyelinerStyle', params.eyelinerStyle || '');
  formData.append('eyelashes', params.eyelashes ? 'true' : 'false');
  formData.append('eyelashesStyle', params.eyelashesStyle || '');
  formData.append('contour', params.contour ? 'true' : 'false');
  formData.append('contourIntensity', String(params.contourIntensity || 50));
  formData.append('highlighter', params.highlighter ? 'true' : 'false');
  formData.append('eyebrow', params.eyebrow ? 'true' : 'false');
  formData.append('eyebrowColor', params.eyebrowColor || '');
  formData.append('intensity', String(params.intensity || 80));

  const response = await aiApi.post('/api/v1/virtual-tryon/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const recommendArtistsByImage = async (imageAsset) => {
  await probeAndLockBaseURL();
  const formData = new FormData();
  const fileUri = Platform.OS === 'android' ? imageAsset.uri : imageAsset.uri.replace('file://', '');

  formData.append('file', {
    uri: fileUri,
    type: imageAsset.type || 'image/jpeg',
    name: imageAsset.fileName || 'reference_image.jpg',
  });

  const response = await aiApi.post('/api/artist/recommend', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default aiApi;

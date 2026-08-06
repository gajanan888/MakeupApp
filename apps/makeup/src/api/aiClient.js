import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AI_API_BASE_URLS = [
  'http://172.19.11.224:5000',   // Active Wi-Fi IP (Current network host)
  'http://127.0.0.1:5000',       // adb reverse loopback (USB direct)
  'http://127.0.0.1:8000',       // adb reverse FastAPI loopback (USB direct)
  'http://192.168.29.130:5000',  // Active Wi-Fi IP (Current network host)
  'http://192.168.29.130:8000',  // Direct FastAPI port (Current network host)
  'http://10.146.237.172:5000',  // Old IP
  'http://10.206.40.172:5000',   // Old IP
  'http://10.167.216.212:5000',  // Old IP
  'http://10.236.17.172:5000',   // Old IP
  'http://192.168.29.53:5000',   // Old IP
  'http://localhost:5000',       // localhost fallback
  'http://10.0.2.2:5000',        // Android Emulator loopback
  'http://172.19.11.224:8000',   // Direct FastAPI port (Current)
  'http://10.146.237.172:8000',  // Direct FastAPI port
  'http://10.206.40.172:8000',   // Direct FastAPI port
  'http://10.167.216.212:8000',  // Direct FastAPI port
  'http://192.168.29.53:8000',   // Direct FastAPI port
];

const aiApi = axios.create({
  baseURL: AI_API_BASE_URLS[0],
  
  timeout: 30000,
});

// Fast probe: tests each base URL with a lightweight GET and a short timeout.
// Returns the first URL that responds, or null if all fail.
const probeUrl = (baseURL) =>
  axios.get(`${baseURL}/api/v1/`, { timeout: 3000 })
    .then(() => baseURL)
    .catch(() => null);

let _probePromise = null;

export const probeAndLockBaseURL = async () => {
  // If already locked to a working URL, skip
  if (aiApi.defaults.__locked) return aiApi.defaults.baseURL;

  // Deduplicate concurrent probes (e.g. if scan triggers while probe is in flight)
  if (_probePromise) return _probePromise;

  _probePromise = (async () => {
    console.log('[AI API] Probing for working server URL...');
    for (const url of AI_API_BASE_URLS) {
      const result = await probeUrl(url);
      if (result) {
        aiApi.defaults.baseURL = result;
        aiApi.defaults.__locked = true;
        console.log(`[AI API] Connected to: ${result}`);
        return result;
      }
      console.log(`[AI API] Unreachable: ${url}`);
    }
    console.warn('[AI API] No reachable server found. Using default.');
    _probePromise = null;
    return aiApi.defaults.baseURL;
  })();

  const resolved = await _probePromise;
  _probePromise = null;
  return resolved;
};

// Attach JWT token to every request
aiApi.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// On success: lock working URL; on network error: retry with other fallback URLs
aiApi.interceptors.response.use(
  (response) => {
    const successBase = response?.config?.baseURL;
    if (successBase && aiApi.defaults.baseURL !== successBase) {
      aiApi.defaults.baseURL = successBase;
      aiApi.defaults.__locked = true;
      console.log(`[AI API] Updated default baseURL to: ${successBase}`);
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

    console.log(`[AI API] Retrying request (attempt ${retryCount}) with: ${AI_API_BASE_URLS[nextIndex]}`);
    return aiApi.request(originalRequest);
  }
);


export const getAiBaseUrl = () => aiApi.defaults.baseURL || AI_API_BASE_URLS[0];


// ── API Endpoints ────────────────────────────────────────────────────────────

export const recommendLooks = async (file) => {
  const formData = new FormData();
  const uri = file?.uri || '';
  let normalizedUri = uri;
  
  if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
    if (uri.startsWith('file:')) {
      normalizedUri = uri.replace(/^file:\/?\/?\/?/, 'file:///');
    } else {
      normalizedUri = `file://${uri}`;
    }
  }

  formData.append('file', {
    uri: normalizedUri,
    name: file.fileName || file.name || 'upload.jpg',
    type: file.type || 'image/jpeg',
  });

  const response = await aiApi.post('/api/v1/recommend/look', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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
    measurements: measurements,
    landmarks: landmarks
  });
  return response.data;
};

export const simulateMakeup = async (lookId, step, file) => {
  const formData = new FormData();
  const uri = file?.uri || '';
  let normalizedUri = uri;
  
  if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
    if (uri.startsWith('file:')) {
      normalizedUri = uri.replace(/^file:\/?\/?\/?/, 'file:///');
    } else {
      normalizedUri = `file://${uri}`;
    }
  }

  formData.append('file', {
    uri: normalizedUri,
    name: file.fileName || file.name || 'upload.jpg',
    type: file.type || 'image/jpeg',
  });

  const response = await aiApi.post(`/api/v1/simulation/makeup?look_id=${lookId}&step=${step}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ── Virtual Makeup Preview Endpoints ─────────────────────────────────────────

export const uploadPreviewSelfie = async (file) => {
  const formData = new FormData();
  const uri = file?.uri || '';
  let normalizedUri = uri;
  
  if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
    if (uri.startsWith('file:')) {
      normalizedUri = uri.replace(/^file:\/?\/?\/?/, 'file:///');
    } else {
      normalizedUri = `file://${uri}`;
    }
  }

  formData.append('file', {
    uri: normalizedUri,
    name: file.fileName || file.name || 'upload.jpg',
    type: file.type || 'image/jpeg',
  });

  const response = await aiApi.post('/api/v1/virtual-preview/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const validatePreviewSelfie = async (selfieId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/validate-image', {
    selfie_id: selfieId,
  });
  return response.data;
};

export const analyzePreviewFace = async (selfieId) => {
  const response = await aiApi.post('/api/v1/virtual-preview/analyze-face', {
    selfie_id: selfieId,
  });
  return response.data;
};

export const sendPreviewChatMessage = async (selfieId, chatSessionId, message) => {
  const response = await aiApi.post('/api/v1/virtual-preview/chat', {
    selfie_id: selfieId,
    chat_session_id: chatSessionId,
    message: message,
  });
  return response.data;
};

export const submitPreviewPreferences = async (selfieId, preferences) => {
  const response = await aiApi.post('/api/v1/virtual-preview/submit-preferences', {
    selfie_id: selfieId,
    preferences: preferences,
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
    prompt: prompt,
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
    let uri = params.imageUri;
    let normalizedUri = uri;
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      if (uri.startsWith('file:')) {
        normalizedUri = uri.replace(/^file:\/?\/?\/?/, 'file:///');
      } else {
        normalizedUri = `file://${uri}`;
      }
    }
    formData.append('file', {
      uri: normalizedUri,
      name: params.imageName || 'selfie.jpg',
      type: params.imageType || 'image/jpeg',
    });
  } else if (params.image) {
    // Fallback if base64 is passed directly
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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default aiApi;

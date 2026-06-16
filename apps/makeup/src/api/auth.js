import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './client';

export const loginClient = async (email, password) => {
  const response = await api.post('/api/customer/auth/login', {
    email,
    password,
  });

  const payload = response?.data?.data;
  if (payload?.token) {
    await AsyncStorage.setItem('token', payload.token);
  }

  return payload;
};

export const registerClient = async data => {
  const response = await api.post('/api/customer/auth/register', data);

  const payload = response?.data?.data;
  if (payload?.token) {
    await AsyncStorage.setItem('token', payload.token);
  }

  return payload;
};

export const loginArtist = async (email, password) => {
  const response = await api.post('/api/artist/auth/login', {
    email,
    password,
  });

  const payload = response?.data?.data;
  if (payload?.token) {
    await AsyncStorage.setItem('token', payload.token);
  }

  return payload;
};

export const registerArtist = async data => {
  const response = await api.post('/api/artist/auth/register', data);

  const payload = response?.data?.data;
  if (payload?.token) {
    await AsyncStorage.setItem('token', payload.token);
  }

  return payload;
};

export const updateArtistProfile = async data => {
  const response = await api.put('/api/artist/profile', data);
  return response?.data?.data;
};

export const updateArtistProfileRaw = updateArtistProfile;

export const getArtistProfile = async () => {
  const response = await api.get('/api/artist/profile');
  return response?.data?.data;
};

export const sendOtp = async phone => {
  const response = await api.post('/api/otp/send', { phone });
  return response?.data;
};

export const verifyOtp = async (sessionId, otp) => {
  const response = await api.post('/api/otp/verify', { sessionId, otp });
  return response?.data;
};

export const getArtistDashboard = async () => {
  const response = await api.get('/api/artist/dashboard');
  return response?.data?.data;
};

export const getArtistSchedule = async () => {
  const response = await api.get('/api/artist/schedule');
  return response?.data?.data;
};

export const createArtistBlock = async data => {
  const response = await api.post('/api/artist/block', data);
  return response?.data?.data;
};

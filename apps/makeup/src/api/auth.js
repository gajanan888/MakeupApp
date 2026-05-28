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

export const registerClient = async (data) => {
  const response = await api.post('/api/customer/auth/register', data);

  const payload = response?.data?.data;
  if (payload?.token) {
    await AsyncStorage.setItem('token', payload.token);
  }

  return payload;
};

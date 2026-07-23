import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './client';

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const loginClient = async (email, password) => {
  const response = await api.post('/api/customer/auth/login', { email, password });
  const payload = response?.data?.data;

  if (payload?.token) await AsyncStorage.setItem('token', payload.token);
  if (payload?.name)  await AsyncStorage.setItem('customerName', payload.name);
  if (payload?.email) await AsyncStorage.setItem('customerEmail', payload.email);
  if (payload?.id)    await AsyncStorage.setItem('customerId', String(payload.id));
  await AsyncStorage.setItem('userRole', 'client');

  return payload;
};

export const registerClient = async (data) => {
  const response = await api.post('/api/customer/auth/register', data);
  const payload = response?.data?.data;

  if (payload?.token) await AsyncStorage.setItem('token', payload.token);
  if (payload?.name)  await AsyncStorage.setItem('customerName', payload.name);
  if (payload?.email) await AsyncStorage.setItem('customerEmail', payload.email);
  if (payload?.id)    await AsyncStorage.setItem('customerId', String(payload.id));
  await AsyncStorage.setItem('userRole', 'client');

  return payload;
};

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const loginArtist = async (email, password) => {
  const response = await api.post('/api/artist/auth/login', { email, password });
  const payload = response?.data?.data;

  if (payload?.token) await AsyncStorage.setItem('token', payload.token);
  await AsyncStorage.setItem('userRole', 'artist');

  return payload;
};

export const registerArtist = async (data) => {
  const response = await api.post('/api/artist/auth/register', data);
  const payload = response?.data?.data;

  if (payload?.token) await AsyncStorage.setItem('token', payload.token);
  await AsyncStorage.setItem('userRole', 'artist');

  return payload;
};

export const verifyEmailOtp = async (email, code) => {
  const response = await api.post('/api/artist/auth/verify-email', { email, code });
  return response?.data;
};

export const sendEmailOtp = async (email, name) => {
  const response = await api.post('/api/artist/auth/send-email-otp', { email, name });
  return response?.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST PROFILE & DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const getArtistProfile     = async ()     => (await api.get('/api/artist/profile'))?.data?.data;
export const updateArtistProfile  = async (data) => (await api.put('/api/artist/profile', data))?.data?.data;
export const updateArtistProfileRaw = updateArtistProfile;
export const getArtistDashboard   = async ()     => (await api.get('/api/artist/dashboard'))?.data?.data;
export const getArtistSchedule    = async ()     => (await api.get('/api/artist/schedule'))?.data?.data;
export const createArtistBlock    = async (data) => (await api.post('/api/artist/block', data))?.data?.data;
export const changeArtistPassword = async (currentPassword, newPassword) =>
  (await api.put('/api/artist/change-password', { currentPassword, newPassword }))?.data;

// ─────────────────────────────────────────────────────────────────────────────
// OTP
// ─────────────────────────────────────────────────────────────────────────────

export const sendOtp   = async (phone)            => (await api.post('/api/otp/send', { phone }))?.data;
export const verifyOtp = async (sessionId, otp)   => (await api.post('/api/otp/verify', { sessionId, otp }))?.data;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — ARTISTS SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const getArtists = async (filters = {}) => {
  const response = await api.get('/api/customer/artists', { params: filters });
  return response?.data?.data ?? response?.data ?? [];
};

export const getTrendingArtists = async () => {
  const response = await api.get('/api/customer/trending-artists');
  return response?.data?.data ?? response?.data ?? [];
};

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const getArtistBookings    = async ()           => (await api.get('/api/booking/artist'))?.data?.data?.items || (await api.get('/api/booking/artist'))?.data?.data || [];
export const acceptArtistBooking  = async (id)         => (await api.patch(`/api/booking/${id}/accept`))?.data;
export const rejectArtistBooking  = async (id, reason) => (await api.patch(`/api/booking/${id}/reject`, { reason }))?.data;
export const startArtistBooking   = async (id)         => (await api.patch(`/api/booking/${id}/start`))?.data;
export const completeArtistBooking = async (id)        => (await api.patch(`/api/booking/${id}/complete`))?.data;
export const cancelArtistBooking  = async (id, reason) => (await api.patch(`/api/booking/${id}/cancel-by-artist`, { reason }))?.data;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export const createCustomerBooking = async (data) => (await api.post('/api/booking', data))?.data?.data;
export const getArtistBookedSlots = async (artistId) => (await api.get(`/api/booking/artist/${artistId}/booked-slots`))?.data?.data || [];
export const getCustomerBookings   = async () => {
  const response = await api.get('/api/booking/customer');
  return response?.data?.data?.items || response?.data?.data || [];
};
export const cancelCustomerBooking = async (id) => (await api.patch(`/api/booking/${id}/cancel`))?.data;
export const payCustomerBookingAdvance = async (id) => (await api.post(`/api/booking/${id}/pay-advance`))?.data;
export const createRazorpayOrder = async (id) => (await api.post(`/api/booking/${id}/razorpay-order`))?.data?.data;
export const verifyRazorpayPayment = async (id, data) => (await api.post(`/api/booking/${id}/verify-payment`, data))?.data?.data;
export const declineCustomerBookingAdvance = async (id) => (await api.post(`/api/booking/${id}/decline-advance`))?.data;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const getCustomerProfile    = async ()     => (await api.get('/api/customer/profile'))?.data;
export const updateCustomerProfile = async (data) => (await api.put('/api/customer/profile', data))?.data?.data;

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGING
// ─────────────────────────────────────────────────────────────────────────────

export const getArtistConversations  = async ()     => (await api.get('/api/messages/artist/conversations'))?.data?.data  || [];
export const sendArtistMessage       = async (data) => (await api.post('/api/messages/artist/send', data))?.data?.data;
export const getCustomerConversations = async ()    => (await api.get('/api/messages/customer/conversations'))?.data?.data || [];
export const sendCustomerMessage     = async (data) => (await api.post('/api/messages/customer/send', data))?.data?.data;

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export const submitBookingReview = async (bookingId, rating, comment) => {
  const response = await api.post(`/api/booking/${bookingId}/review`, { rating, comment });
  return response?.data;
};

export const getArtistReviews = async (artistId) => {
  const response = await api.get(`/api/booking/artist/${artistId}/reviews`);
  return response?.data?.data || [];
};

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { createCustomerBooking } from '../../api/auth';

const BookingConfirmationScreen = ({ navigation, route }) => {
  const {
    artist,
    selectedService,
    selectedLocation,
    selectedDate,
    selectedTime,
    dateStr,
    selectedAddons = [],
    addonsTotal = 0,
  } = route?.params || {};

  const servicePrice = selectedService?.price || 0;
  // Parse clean numbers from strings if they contain currency symbols
  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
  };
  const numericServicePrice = parseAmount(servicePrice);
  const numericAddonsTotal = parseAmount(addonsTotal);
  const total = numericServicePrice + numericAddonsTotal;

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Format date to YYYY-MM-DD
      let apiDate = selectedDate;
      if (selectedDate) {
        const dObj = new Date(selectedDate);
        if (!isNaN(dObj.getTime())) {
          const year = dObj.getFullYear();
          const month = String(dObj.getMonth() + 1).padStart(2, '0');
          const day = String(dObj.getDate()).padStart(2, '0');
          apiDate = `${year}-${month}-${day}`;
        }
      }

      // Format time to 24h HH:MM format
      let apiTime = selectedTime;
      if (selectedTime && (selectedTime.includes('AM') || selectedTime.includes('PM'))) {
        const parts = selectedTime.trim().split(/\s+/);
        if (parts.length === 2) {
          const timeParts = parts[0].split(':');
          if (timeParts.length === 2) {
            let hour = parseInt(timeParts[0], 10);
            const minute = timeParts[1];
            const ampm = parts[1].toUpperCase();
            if (ampm === 'PM' && hour < 12) {
              hour += 12;
            } else if (ampm === 'AM' && hour === 12) {
              hour = 0;
            }
            apiTime = `${String(hour).padStart(2, '0')}:${minute}`;
          }
        }
      }

      const bookingData = {
        artistId: artist.id,
        date: apiDate,
        time: apiTime,
        category: selectedService?.name || selectedService,
        price: total,
        location: typeof selectedLocation === 'string' ? selectedLocation : selectedLocation?.address || 'At Client Location',
        addOns: selectedAddons,
        totalPaid: 0,
      };

      await createCustomerBooking(bookingData);
      
      Alert.alert(
        'Request Sent',
        'Your booking request has been sent to the artist. You can monitor the status under the Bookings tab.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'CustomerBookings' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.warn('Booking request failed', error);
      const errMsg = error.response?.data?.message || 
                     (error.response?.data?.data?.errors && error.response.data.data.errors.join('\n')) ||
                     error.message || 
                     'Could not send booking request. Please try again.';
      Alert.alert('Request Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScreenHeader
        title="Review & Confirm"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Artist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artist</Text>
          <Text style={styles.detail}>{artist?.name || 'N/A'}</Text>
        </View>
        {/* Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Text style={styles.detail}>{selectedService?.name || 'N/A'}</Text>
          <Text style={styles.price}>₹{servicePrice}</Text>
        </View>
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.detail}>
            {selectedLocation?.address || 'N/A'}
          </Text>
        </View>
        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>
          <Text style={styles.detail}>{dateStr || selectedDate}</Text>
          <Text style={styles.detail}>Time: {selectedTime}</Text>
        </View>
        {/* Add‑ons */}
        {selectedAddons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add‑ons</Text>
            {selectedAddons.map(a => (
              <View key={a.id} style={styles.addonRow}>
                <Text style={styles.addonName}>{a.name}</Text>
                <Text style={styles.addonPrice}>+₹{a.price}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{total}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { backgroundColor: '#FFA7C4' }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Send Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingConfirmationScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  content: { paddingHorizontal: 24, paddingVertical: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: '#888', marginBottom: 4 },
  detail: { fontSize: 15, color: '#333' },
  price: { fontSize: 15, fontWeight: '600', color: '#FF4F87', marginTop: 2 },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  addonName: { fontSize: 14, color: '#555' },
  addonPrice: { fontSize: 14, color: '#FF4F87' },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#111' },
  totalAmount: { fontSize: 16, fontWeight: '700', color: '#FF4F87' },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 20 : 28,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  confirmBtn: {
    backgroundColor: '#FF4F87',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

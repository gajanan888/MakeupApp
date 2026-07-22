import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const peopleCount = selectedService?.peopleCount || 1;
  // Parse clean numbers from strings if they contain currency symbols
  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
  };
  const numericServicePrice = parseAmount(servicePrice) * peopleCount;
  const numericAddonsTotal = parseAmount(addonsTotal);
  const total = numericServicePrice + numericAddonsTotal;

  const [loading, setLoading] = useState(false);
  const [isConsentChecked, setIsConsentChecked] = useState(false);

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

      // Format time to 24h HH:MM format (handles slot range strings like "Afternoon Slot (11:00 AM - 3:00 PM)")
      let apiTime = '11:00';
      if (selectedTime) {
        const str = String(selectedTime);
        if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(str.trim())) {
          apiTime = str.trim();
        } else {
          const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (match) {
            let hour = parseInt(match[1], 10);
            const min = match[2];
            const ampm = match[3] ? match[3].toUpperCase() : null;
            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            apiTime = `${String(hour).padStart(2, '0')}:${min}`;
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
                routes: [{ name: 'ClientHome', params: { activeTab: 'Bookings' } }],
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <Text style={styles.detail}>
            {selectedService?.name || (typeof selectedService === 'string' ? selectedService : 'N/A')}
            {peopleCount > 1 ? ` (×${peopleCount} People)` : ''}
          </Text>
          <Text style={styles.price}>₹{numericServicePrice.toLocaleString('en-IN')}</Text>
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
          <Text style={styles.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
        </View>

        {/* Health & Liability Disclaimer Consent */}
        <View style={styles.consentCard}>
          <TouchableOpacity
            style={styles.consentCheckRow}
            onPress={() => setIsConsentChecked(!isConsentChecked)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isConsentChecked ? 'checkbox' : 'square-outline'}
              size={22}
              color={isConsentChecked ? '#FF4F87' : '#888'}
              style={{ marginRight: 10, marginTop: 2 }}
            />
            <Text style={styles.consentTitle}>
              Health & Safety Consent Disclaimer
            </Text>
          </TouchableOpacity>

          <View style={styles.consentDetailsBox}>
            <Text style={styles.consentText}>
              • The platform acts solely as an intermediary connecting clients with independent beauty artists.{'\n'}
              • <Text style={{ fontWeight: '700', color: '#222' }}>The platform is not liable or responsible for any skin reactions, allergies, infections, or dermatological issues</Text> occurring during or after the service.{'\n'}
              • Clients are advised to inform the artist prior to service regarding any pre-existing skin conditions or product sensitivities.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!isConsentChecked || loading) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!isConsentChecked || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.confirmBtnText, !isConsentChecked && styles.confirmBtnTextDisabled]}>
              Send Request
            </Text>
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
  confirmBtnDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  confirmBtnTextDisabled: { color: '#999999' },
  consentCard: {
    backgroundColor: '#FAF7F9',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E2EB',
  },
  consentCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginTop: 2,
  },
  consentDetailsBox: {
    paddingLeft: 32,
  },
  consentText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});

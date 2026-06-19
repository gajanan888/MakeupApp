import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';

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
  const total = servicePrice + addonsTotal;

  const handleConfirm = () => {
    navigation.navigate('Payment', {
      artist,
      selectedService,
      selectedLocation,
      selectedDate,
      selectedTime,
      dateStr,
      selectedAddons,
      addonsTotal,
    });
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
          <Text style={styles.price}>${servicePrice}</Text>
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
                <Text style={styles.addonPrice}>+${a.price}</Text>
              </View>
            ))}
          </View>
        )}
        {/* Total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${total}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm Booking</Text>
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

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
import { createCustomerBooking } from '../../api/auth';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit / Debit Card', icon: 'card-outline', color: '#FF4F87' },
  { id: 'upi', name: 'UPI', icon: 'cash-outline', color: '#4CAF50' },
  { id: 'paypal', name: 'PayPal', icon: 'logo-paypal', color: '#003087' },
  { id: 'apple_pay', name: 'Apple Pay', icon: 'logo-apple', color: '#000000' },
  { id: 'google_pay', name: 'Google Pay', icon: 'logo-google', color: '#DB4437' },
];

const PaymentScreen = ({ navigation, route }) => {
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

  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      const bookingData = {
        artistId: artist.id,
        date: selectedDate,
        time: selectedTime,
        category: selectedService?.name,
        price: servicePrice,
        location: selectedLocation?.address,
        addOns: selectedAddons,
        totalPaid: total,
      };
      await createCustomerBooking(bookingData);
      
      navigation.navigate('BookingSuccess', {
        artist,
        selectedService,
        selectedLocation,
        selectedDate,
        selectedTime,
        dateStr,
        totalPaid: total,
      });
    } catch (error) {
      console.warn('Booking failed', error);
      Alert.alert('Booking Failed', 'There was an error processing your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* Total Amount Section */}
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>${total}</Text>

          <Text style={styles.methodLabel}>Select Payment Method</Text>

          {/* Payment Methods */}
          <View style={styles.methodsContainer}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodRow, isSelected && styles.methodRowActive]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.methodLeft}>
                    <Ionicons name={method.icon} size={24} color={method.color} style={styles.methodIcon} />
                    <Text style={styles.methodName}>{method.name}</Text>
                  </View>
                  
                  {/* Radio Button */}
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.payBtnText}>Pay ${total}</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.secureContainer}>
          <Ionicons name="lock-closed" size={14} color="#888" />
          <Text style={styles.secureText}>Secure Payment</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  methodsContainer: {
    gap: 8,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodRowActive: {
    backgroundColor: '#FFF5F8',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 30,
    marginRight: 12,
  },
  methodName: {
    fontSize: 15,
    color: '#333',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D8D8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#FF4F87',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4F87',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  payBtn: {
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
  payBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  secureText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});

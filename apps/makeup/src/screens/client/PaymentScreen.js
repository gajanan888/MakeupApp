import React, { useState } from 'react';
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
import Ionicons from '@react-native-vector-icons/ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import { 
  createCustomerBooking, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../../api/auth';

const PAYMENT_METHODS = [
  { id: 'razorpay', name: 'Pay with Razorpay', icon: 'card-outline', color: '#3395FF' },
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
    isAdvancePayment = false,
    bookingId = null,
    advanceAmount = 0,
    hasInsurance = false,
    insuranceFee = 0,
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
  const numericInsuranceFee = hasInsurance ? (insuranceFee || 1000) : (insuranceFee || 0);
  
  const total = isAdvancePayment ? advanceAmount : (numericServicePrice + numericAddonsTotal + numericInsuranceFee);

  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      if (isAdvancePayment) {
        // 1. Create Order
        const orderData = await createRazorpayOrder(bookingId);
        if (!orderData || !orderData.orderId) {
          throw new Error('Failed to retrieve order ID from server.');
        }

        // 2. Open Razorpay Checkout
        const options = {
          description: 'Booking Advance Payment',
          image: 'https://res.cloudinary.com/djonmzyiu/image/upload/v1/logo',
          currency: orderData.currency,
          key: orderData.keyId,
          amount: orderData.amount * 100,
          name: 'MakeupApp',
          order_id: orderData.orderId,
          theme: { color: '#FF4F87' },
        };

        const data = await RazorpayCheckout.open(options);

        // 3. Verify Payment
        await verifyRazorpayPayment(bookingId, {
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature,
        });

        Alert.alert(
          'Payment Successful',
          'Your 10% advance payment has been processed. The booking is now confirmed!',
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
        return;
      }

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
        location: selectedLocation?.address || selectedLocation,
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
      console.warn('Booking/Payment failed', error);
      let errMsg = 'There was an error processing your payment. Please try again.';
      
      if (error.isAxiosError || error.response) {
        // Backend / API Error
        errMsg = error.response?.data?.message || 
                 (error.response?.data?.data?.errors && error.response.data.data.errors.join('\n')) ||
                 error.message || errMsg;
      } else if (error.code) {
        // Razorpay SDK error (e.g. user cancelled)
        errMsg = error.description || error.error?.description || 'Payment cancelled or failed.';
      } else {
        errMsg = error.message || errMsg;
      }
      
      Alert.alert('Payment Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <Text style={styles.totalLabel}>
            {isAdvancePayment ? 'Advance Payment Due' : 'Total Amount'}
          </Text>
          <Text style={styles.totalAmount}>₹{total}</Text>

          {/* Breakdown for Advance Payment */}
          {isAdvancePayment && (
            <View style={styles.breakdownBox}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>10% Service Advance</Text>
                <Text style={styles.breakdownValue}>
                  ₹{Math.max(0, total - (numericInsuranceFee > 0 ? numericInsuranceFee : 0))}
                </Text>
              </View>
              {(numericInsuranceFee > 0 || hasInsurance) && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Ensurance Guarantee Fee</Text>
                  <Text style={styles.breakdownValue}>+₹{numericInsuranceFee || 1000}</Text>
                </View>
              )}
            </View>
          )}

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
            <Text style={styles.payBtnText}>Pay ₹{total}</Text>
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
  breakdownBox: {
    backgroundColor: '#FFF5F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD6E3',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4F87',
  },
});

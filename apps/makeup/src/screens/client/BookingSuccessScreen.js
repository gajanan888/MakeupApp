import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const BookingSuccessScreen = ({ navigation, route }) => {
  const {
    artist,
    selectedService,
    selectedLocation,
    selectedDate,
    selectedTime,
    dateStr,
    totalPaid = 0,
  } = route?.params || {};

  const handleViewBookings = () => {
    // Navigate to the user's bookings tab/screen.
    // Ensure 'CustomerBookings' exists in your navigation stack.
    navigation.navigate('CustomerBookings');
  };

  const handleAddToCalendar = () => {
    // TODO: Implement actual calendar addition.
    // For now, go back to home as a placeholder action.
    navigation.navigate('ClientHome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark" size={48} color="#FFF" />
          </View>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your appointment has been{'\n'}successfully booked.
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.card}>
          {/* Artist Info */}
          <View style={styles.artistRow}>
            {artist?.profileImage ? (
              <Image source={{ uri: artist.profileImage }} style={styles.artistImage} />
            ) : (
              <View style={[styles.artistImage, styles.placeholderImage]}>
                <Ionicons name="person" size={24} color="#CCC" />
              </View>
            )}
            <View style={styles.artistInfo}>
              <Text style={styles.artistName}>{artist?.name || 'Artist Name'}</Text>
              <Text style={styles.serviceName}>
                {selectedService?.name || (typeof selectedService === 'string' ? selectedService : 'Service Name')}
              </Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{dateStr || selectedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{selectedTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{selectedLocation?.address || 'At Your Location'}</Text>
          </View>

          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.detailIcon} />
            <View>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalAmount}>₹{totalPaid}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewBookings}>
          <Text style={styles.primaryBtnText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddToCalendar}>
          <Text style={styles.secondaryBtnText}>Add to Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingSuccessScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  artistImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginRight: 16,
  },
  placeholderImage: {
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lastDetailRow: {
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 24,
    marginRight: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
    paddingTop: 16,
    backgroundColor: '#FFF',
  },
  primaryBtn: {
    backgroundColor: '#FF4F87',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  secondaryBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

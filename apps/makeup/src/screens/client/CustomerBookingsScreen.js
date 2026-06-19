import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getCustomerBookings, cancelCustomerBooking } from '../../api/auth';
import BottomNavigation from '../../components/BottomNavigation';

const CustomerBookingsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Upcoming'); // 'Upcoming' | 'Past' | 'Cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getCustomerBookings();
      
      const mapped = data.map(b => {
        let tabGroup = 'Upcoming';
        if (b.status === 'completed') {
          tabGroup = 'Past';
        } else if (b.status === 'cancelled' || b.status === 'rejected') {
          tabGroup = 'Cancelled';
        }

        const avatars = [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
          'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=80',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        ];
        const avatar = avatars[Number(b.artistId) % avatars.length];

        let dateText = '';
        if (b.date) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const parts = b.date.split('-');
          if (parts.length === 3) {
            const year = parts[0];
            const month = months[parseInt(parts[1], 10) - 1] || 'Jan';
            const day = parseInt(parts[2], 10);
            dateText = `${day} ${month} ${year}`;
          } else {
            dateText = b.date;
          }
        }
        const formattedDate = b.time ? `${dateText} • ${b.time}` : dateText;

        return {
          id: String(b.id),
          artistName: b.artist?.name || 'Makeup Artist',
          category: b.category || 'Makeup Service',
          date: formattedDate,
          location: b.location || 'At Client Location',
          price: `$${b.totalPaid || b.price || 0}`,
          tabGroup,
          rawStatus: b.status,
          avatar,
        };
      });

      setBookings(mapped);
    } catch (error) {
      console.warn('Failed to fetch customer bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { 
          text: 'Cancel Appointment', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelCustomerBooking(bookingId);
              Alert.alert('Cancelled', 'Your appointment has been successfully cancelled.');
              await fetchBookings();
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to cancel appointment.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredBookings = bookings.filter(b => b.tabGroup === activeTab);

  const getBadgeColors = (rawStatus) => {
    switch (rawStatus) {
      case 'pending':
        return { bg: '#F9F0FF', text: '#531DAB', label: 'Pending' };
      case 'accepted':
        return { bg: '#E6F7FF', text: '#0050B3', label: 'Confirmed' };
      case 'in_progress':
        return { bg: '#FFF7E6', text: '#D46B08', label: 'In Progress' };
      case 'completed':
        return { bg: '#F6FFED', text: '#389E0D', label: 'Completed' };
      case 'rejected':
        return { bg: '#FFF1F0', text: '#CF1322', label: 'Declined' };
      case 'cancelled':
        return { bg: '#FFF1F0', text: '#CF1322', label: 'Cancelled' };
      default:
        return { bg: '#F5F5F5', text: '#555555', label: rawStatus };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsContainer}>
        {['Upcoming', 'Past', 'Cancelled'].map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BOOKINGS LIST */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF4F87" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {filteredBookings.length > 0 ? (
            filteredBookings.map(booking => {
              const badgeColors = getBadgeColors(booking.rawStatus);
              const showCancelBtn = ['pending', 'accepted'].includes(booking.rawStatus);

              return (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: booking.avatar }} style={styles.avatar} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.artistName}>{booking.artistName}</Text>
                      <Text style={styles.categoryText}>{booking.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColors.text }]}>
                        {badgeColors.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardBody}>
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={14} color="#8A7D77" />
                      <Text style={styles.metaText}>{booking.date}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color="#8A7D77" />
                      <Text style={styles.metaText}>{booking.location}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.priceValue}>{booking.price}</Text>
                    </View>
                  </View>

                  {showCancelBtn && (
                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={64} color="#FFD1E1" />
              <Text style={styles.emptyTitle}>No {activeTab} Bookings</Text>
              <Text style={styles.emptySubtitle}>
                You don't have any appointments categorized as {activeTab.toLowerCase()} at this time.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* BOTTOM NAVIGATION */}
      <BottomNavigation navigation={navigation} activeTab="Bookings" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 10,
    height: Platform.OS === 'ios' ? 60 : 60 + (StatusBar.currentHeight || 0),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#FF4F87',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
  },
  activeTabText: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FFE6EF',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  categoryText: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3ECF0',
    marginVertical: 12,
  },
  cardBody: {
    paddingHorizontal: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
    fontFamily: 'serif',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4F87',
    fontFamily: 'serif',
  },
  cardFooter: {
    marginTop: 14,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#FF4F87',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 15,
    fontFamily: 'serif',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8A7D77',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'serif',
  },
});

export default CustomerBookingsScreen;

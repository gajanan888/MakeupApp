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
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { getArtistDashboard, getArtistProfile } from '../../api/auth';
import ArtistBookingDetailModal from './ArtistBookingDetailModal';

const ArtistDashboardScreen = ({ onNavigate }) => {
  const navigation = useNavigation();
  const [locationName, setLocationName] = useState('Detecting location...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, totalEarnings: 0, rating: 4.8 },
    upcomingBookings: []
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchProfileData = async () => {
      try {
        const data = await getArtistProfile();
        if (active && data && data.profile && data.profile.profileImage) {
          setProfileImage(data.profile.profileImage);
        }
      } catch (error) {
        console.warn('Failed to fetch profile in dashboard:', error);
      }
    };
    fetchProfileData();
    return () => {
      active = false;
    };
  }, []);

  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) setLoadingDashboard(true);
      const data = await getArtistDashboard();
      if (data) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      if (showLoading) setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  useEffect(() => {
    let active = true;

    const requestLocationPermission = async () => {
      if (Platform.OS === 'ios') {
        return true;
      }
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location to show it on your dashboard.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    };

    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        if (active) {
          setLocationName('Permission Denied');
          setLoadingLocation(false);
        }
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://us1.locationiq.com/v1/reverse?key=pk.a74ba553bc5de1a0d26527268257f8d4&lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            if (active) {
              if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
                const suburb = addr.suburb || addr.neighbourhood || addr.district || '';
                let displayLoc = '';
                if (suburb && city) {
                  displayLoc = `${suburb}, ${city}`;
                } else if (city) {
                  displayLoc = city;
                } else {
                  displayLoc = data.display_name || 'Location detected';
                }
                setLocationName(displayLoc);
              } else {
                setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              }
              setLoadingLocation(false);
            }
          } catch (error) {
            console.error(error);
            if (active) {
              setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              setLoadingLocation(false);
            }
          }
        },
        (error) => {
          console.error(error);
          if (active) {
            setLocationName('Unavailable');
            setLoadingLocation(false);
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    };

    fetchLocation();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenBookingDetail = (b) => {
    const avatars = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200',
    ];
    const avatar = avatars[Number(b.customerId) % avatars.length];
    
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

    let mappedStatus = 'Upcoming';
    if (b.status === 'completed') {
      mappedStatus = 'Completed';
    } else if (b.status === 'cancelled' || b.status === 'rejected') {
      mappedStatus = 'Cancelled';
    }

    const detailObj = {
      id: String(b.id),
      customerId: b.customerId,
      name: b.customer?.name || 'Client',
      category: b.category || 'Makeup Service',
      date: formattedDate,
      location: b.location || 'At Client Location',
      price: `₹${b.price || 0}`,
      status: mappedStatus,
      rawStatus: b.status,
      phone: b.customer?.phone || '',
      address: b.location || 'At Client Location',
      avatar,
      rawDate: b.date,
      rawTime: b.time,
    };
    setSelectedBooking(detailObj);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => onNavigate && onNavigate('Profile')}>
          <Image source={{ uri: profileImage }} style={styles.profileHeaderImage} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.locationContainer}>
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#FF4F8F" style={{ marginRight: 4, transform: [{ scale: 0.7 }] }} />
            ) : (
              <Ionicons name="location-outline" size={12} color="#FF4F8F" style={{ marginRight: 2 }} />
            )}
            <Text style={styles.locationText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#111" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* EARNINGS CARD */}
      <View style={styles.earningsCard}>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <TouchableOpacity style={styles.dropdownSelector}>
            <Text style={styles.dropdownText}>This Month</Text>
            <Ionicons name="chevron-down" size={12} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <Text style={styles.earningsAmount}>₹{dashboardData.stats.totalEarnings}</Text>

        <Text style={styles.earningsTrend}>
          <Text style={styles.trendGreen}>+0.0% </Text>
          vs last month
        </Text>
      </View>

      {/* STATS GRID */}
      <View style={styles.statsGrid}>
        {/* Bookings */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bookings</Text>
          <Text style={styles.statValue}>{dashboardData.stats.totalBookings}</Text>
          <Text style={styles.trendUp}>+0%</Text>
        </View>

        {/* Completed */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{dashboardData.stats.completedBookings}</Text>
          <Text style={styles.trendUp}>+0%</Text>
        </View>

        {/* Cancelled */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cancelled</Text>
          <Text style={styles.statValue}>{dashboardData.stats.cancelledBookings}</Text>
          <Text style={styles.trendDown}>-0%</Text>
        </View>

        {/* Reviews */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reviews</Text>
          <Text style={styles.statValue}>{dashboardData.stats.rating}</Text>
          <View style={styles.starsRow}>
            <Ionicons name="star" size={10} color="#FFA000" />
            <Text style={{ fontSize: 9, color: '#8A7D77', marginLeft: 2 }}>rating</Text>
          </View>
        </View>
      </View>

      {/* UPCOMING BOOKING */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Booking</Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('Bookings')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {dashboardData.upcomingBookings.length > 0 ? (
        dashboardData.upcomingBookings.map((booking) => (
          <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => handleOpenBookingDetail(booking)}>
            <Image
              source={{
                uri: [
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
                  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200',
                ][(booking.customerId || 0) % 4],
              }}
              style={styles.clientAvatar}
            />

            <View style={styles.bookingDetails}>
              <View style={styles.clientNameRow}>
                <Text style={styles.clientName}>{booking.customer?.name || 'Client'}</Text>
                <Ionicons name="sparkles" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
              </View>
              
              <Text style={styles.bookingCategory}>{booking.category || 'Bridal Makeup'}</Text>
              
              <View style={styles.bookingMetaRow}>
                <Ionicons name="calendar-outline" size={12} color="#777" />
                <Text style={styles.bookingMetaText}>{booking.date} • {booking.time}</Text>
              </View>

              <View style={styles.bookingMetaRow}>
                <Ionicons name="cash-outline" size={12} color="#777" style={{ marginRight: 2 }} />
                <Text style={styles.bookingMetaText}>₹{booking.price || 0}</Text>
              </View>
            </View>

            <View style={styles.bookingBadgeContainer}>
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingBadgeText}>{booking.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={[styles.bookingCard, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={styles.bookingCategory}>No upcoming bookings</Text>
        </View>
      )}

      {/* QUICK ACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.actionsRow}>
        {/* Action 1 */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onNavigate && onNavigate('Bookings')}>
          <View style={styles.actionCircle}>
            <Ionicons name="calendar-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>New Booking</Text>
        </TouchableOpacity>

        {/* Action 2 */}
        <TouchableOpacity style={styles.actionItem} onPress={() => onNavigate && onNavigate('Calendar')}>
          <View style={styles.actionCircle}>
            <Ionicons name="time-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>My Calendar</Text>
        </TouchableOpacity>

        {/* Action 3 */}
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ArtistMessage')}>
          <View style={styles.actionCircle}>
            <Ionicons name="chatbubbles-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>Messages</Text>
        </TouchableOpacity>

        {/* Action 4 */}
        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionCircle}>
            <Ionicons name="megaphone-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>Promote</Text>
        </TouchableOpacity>
      </View>

      <ArtistBookingDetailModal 
        visible={selectedBooking !== null} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking} 
        onStatusUpdate={() => fetchDashboardData(false)} 
        onChatPress={(b) => navigation.navigate('ArtistMessage', { customerId: b.customerId })} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 25,
    backgroundColor: '#FCFCFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 10,
    height: Platform.OS === 'ios' ? 60 : 60 + (StatusBar.currentHeight || 0),
    backgroundColor: '#FCFCFC',
  },

  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  locationText: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    maxWidth: 160,
  },

  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },

  earningsCard: {
    backgroundColor: '#531830',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: '#531830',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },

  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  earningsLabel: {
    fontSize: 14,
    color: '#FFC3D6',
    fontFamily: 'serif',
  },

  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  dropdownText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'serif',
  },

  earningsAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
    marginTop: 10,
  },

  earningsTrend: {
    fontSize: 13,
    color: '#FFC3D6',
    fontFamily: 'serif',
    marginTop: 8,
  },

  trendGreen: {
    color: '#32C766',
    fontWeight: '700',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },

  statCard: {
    width: '23%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  statLabel: {
    fontSize: 10,
    color: '#8A7D77',
    fontFamily: 'serif',
    textAlign: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginTop: 6,
    marginBottom: 4,
  },

  trendUp: {
    fontSize: 10,
    color: '#32C766',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  trendDown: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  seeAllText: {
    fontSize: 14,
    color: '#FF4F8F',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  clientAvatar: {
    width: 65,
    height: 75,
    borderRadius: 12,
    alignSelf: 'center',
  },

  bookingDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  bookingCategory: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
    marginBottom: 6,
  },

  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  bookingMetaText: {
    fontSize: 11,
    color: '#555',
    marginLeft: 6,
    fontFamily: 'serif',
  },

  bookingBadgeContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  upcomingBadge: {
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  upcomingBadgeText: {
    fontSize: 10,
    color: '#0958D9',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 20,
  },

  actionItem: {
    alignItems: 'center',
    width: '23%',
  },

  actionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE5EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  actionLabel: {
    fontSize: 11,
    color: '#111',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'serif',
  },

  profileHeaderImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF4F8F',
  },
});

export default ArtistDashboardScreen;

import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { getArtistDashboard, getArtistProfile } from '../../api/auth';
import ArtistBookingDetailModal from './ArtistBookingDetailModal';
import ArtistAddExtraClientsModal from './ArtistAddExtraClientsModal';
import { getUserProfileImage, DEFAULT_AVATAR } from '../../utils/artistImageHelper';

const ArtistDashboardScreen = ({ onNavigate }) => {
  const navigation = useNavigation();
  const [locationName, setLocationName] = useState('Detecting location...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: { totalBookings: 0, completedBookings: 0, cancelledBookings: 0, totalEarnings: 0, rating: 4.8 },
    upcomingBookings: []
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [profileImage, setProfileImage] = useState(DEFAULT_AVATAR);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [addClientsModalVisible, setAddClientsModalVisible] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchProfileData = async () => {
      try {
        const data = await getArtistProfile();
        if (active && data) {
          setArtistProfile(data);
          if (data.profile && data.profile.profileImage) {
            setProfileImage(data.profile.profileImage);
          }
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

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData(false);
    }, [])
  );

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
    const avatar = getUserProfileImage(b.customer);
    
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

    let addOnsList = [];
    if (b.addOns) {
      if (Array.isArray(b.addOns)) {
        addOnsList = b.addOns;
      } else if (typeof b.addOns === 'object') {
        addOnsList = [b.addOns];
      }
    }

    const numericPrice = typeof b.price === 'number' ? b.price : (parseFloat(String(b.price || 0).replace(/[^0-9.]/g, '')) || 0);
    const hasInsurance = !!(b.hasInsurance || b.backupArtistId || b.backupArtist);
    const insuranceFee = hasInsurance ? (b.insuranceFee || 1000) : 0;
    const basePrice = Math.max(0, numericPrice - insuranceFee);

    const detailObj = {
      id: String(b.id),
      customerId: b.customerId,
      name: b.customer?.name || 'Client',
      category: b.category || 'Makeup Service',
      date: formattedDate,
      location: b.location || 'At Client Location',
      price: `₹${numericPrice.toLocaleString('en-IN')}`,
      numericPrice,
      basePrice,
      hasInsurance,
      insuranceFee,
      backupArtist: b.backupArtist || null,
      backupArtistId: b.backupArtistId || null,
      advanceAmount: b.advanceAmount || 0,
      status: mappedStatus,
      rawStatus: b.status,
      phone: b.customer?.phone || '',
      address: b.location || 'At Client Location',
      avatar,
      rawDate: b.date,
      rawTime: b.time,
      addOns: addOnsList,
      createdAt: b.createdAt,
      rejectionReason: b.rejectionReason,
      cancellationReason: b.cancellationReason,
      cancelledBy: b.cancelledBy,
      isBackupBooking: b.isBackupBooking || false,
      primaryArtistName: b.artist?.name || '',
      rawBooking: b,
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

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('ArtistNotification')}
        >
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
        dashboardData.upcomingBookings.map((booking) => {
          const numericPrice = typeof booking.price === 'number' ? booking.price : (parseFloat(String(booking.price || 0).replace(/[^0-9.]/g, '')) || 0);
          const hasInsurance = !!(booking.hasInsurance || booking.backupArtistId || booking.backupArtist);
          const insuranceFee = hasInsurance ? (booking.insuranceFee || 1000) : 0;
          const basePrice = Math.max(0, numericPrice - insuranceFee);
          const addOnsList = Array.isArray(booking.addOns) ? booking.addOns : (booking.addOns ? [booking.addOns] : []);

          return (
            <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => handleOpenBookingDetail(booking)}>
              {/* Top Header Row with Avatar, Client Info, and Status Badge */}
              <View style={styles.cardHeaderRow}>
                <Image
                  source={{ uri: getUserProfileImage(booking.customer) }}
                  style={styles.clientAvatarHeader}
                />
                <View style={styles.clientMainInfo}>
                  <View style={styles.clientNameRow}>
                    <Text style={styles.clientName}>{booking.customer?.name || 'Client'}</Text>
                    <Ionicons name="sparkles" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.bookingCategory}>{booking.category || 'Bridal Makeup'}</Text>
                  <View style={styles.bookingMetaRow}>
                    <Ionicons name="calendar-outline" size={12} color="#777" />
                    <Text style={styles.bookingMetaText}>{booking.date} • {booking.time}</Text>
                  </View>
                  {booking.location ? (
                    <View style={styles.bookingMetaRow}>
                      <Ionicons name="location-outline" size={12} color="#777" />
                      <Text style={styles.bookingMetaText}>{booking.location}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.bookingBadgeContainer}>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>{booking.status}</Text>
                  </View>
                </View>
              </View>

              {/* Full-width Details & Price Breakdown */}
              <View style={styles.cardBody}>
                {/* Price Breakdown Box */}
                <View style={styles.priceBreakdownCard}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Base Service Rate:</Text>
                    <Text style={styles.basePriceVal}>₹{basePrice.toLocaleString('en-IN')}</Text>
                  </View>
                  {hasInsurance && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Ensurance Protection:</Text>
                      <Text style={styles.insuranceFeeVal}>+₹{insuranceFee.toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={styles.priceDivider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>Total Client Paid:</Text>
                    <Text style={styles.totalVal}>₹{numericPrice.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.priceRow, { marginTop: 4 }]}>
                    <Text style={[styles.totalLabel, { color: '#FF4F8F', fontWeight: '800' }]}>Artist Payout:</Text>
                    <Text style={[styles.totalVal, { color: '#FF4F8F', fontWeight: '800' }]}>₹{basePrice.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Assigned Backup Artist Info Row */}
                {booking.backupArtist && (
                  <View style={styles.backupCardRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.backupCardText}>
                      Assigned Backup: <Text style={{ fontWeight: '700', color: '#111' }}>{booking.backupArtist.name}</Text>
                    </Text>
                  </View>
                )}

                {booking.isBackupBooking && (
                  <View style={[styles.backupCardRow, { backgroundColor: '#FFF0F5', borderColor: '#FF4F8F' }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#FF4F8F" />
                    <Text style={[styles.backupCardText, { color: '#FF4F8F' }]}>
                      Backup Assignment for: <Text style={{ fontWeight: '700' }}>{booking.primaryArtistName || 'Primary Artist'}</Text>
                    </Text>
                  </View>
                )}

                {addOnsList.length > 0 && !booking.isBackupBooking && (
                  <View style={[styles.extraBadge, { marginTop: 6, alignSelf: 'flex-start' }]}>
                    <Ionicons name="sparkles" size={12} color="#FF4F8F" />
                    <Text style={styles.extraBadgeText}>
                      +{addOnsList.length} {addOnsList.some(a => a.count || a.service) ? 'Extra Clients' : 'Add-On Services'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
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
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ArtistAddExtraClients')}>
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
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('PackagesList')}>
          <View style={styles.actionCircle}>
            <Ionicons name="cube-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>Packages</Text>
        </TouchableOpacity>
      </View>

      <ArtistBookingDetailModal 
        visible={selectedBooking !== null} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking} 
        onStatusUpdate={() => fetchDashboardData(false)} 
        onChatPress={(b) => navigation.navigate('ArtistMessage', { customerId: b.customerId })} 
      />

      <ArtistAddExtraClientsModal
        visible={addClientsModalVisible}
        onClose={() => setAddClientsModalVisible(false)}
        onSuccess={() => fetchDashboardData(false)}
        artistServices={artistProfile?.services || artistProfile?.specializations || []}
        upcomingBookings={dashboardData.upcomingBookings || []}
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
    flexDirection: 'column',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  clientAvatarHeader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },

  clientMainInfo: {
    flex: 1,
  },

  cardBody: {
    width: '100%',
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
  priceBreakdownCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  basePriceVal: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  insuranceFeeVal: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF4F87',
  },
  backupCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
  },
  backupCardText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  extraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFB6C1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  extraBadgeText: {
    fontSize: 11,
    color: '#FF4F8F',
    fontWeight: '700',
  },
});

export default ArtistDashboardScreen;

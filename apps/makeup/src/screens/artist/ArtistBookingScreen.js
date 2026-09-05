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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import {
  getArtistBookings,
  acceptArtistBooking,
  rejectArtistBooking,
  startArtistBooking,
  completeArtistBooking,
} from '../../api/auth';
import ArtistBookingDetailModal from './ArtistBookingDetailModal';

const ArtistPendingCountdownTimer = ({ createdAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!createdAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const created = new Date(createdAt).getTime();
      const deadline = created + 15 * 60 * 1000;
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')} mins`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (!createdAt) return null;

  return (
    <View style={styles.timerRow}>
      <Ionicons name="time-outline" size={13} color="#D46B08" />
      <Text style={styles.timerText}>Confirm within: {timeLeft}</Text>
    </View>
  );
};

const ArtistBookingScreen = ({ onBack }) => {
  const navigation = useNavigation();
  const [activeSubTab, setActiveSubTab] = useState('Upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpBookingId, setOtpBookingId] = useState(null);
  const [otpInputText, setOtpInputText] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getArtistBookings();
      
      const mapped = data.map(b => {
        let mappedStatus = 'Upcoming';
        if (b.status === 'completed') {
          mappedStatus = 'Completed';
        } else if (b.status === 'cancelled' || b.status === 'rejected') {
          mappedStatus = 'Cancelled';
        }

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

        let addOnsList = [];
        if (b.addOns) {
          if (Array.isArray(b.addOns)) {
            addOnsList = b.addOns;
          } else if (typeof b.addOns === 'object') {
            addOnsList = [b.addOns];
          }
        }

        return {
          id: String(b.id),
          customerId: b.customerId,
          name: b.customer?.name || 'Walk-In Client',
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
          addOns: addOnsList,
          createdAt: b.createdAt,
          rejectionReason: b.rejectionReason,
          cancellationReason: b.cancellationReason,
          cancelledBy: b.cancelledBy,
          isBackupBooking: b.isBackupBooking || false,
          primaryArtistName: b.artist?.name || '',
          rawBooking: b,
        };
      });

      setBookings(mapped);
    } catch (error) {
      console.warn('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAccept = async (bookingId) => {
    try {
      await acceptArtistBooking(bookingId);
      await fetchBookings();
    } catch (error) {
      console.warn('Failed to accept booking:', error);
    }
  };

  const handleReject = (bookingId) => {
    setRejectBookingId(bookingId);
    setRejectionReasonText('');
    setRejectModalVisible(true);
  };

  const handleStart = (bookingId) => {
    setOtpBookingId(bookingId);
    setOtpInputText('');
    setOtpModalVisible(true);
  };

  const handleVerifyAndStart = async () => {
    if (!otpInputText || otpInputText.trim().length === 0) {
      Alert.alert('Required', 'Please enter the 4-digit OTP provided by the client.');
      return;
    }
    try {
      setVerifyingOtp(true);
      await startArtistBooking(otpBookingId, otpInputText.trim());
      setOtpModalVisible(false);
      setOtpBookingId(null);
      setOtpInputText('');
      Alert.alert('Success', 'Service started successfully!');
      await fetchBookings();
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Invalid OTP or failed to start service.';
      Alert.alert('Error', msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await completeArtistBooking(bookingId);
      await fetchBookings();
    } catch (error) {
      console.warn('Failed to complete booking:', error);
    }
  };

  const isBookingTimeReached = (b) => {
    if (!b) return false;
    try {
      let dStr = b.rawDate || b.date;
      let tStr = b.rawTime || b.time || '00:00';

      let scheduledDate = new Date(dStr);
      if (isNaN(scheduledDate.getTime()) && b.rawDate) {
        const [y, m, d] = String(b.rawDate).split('-').map(Number);
        scheduledDate = new Date(y, m - 1, d);
      }

      if (isNaN(scheduledDate.getTime())) return false;

      let hours = 0;
      let minutes = 0;
      if (tStr) {
        const match = String(tStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          hours = parseInt(match[1], 10);
          minutes = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : null;
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
        }
      }

      scheduledDate.setHours(hours, minutes, 0, 0);
      const startWindow = new Date(scheduledDate.getTime() - 60 * 60 * 1000); // 1 hour prior
      const now = new Date();
      return now >= startWindow;
    } catch (e) {
      return false;
    }
  };

  const filteredBookings = bookings.filter(booking => booking.status === activeSubTab);

  const getStatusStyle = (status, rawStatus) => {
    if (rawStatus === 'in_progress') {
      return {
        bg: '#FFF7E6',
        text: '#D46B08',
        label: 'In Progress',
      };
    }
    if (rawStatus === 'accepted' || rawStatus === 'advance_pending') {
      return {
        bg: '#E6F7FF',
        text: '#0050B3',
        label: 'Accepted',
      };
    }
    if (rawStatus === 'confirmed') {
      return {
        bg: '#F6FFED',
        text: '#389E0D',
        label: 'Confirmed',
      };
    }
    if (rawStatus === 'pending') {
      return {
        bg: '#F9F0FF',
        text: '#531DAB',
        label: 'Pending',
      };
    }
    switch (status) {
      case 'Upcoming':
        return {
          bg: '#E6F4FF',
          text: '#0958D9',
          label: 'Upcoming',
        };
      case 'Completed':
        return {
          bg: '#F6FFED',
          text: '#389E0D',
          label: 'Completed',
        };
      case 'Cancelled':
        return {
          bg: '#FFF1F0',
          text: '#CF1322',
          label: 'Cancelled',
        };
      default:
        return {
          bg: '#F5F5F5',
          text: '#555555',
          label: status,
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Bookings</Text>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="time-outline" size={22} color="#5E1735" />
        </TouchableOpacity>
      </View>

      {/* SUB-TABS */}
      <View style={styles.tabsContainer}>
        {['Upcoming', 'Completed', 'Cancelled'].map(tab => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveSubTab(tab)}
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
          <ActivityIndicator size="large" color="#FF4F8F" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {filteredBookings.length > 0 ? (
            filteredBookings.map(booking => {
              const badgeColors = getStatusStyle(booking.status, booking.rawStatus);
              return (
                <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => setSelectedBooking(booking)}>
                  <Image
                    source={{ uri: booking.avatar }}
                    style={styles.clientAvatar}
                  />

                  <View style={styles.bookingDetails}>
                    <Text style={styles.clientName}>{booking.name}</Text>
                    <Text style={styles.bookingCategory}>{booking.category}</Text>
                    
                    <View style={styles.bookingMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color="#777" />
                      <Text style={styles.bookingMetaText}>{booking.date}</Text>
                    </View>

                    <View style={styles.bookingMetaRow}>
                      <Ionicons name="location-outline" size={12} color="#777" />
                      <Text style={styles.bookingMetaText}>{booking.location}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <Text style={styles.bookingPrice}>{booking.price}</Text>
                      {booking.isBackupBooking && (
                        <View style={[styles.extraBadge, { backgroundColor: '#FFF0F5', borderColor: '#FF4F8F' }]}>
                          <Ionicons name="shield-checkmark" size={12} color="#FF4F8F" />
                          <Text style={[styles.extraBadgeText, { color: '#FF4F8F', fontWeight: '700' }]}>
                            Backup Request
                          </Text>
                        </View>
                      )}
                      {booking.addOns && booking.addOns.length > 0 && !booking.isBackupBooking && (
                        <View style={styles.extraBadge}>
                          <Ionicons name="people" size={12} color="#FF4F8F" />
                          <Text style={styles.extraBadgeText}>
                            +{booking.addOns.reduce((sum, a) => sum + (a.count || 1), 0)} Extra
                          </Text>
                        </View>
                      )}
                    </View>

                    {booking.status === 'Upcoming' && (
                      <View style={{ flexDirection: 'column' }}>
                        {booking.rawStatus === 'pending' && (
                          <ArtistPendingCountdownTimer createdAt={booking.createdAt} onExpire={fetchBookings} />
                        )}
                        <View style={styles.cardActionsContainer}>
                          {booking.rawStatus === 'pending' && (
                            <>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.acceptBtn]}
                                onPress={() => handleAccept(booking.id)}
                              >
                                <Text style={styles.actionBtnText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => handleReject(booking.id)}
                              >
                                <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {(booking.rawStatus === 'accepted' || booking.rawStatus === 'advance_pending') && (
                            <View style={styles.waitingPillContainer}>
                              <Text style={styles.waitingPillText}>Waiting for Client Confirmation</Text>
                            </View>
                          )}
                          {booking.rawStatus === 'confirmed' && (
                            isBookingTimeReached(booking) ? (
                              <TouchableOpacity
                                style={[styles.actionBtn, styles.startBtn]}
                                onPress={() => handleStart(booking.id)}
                              >
                                <Text style={styles.actionBtnText}>Start Service</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.waitingPillContainer}>
                                <Text style={styles.waitingPillText}>Starts {booking.date}</Text>
                              </View>
                            )
                          )}
                          {booking.rawStatus === 'in_progress' && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.completeBtn]}
                              onPress={() => handleComplete(booking.id)}
                            >
                              <Text style={styles.actionBtnText}>Complete Service</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}

                    {booking.status === 'Cancelled' && (booking.rejectionReason || booking.cancellationReason) && (
                      <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionLabel}>
                          {booking.cancelledBy === 'system' ? 'Cancellation Reason:' : 'Decline Reason:'}
                        </Text>
                        <Text style={styles.rejectionText}>
                          {booking.rejectionReason || booking.cancellationReason}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.bookingBadgeContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeColors.text }]}>
                        {badgeColors.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={56} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No {activeSubTab} Bookings</Text>
              <Text style={styles.emptySubtitle}>You don't have any bookings listed as {activeSubTab.toLowerCase()} yet.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <ArtistBookingDetailModal 
        visible={selectedBooking !== null} 
        onClose={() => setSelectedBooking(null)} 
        booking={selectedBooking} 
        onStatusUpdate={fetchBookings} 
        onChatPress={(b) => navigation.navigate('ArtistMessage', { 
          customerId: b.customerId,
          customerName: b.name,
          customerAvatar: b.avatar
        })} 
      />

      {/* Reject Booking Dialog Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Decline Request</Text>
            <Text style={styles.dialogLabel}>Please provide a reason for declining this request:</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="E.g. Slot unavailable / Personal emergency..."
              placeholderTextColor="#999"
              value={rejectionReasonText}
              onChangeText={setRejectionReasonText}
              multiline
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogCancelBtn]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectBookingId(null);
                  setRejectionReasonText('');
                }}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogSubmitBtn]}
                onPress={async () => {
                  if (!rejectionReasonText.trim()) {
                    Alert.alert('Required', 'Please enter a reason.');
                    return;
                  }
                  try {
                    setLoading(true);
                    setRejectModalVisible(false);
                    await rejectArtistBooking(rejectBookingId, rejectionReasonText.trim());
                    setRejectBookingId(null);
                    setRejectionReasonText('');
                    await fetchBookings();
                  } catch (err) {
                    Alert.alert('Error', err.message || 'Failed to reject booking.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={styles.dialogSubmitText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Start Service OTP Verification Modal */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="key-outline" size={36} color="#FF4F8F" />
              <Text style={styles.dialogTitle}>Enter Service OTP</Text>
              <Text style={[styles.dialogLabel, { textAlign: 'center', marginTop: 4 }]}>
                Ask the client for their 4-digit Service Start OTP to begin the appointment.
              </Text>
            </View>
            <TextInput
              style={[styles.dialogInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '700', color: '#333' }]}
              placeholder="0000"
              placeholderTextColor="#CCC"
              value={otpInputText}
              onChangeText={setOtpInputText}
              keyboardType="number-pad"
              maxLength={4}
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogCancelBtn]}
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpBookingId(null);
                  setOtpInputText('');
                }}
                disabled={verifyingOtp}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogSubmitBtn]}
                onPress={handleVerifyAndStart}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.dialogSubmitText}>Start Service</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6EA',
    paddingHorizontal: 10,
    backgroundColor: '#FCFCFC',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  activeTabButton: {
    borderBottomColor: '#FF4F8F',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  activeTabText: {
    color: '#FF4F8F',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 25,
  },

  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
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

  bookingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginTop: 6,
  },

  bookingBadgeContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
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

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  waitingPillContainer: {
    backgroundColor: '#FFF7E6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD591',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  waitingPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D46B08',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
  },
  acceptBtn: {
    backgroundColor: '#389E0D',
  },
  rejectBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CF1322',
  },
  rejectBtnText: {
    color: '#CF1322',
  },
  startBtn: {
    backgroundColor: '#FF4F8F',
    flex: 1,
  },
  completeBtn: {
    backgroundColor: '#389E0D',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  dialogLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: 'serif',
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#222',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  dialogCancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'serif',
  },
  dialogSubmitBtn: {
    backgroundColor: '#CF1322',
  },
  dialogSubmitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'serif',
  },
  extraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4ED',
  },
  extraBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
    marginLeft: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    borderColor: '#FFE7BA',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D46B08',
    marginLeft: 4,
    fontFamily: 'serif',
  },
  rejectionBox: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FFA39E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CF1322',
    fontFamily: 'serif',
  },
  rejectionText: {
    fontSize: 12,
    color: '#595959',
    marginTop: 2,
    fontFamily: 'serif',
  },
});

export default ArtistBookingScreen;

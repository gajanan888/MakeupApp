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
  Modal,
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getCustomerBookings, cancelCustomerBooking, declineCustomerBookingAdvance, getCustomerProfile, submitBookingReview } from '../../api/auth';
import BottomNavigation from '../../components/BottomNavigation';
import { useCall } from '../../context/CallContext';
import { getUniqueProfileImage, DEFAULT_AVATAR } from '../../utils/artistImageHelper';

const CountdownTimer = ({ deadline, onExpire, label = "Pay within:" }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(deadline);
      const diff = target.getTime() - now.getTime();

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
  }, [deadline, onExpire]);

  return (
    <View style={styles.timerRow}>
      <Ionicons name="time-outline" size={14} color="#D46B08" />
      <Text style={styles.timerText}>{label} {timeLeft}</Text>
    </View>
  );
};

const CustomerBookingsScreen = ({ navigation, isTab = false }) => {
  const [activeTab, setActiveTab] = useState('Upcoming'); // 'Upcoming' | 'Completed' | 'Cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState(null);
  const { initiateCall } = useCall();

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [clientConsents, setClientConsents] = useState({});

  const toggleConsent = (bookingId, key) => {
    setClientConsents(prev => {
      const current = prev[bookingId] || { c1: false, c2: false, c3: false, c4: false, c5: false };
      return {
        ...prev,
        [bookingId]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const isAllConsentChecked = (bookingId) => {
    const bConsents = clientConsents[bookingId] || {};
    return !!(bConsents.c1 && bConsents.c2 && bConsents.c3 && bConsents.c4 && bConsents.c5);
  };

  const renderClientConsentAndOtp = (booking, isModal = false) => {
    if (!booking) return null;
    const bId = booking.id;
    const consents = clientConsents[bId] || { c1: false, c2: false, c3: false, c4: false, c5: false };
    const allChecked = isAllConsentChecked(bId);
    const otpAvailable = isOtpActive(booking);

    if (booking.rawStatus === 'confirmed') {
      return (
        <View style={[styles.otpCardBox, isModal && { marginVertical: 10 }]}>
          {otpAvailable ? (
            <View style={styles.otpActiveContent}>
              <View style={styles.otpHeaderRow}>
                <Ionicons name="shield-checkmark" size={18} color="#D46B08" />
                <Text style={styles.otpTitle}>Client Mandatory Consent & Start OTP</Text>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '600', color: '#333', marginTop: 6, marginBottom: 6 }}>
                Check all consent boxes below to reveal your Service Start OTP:
              </Text>

              <TouchableOpacity 
                style={styles.consentRow} 
                onPress={() => toggleConsent(bId, 'c1')} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={consents.c1 ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={consents.c1 ? "#FF4F8F" : "#888"} 
                />
                <Text style={styles.consentText}>
                  1. The products are valid, non-expired, and checked.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consentRow} 
                onPress={() => toggleConsent(bId, 'c2')} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={consents.c2 ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={consents.c2 ? "#FF4F8F" : "#888"} 
                />
                <Text style={styles.consentText}>
                  2. Disclosed all skin issues & allergic problems to artist.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consentRow} 
                onPress={() => toggleConsent(bId, 'c3')} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={consents.c3 ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={consents.c3 ? "#FF4F8F" : "#888"} 
                />
                <Text style={styles.consentText}>
                  3. Consented to pre-application skin patch test.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consentRow} 
                onPress={() => toggleConsent(bId, 'c4')} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={consents.c4 ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={consents.c4 ? "#FF4F8F" : "#888"} 
                />
                <Text style={styles.consentText}>
                  4. Agreed to follow post-service skin care & hygiene guidelines.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.consentRow} 
                onPress={() => toggleConsent(bId, 'c5')} 
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={consents.c5 ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={consents.c5 ? "#FF4F8F" : "#888"} 
                />
                <Text style={styles.consentText}>
                  5. Confirmed clean workspace setup, seating, and proper lighting.
                </Text>
              </TouchableOpacity>

              <View style={[styles.otpRevealContainer, { marginTop: 10 }]}>
                {allChecked ? (
                  <>
                    <Text style={styles.otpCode}>{booking.startOtp || '----'}</Text>
                    <Text style={styles.otpSubtitle}>
                      ✅ All consents acknowledged. Share this Start OTP with your artist upon arrival.
                    </Text>
                  </>
                ) : (
                  <View style={styles.otpLockedBox}>
                    <Ionicons name="lock-closed" size={22} color="#92400E" />
                    <Text style={styles.otpLockedText}>🔒 Service Start OTP Locked</Text>
                    <Text style={styles.otpLockedSubtext}>
                      Please check all 5 consent boxes above to reveal your OTP code.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.otpPendingContent}>
              <Ionicons name="time-outline" size={16} color="#0050B3" style={{ marginRight: 6 }} />
              <Text style={styles.otpPendingText}>OTP will be available 1 hour before service start time.</Text>
            </View>
          )}
        </View>
      );
    }

    if (booking.rawStatus === 'in_progress') {
      return (
        <View style={[styles.otpCardBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }, isModal && { marginVertical: 10 }]}>
          <View style={styles.otpActiveContent}>
            <View style={styles.otpHeaderRow}>
              <Ionicons name="checkmark-circle" size={20} color="#166534" />
              <Text style={[styles.otpTitle, { color: '#166534' }]}>Service In Progress & Completion OTP</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#15803D', marginTop: 4, marginBottom: 8, fontWeight: '500' }}>
              Your makeup service is in progress! Once completed to your satisfaction, share this Completion OTP with your artist:
            </Text>
            <Text style={[styles.otpCode, { color: '#15803D', letterSpacing: 6 }]}>{booking.endOtp || '----'}</Text>
            <Text style={[styles.otpSubtitle, { color: '#166534' }]}>
              Give this 4-digit OTP to your artist only when the makeup look is finished.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const openReviewModal = (booking) => {
    setSelectedBookingForReview(booking);
    setRating(0);
    setComment('');
    setReviewModalVisible(true);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedBookingForReview(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;
    if (rating === 0) {
      Alert.alert('Error', 'Please select a star rating.');
      return;
    }

    try {
      setSubmittingReview(true);
      await submitBookingReview(selectedBookingForReview.id, rating, comment);
      Alert.alert('Thank You', 'Your review has been successfully submitted.');
      closeReviewModal();
      await fetchBookings(true);
    } catch (err) {
      console.warn(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to submit review.';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const canCancelBooking = (booking) => {
    if (!booking.dateRaw || !booking.timeRaw) return false;
    let hours = 12;
    let minutes = 0;
    if (booking.timeRaw) {
      const parts = booking.timeRaw.split(" ");
      const timeStr = parts[0];
      const ampm = parts[1] || "AM";
      const [h, m] = timeStr.split(":").map(Number);
      hours = h;
      minutes = m;
      if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    const serviceDate = new Date(`${booking.dateRaw}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    const diffHours = (serviceDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours >= 36;
  };

  const isOtpActive = (b) => {
    if (!b || !b.dateRaw) return false;
    try {
      let dStr = b.dateRaw;
      let tStr = b.timeRaw || '00:00';
      let scheduledDate = new Date(dStr);
      if (isNaN(scheduledDate.getTime()) && b.dateRaw) {
        const [y, m, d] = String(b.dateRaw).split('-').map(Number);
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
      const startWindow = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
      return new Date() >= startWindow;
    } catch (e) {
      return false;
    }
  };

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getCustomerBookings();
      try {
        const prof = await getCustomerProfile();
        setCustomerProfile(prof?.data || prof);
      } catch (err) {
        console.warn('Profile fetch failed:', err);
      }
      
      const mapped = data.map(b => {
        let tabGroup = 'Upcoming';
        if (b.status === 'completed') {
          tabGroup = 'Completed';
        } else if (b.status === 'cancelled' || b.status === 'rejected') {
          tabGroup = 'Cancelled';
        }

        const avatar = getUniqueProfileImage(b.artist);

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

        const numericPrice = typeof b.price === 'number' ? b.price : (parseFloat(String(b.price || 0).replace(/[^0-9.]/g, '')) || 0);
        const hasInsurance = !!b.hasInsurance;
        const insuranceFee = hasInsurance ? (b.insuranceFee || 1000) : 0;
        const basePrice = Math.max(0, numericPrice - insuranceFee);

        return {
          id: String(b.id),
          artistName: b.artist?.name || 'Makeup Artist',
          category: b.category || 'Makeup Service',
          date: formattedDate,
          location: b.location || 'At Client Location',
          price: `₹${numericPrice.toLocaleString('en-IN')}`,
          priceRaw: numericPrice,
          basePrice,
          addOns: b.addOns,
          totalPaid: b.totalPaid || 0,
          tabGroup,
          rawStatus: b.status,
          avatar,
          rejectionReason: b.rejectionReason,
          advanceAmount: b.advanceAmount || 0,
          hasInsurance,
          insuranceFee,
          backupArtist: b.backupArtist,
          backupStatus: b.backupStatus || 'none',
          backupRejectionReason: b.backupRejectionReason || null,
          advancePaid: b.advancePaid,
          paymentDeadline: b.paymentDeadline,
          artistRaw: b.artist,
          dateRaw: b.date,
          timeRaw: b.time,
          review: b.review,
          cancelledBy: b.cancelledBy,
          cancellationReason: b.cancellationReason,
          refundAmount: b.refundAmount,
          refundStatus: b.refundStatus,
          createdAt: b.createdAt,
          startOtp: b.startOtp,
        };
      });

      setBookings(mapped);
    } catch (error) {
      console.warn('Failed to fetch customer bookings:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const interval = setInterval(() => {
      fetchBookings(true);
    }, 30 * 1000); // 30 seconds

    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [navigation]);

  const handleDeclineAdvance = async (bookingId) => {
    try {
      setLoading(true);
      await declineCustomerBookingAdvance(bookingId);
      Alert.alert('Payment Deferred', 'You have elected to pay later. A 30-minute timer has started. Please pay within this time to avoid cancellation.');
      await fetchBookings();
    } catch (err) {
      console.warn(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to defer payment.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (booking, onCancelSuccess) => {
    let cancelMsg = 'Are you sure you want to cancel this appointment? This action cannot be undone.';
    if (booking.rawStatus === 'confirmed') {
      let hours = 12;
      let minutes = 0;
      if (booking.timeRaw) {
        const parts = booking.timeRaw.split(" ");
        const timeStr = parts[0];
        const ampm = parts[1] || "AM";
        const [h, m] = timeStr.split(":").map(Number);
        hours = h;
        minutes = m;
        if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      const serviceDate = new Date(`${booking.dateRaw}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
      const diffHours = (serviceDate.getTime() - Date.now()) / (1000 * 60 * 60);

      if (diffHours >= 36) {
        cancelMsg = `This appointment will be cancelled freely. Since it is cancelled before 36 hours of the appointment time, your full advance payment of ₹${booking.advanceAmount} will be refunded. Do you want to proceed?`;
      } else {
        const fee = Math.round(booking.priceRaw * 0.02);
        const refund = Math.max(0, booking.advanceAmount - fee);
        cancelMsg = `Since this appointment is being cancelled within 36 hours of the appointment time, a 2% cancellation fee (₹${fee}) will be charged and deducted from your advance payment. The remaining ₹${refund} will be refunded. Do you want to proceed?`;
      }
    }

    Alert.alert(
      'Cancel Appointment',
      cancelMsg,
      [
        { text: 'Keep Booking', style: 'cancel' },
        { 
          text: 'Cancel Appointment', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelCustomerBooking(booking.id);
              Alert.alert('Cancelled', 'Your appointment has been successfully cancelled.');
              if (onCancelSuccess) onCancelSuccess();
              await fetchBookings();
            } catch (err) {
              console.warn(err);
              const errMsg = err.response?.data?.message || err.message || 'Failed to cancel appointment.';
              Alert.alert('Cancellation Error', errMsg);
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
        return { bg: '#FFF7E6', text: '#D46B08', label: 'Pending Approval' };
      case 'accepted':
        return { bg: '#E6F7FF', text: '#0050B3', label: 'Accepted (Unpaid)' };
      case 'confirmed':
        return { bg: '#F6FFED', text: '#389E0D', label: 'Confirmed (Paid)' };
      case 'in_progress':
        return { bg: '#E6F7FF', text: '#0050B3', label: 'In Progress' };
      case 'completed':
        return { bg: '#F6FFED', text: '#389E0D', label: 'Completed' };
      case 'rejected':
        return { bg: '#FFF1F0', text: '#CF1322', label: 'Rejected' };
      case 'cancelled':
        return { bg: '#FFF1F0', text: '#CF1322', label: 'Cancelled' };
      default:
        return { bg: '#F5F5F5', text: '#555555', label: rawStatus };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, isTab && { paddingTop: 10, height: 60 }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Bookings</Text>

      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsContainer}>
        {['Upcoming', 'Completed', 'Cancelled'].map(tab => {
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
              const showCancelBtn = ['pending', 'accepted', 'confirmed'].includes(booking.rawStatus);
              const showChatBtn = ['confirmed', 'in_progress'].includes(booking.rawStatus);

              return (
                <View key={booking.id} style={styles.bookingCard}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBookingForDetails(booking);
                      setDetailsModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
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
                    
                      {booking.rawStatus === 'pending' && booking.createdAt && (
                        <CountdownTimer
                          deadline={new Date(new Date(booking.createdAt).getTime() + 15 * 60 * 1000)}
                          onExpire={() => fetchBookings(true)}
                          label="Auto-cancels if unconfirmed in:"
                        />
                      )}

                      {(booking.rawStatus === 'rejected' || booking.rawStatus === 'cancelled') && (booking.rejectionReason || booking.cancellationReason) && (
                        <View style={styles.rejectionBox}>
                          <Text style={styles.rejectionLabel}>
                            {booking.cancelledBy === 'system' ? 'Cancellation Reason:' : 'Decline Reason:'}
                          </Text>
                          <Text style={styles.rejectionText}>
                            {booking.rejectionReason || booking.cancellationReason}
                          </Text>
                        </View>
                      )}

                    {booking.rawStatus === 'accepted' && booking.paymentDeadline && (
                      <CountdownTimer deadline={booking.paymentDeadline} onExpire={fetchBookings} />
                    )}

                    {/* Price & Ensurance Fee Distribution Box */}
                    <View style={{ backgroundColor: '#F9FAFB', borderRadius: 10, padding: 8, marginVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>Service Rate:</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#333' }}>₹{booking.basePrice.toLocaleString('en-IN')}</Text>
                      </View>
                      {booking.hasInsurance && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                          <Text style={{ fontSize: 12, color: '#666' }}>Ensurance Guarantee:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>+₹{booking.insuranceFee.toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111' }}>Total Amount:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF4F87' }}>{booking.price}</Text>
                      </View>
                    </View>

                    {/* Backup Artist Status / Re-selection Warning Box */}
                    {booking.hasInsurance && (
                      booking.backupStatus === 'rejected' || booking.backupStatus === 'expired' ? (
                        <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons name="warning" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#991B1B' }}>Backup Artist Cancelled</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: '#B91C1C', marginBottom: 8 }}>
                            {booking.backupRejectionReason || 'The assigned backup artist was cancelled or did not confirm in time.'}
                          </Text>
                          <TouchableOpacity
                            style={{ backgroundColor: '#FF4F87', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => navigation.navigate('SelectBackupArtist', {
                              bookingId: booking.id,
                              isReselecting: true,
                              artist: booking.artistRaw || { id: booking.artistId, name: booking.artistName },
                              selectedDate: booking.dateRaw || booking.date,
                              selectedTime: booking.timeRaw || booking.time,
                              dateStr: booking.date,
                            })}
                          >
                            <Ionicons name="refresh" size={14} color="#FFF" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>Select New Backup Artist</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          backgroundColor: booking.backupStatus === 'accepted' ? '#ECFDF5' : '#FFFBEB', 
                          borderWidth: 1, 
                          borderColor: booking.backupStatus === 'accepted' ? '#A7F3D0' : '#FDE68A', 
                          borderRadius: 8, 
                          paddingHorizontal: 8, 
                          paddingVertical: 6, 
                          marginBottom: 6 
                        }}>
                          <Ionicons 
                            name={booking.backupStatus === 'accepted' ? "shield-checkmark" : "time-outline"} 
                            size={14} 
                            color={booking.backupStatus === 'accepted' ? "#059669" : "#D97706"} 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={{ fontSize: 12, color: booking.backupStatus === 'accepted' ? '#065F46' : '#92400E', fontWeight: '600', flex: 1 }}>
                            Backup Artist: <Text style={{ fontWeight: '700' }}>{booking.backupArtist?.name || 'Assigned'}</Text>
                            {booking.backupStatus === 'accepted' ? ' (Confirmed)' : ' (Pending 1h Confirmation)'}
                          </Text>
                        </View>
                      )
                    )}

                    {renderClientConsentAndOtp(booking)}

                    {booking.rawStatus === 'accepted' && (
                      <View style={styles.advanceRow}>
                        <Text style={styles.advanceLabel}>
                          Advance Due ({booking.hasInsurance ? '10% + Ensurance' : '10%'}):
                        </Text>
                        <Text style={styles.advanceValue}>₹{booking.advanceAmount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                  {booking.rawStatus === 'accepted' && (
                    <View style={styles.cardFooter}>
                      {!booking.paymentDeadline ? (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineBtn]}
                            onPress={() => handleDeclineAdvance(booking.id)}
                          >
                            <Text style={styles.declineBtnText}>Pay Later</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.payBtn]}
                            onPress={() => navigation.navigate('Payment', {
                              artist: booking.artistRaw || { id: booking.artistId, name: booking.artistName, avatar: booking.avatar },
                              isAdvancePayment: true,
                              bookingId: booking.id,
                              advanceAmount: booking.advanceAmount,
                              hasInsurance: booking.hasInsurance,
                              insuranceFee: booking.insuranceFee,
                            })}
                          >
                            <Text style={styles.payBtnText}>Pay Advance</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.payBtn, { width: '100%' }]}
                          onPress={() => navigation.navigate('Payment', {
                            artist: booking.artistRaw || { id: booking.artistId, name: booking.artistName, avatar: booking.avatar },
                            isAdvancePayment: true,
                            bookingId: booking.id,
                            advanceAmount: booking.advanceAmount,
                            hasInsurance: booking.hasInsurance,
                            insuranceFee: booking.insuranceFee,
                          })}
                        >
                          <Text style={styles.payBtnText}>Pay Advance (₹{booking.advanceAmount})</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {(showCancelBtn || showChatBtn) && (
                    <View style={[styles.cardFooter, (showCancelBtn && showChatBtn) && styles.actionRow]}>
                      {showCancelBtn && (
                        <TouchableOpacity
                          style={[styles.cancelBtn, showChatBtn && { flex: 1, marginRight: 8 }]}
                          onPress={() => handleCancelBooking(booking)}
                        >
                          <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                        </TouchableOpacity>
                      )}

                      {showChatBtn && (
                        <View style={{ flex: 1, flexDirection: 'row', gap: 8, marginLeft: showCancelBtn ? 8 : 0 }}>
                          <TouchableOpacity
                            style={[styles.chatBtn, { flex: 1 }]}
                            onPress={() => initiateCall(booking.id, booking.artistRaw?.id || booking.artistId, 'artist', booking.artistName)}
                          >
                            <Ionicons name="call-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={styles.chatBtnText}>Call</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.chatBtn, { flex: 1 }]}
                            onPress={() => navigation.navigate('CustomerMessage', { 
                              artistId: booking.artistRaw?.id || booking.artistId,
                              artistName: booking.artistName,
                              artistAvatar: booking.avatar
                            })}
                          >
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={styles.chatBtnText}>Chat</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {booking.rawStatus === 'completed' && (
                    <View style={styles.cardFooter}>
                      {booking.review ? (
                        <View style={styles.reviewedRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#389E0D" />
                          <Text style={styles.reviewedText}>
                            Reviewed: {booking.review.rating} ★
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.payBtn, { marginLeft: 0 }]}
                          onPress={() => openReviewModal(booking)}
                        >
                          <Ionicons name="star-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.payBtnText}>Rate & Review</Text>
                        </TouchableOpacity>
                      )}
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

      {/* REVIEW MODAL */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate & Review</Text>
              <TouchableOpacity onPress={closeReviewModal} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {selectedBookingForReview && (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedBookingForReview.avatar }}
                  style={styles.reviewArtistAvatar}
                />
                <Text style={styles.reviewArtistName}>
                  {selectedBookingForReview.artistName}
                </Text>
                <Text style={styles.reviewServiceCategory}>
                  {selectedBookingForReview.category}
                </Text>

                <Text style={styles.ratingInstruction}>
                  How was your experience?
                </Text>

                {/* Interactive Rating Stars */}
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map(starNum => {
                    const isSelected = starNum <= rating;
                    return (
                      <TouchableOpacity
                        key={starNum}
                        onPress={() => setRating(starNum)}
                        style={styles.starTouch}
                      >
                        <Ionicons
                          name={isSelected ? 'star' : 'star-outline'}
                          size={36}
                          color={isSelected ? '#F5B301' : '#D9D9D9'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.commentLabel}>Write Feedback (Optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your detailed feedback about the service..."
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                />

                <TouchableOpacity
                  style={[
                    styles.submitReviewBtn,
                    (rating === 0 || submittingReview) && styles.submitReviewBtnDisabled,
                  ]}
                  onPress={handleSubmitReview}
                  disabled={rating === 0 || submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitReviewBtnText}>Submit Feedback</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* BOOKING DETAILS MODAL */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {selectedBookingForDetails && (
              <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
                {/* Artist & Status Header */}
                <View style={[styles.modalBody, { paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 16 }]}>
                  <Image
                    source={{ uri: selectedBookingForDetails.avatar }}
                    style={styles.reviewArtistAvatar}
                  />
                  <Text style={styles.reviewArtistName}>
                    {selectedBookingForDetails.artistName}
                  </Text>
                  <Text style={styles.reviewServiceCategory}>
                    {selectedBookingForDetails.category}
                  </Text>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getBadgeColors(selectedBookingForDetails.rawStatus).bg, marginTop: 10 }]}>
                    <Text style={[styles.statusBadgeText, { color: getBadgeColors(selectedBookingForDetails.rawStatus).text }]}>
                      {getBadgeColors(selectedBookingForDetails.rawStatus).label}
                    </Text>
                  </View>
                </View>

                {/* Appointment Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Appointment Info</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date & Time</Text>
                    <Text style={styles.detailsValue}>{selectedBookingForDetails.date}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Service Location</Text>
                    <Text style={[styles.detailsValue, { maxWidth: '60%', textAlign: 'right' }]}>
                      {selectedBookingForDetails.location}
                    </Text>
                  </View>
                </View>

                {/* Add-ons Section (if any) */}
                {selectedBookingForDetails.addOns && selectedBookingForDetails.addOns.length > 0 && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Selected Add-ons</Text>
                    {selectedBookingForDetails.addOns.map((addon, index) => (
                      <View key={index} style={styles.addonItem}>
                        <Text style={styles.detailsLabel}>{addon.name}</Text>
                        <Text style={styles.detailsValue}>₹{addon.price}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Price details breakdown */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Payment Summary</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Base Service Rate</Text>
                    <Text style={styles.detailsValue}>₹{selectedBookingForDetails.basePrice?.toLocaleString('en-IN')}</Text>
                  </View>
                  {selectedBookingForDetails.hasInsurance && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Ensurance Protection Fee</Text>
                      <Text style={[styles.detailsValue, { color: '#059669', fontWeight: '700' }]}>+₹{(selectedBookingForDetails.insuranceFee || 1000).toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={[styles.detailsLabel, { fontWeight: '700' }]}>Total Booking Amount</Text>
                    <Text style={[styles.detailsValue, { fontWeight: '700' }]}>{selectedBookingForDetails.price}</Text>
                  </View>
                  {selectedBookingForDetails.backupArtist && (
                    <View style={[styles.detailsRow, { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 8, marginVertical: 4 }]}>
                      <Text style={[styles.detailsLabel, { color: '#065F46', fontWeight: '700' }]}>🛡️ Assigned Backup Artist</Text>
                      <Text style={[styles.detailsValue, { color: '#065F46', fontWeight: '700' }]}>
                        {selectedBookingForDetails.backupArtist.name}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Advance Deposit</Text>
                    <Text style={styles.detailsValue}>
                      ₹{selectedBookingForDetails.advanceAmount} ({selectedBookingForDetails.advancePaid ? 'Paid' : 'Pending'})
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Remaining Amount Due at Service</Text>
                    <Text style={styles.detailsValueHighlight}>
                      ₹{Math.max(0, selectedBookingForDetails.priceRaw - (selectedBookingForDetails.advancePaid ? selectedBookingForDetails.advanceAmount : 0))}
                    </Text>
                  </View>
                </View>

                {renderClientConsentAndOtp(selectedBookingForDetails, true)}

                {/* Rejection / Cancellation Info */}
                {selectedBookingForDetails.rawStatus === 'rejected' && selectedBookingForDetails.rejectionReason && (
                  <View style={[styles.rejectionBox, { marginVertical: 8 }]}>
                    <Text style={styles.rejectionLabel}>Decline Reason:</Text>
                    <Text style={styles.rejectionText}>{selectedBookingForDetails.rejectionReason}</Text>
                  </View>
                )}

                {selectedBookingForDetails.rawStatus === 'cancelled' && (
                  <View style={[styles.rejectionBox, { marginVertical: 8, backgroundColor: '#FFF7F9', borderColor: '#FFE6EF' }]}>
                    <Text style={[styles.rejectionLabel, { color: '#FF4F87' }]}>Cancellation Details:</Text>
                    <Text style={[styles.rejectionText, { color: '#666' }]}>
                      Cancelled By: {selectedBookingForDetails.cancelledBy === 'client' ? 'You' : 'Artist'}
                    </Text>
                    {selectedBookingForDetails.cancellationReason && (
                      <Text style={[styles.rejectionText, { color: '#666', marginTop: 4 }]}>
                        Reason: {selectedBookingForDetails.cancellationReason}
                      </Text>
                    )}
                    {selectedBookingForDetails.refundAmount !== undefined && (
                      <Text style={[styles.rejectionText, { color: '#666', marginTop: 4, fontWeight: '700' }]}>
                        Refund Amount: ₹{selectedBookingForDetails.refundAmount} ({selectedBookingForDetails.refundStatus})
                      </Text>
                    )}
                  </View>
                )}

                {/* Policy Help text for active bookings */}
                {['pending', 'accepted', 'confirmed'].includes(selectedBookingForDetails.rawStatus) && (
                  <View style={styles.policyBox}>
                    <Text style={styles.policyTitle}>Cancellation Policy</Text>
                    <Text style={styles.policyText}>
                      • Cancellations made at least 36 hours before the appointment are 100% free and your full advance payment will be refunded.
                    </Text>
                    <Text style={styles.policyText}>
                      • Cancellations made within 36 hours of the appointment incur a 2% cancellation fee (calculated on the total price), which will be deducted from your advance payment refund.
                    </Text>
                  </View>
                )}

                {/* Cancel Booking Action inside details */}
                {['pending', 'accepted', 'confirmed'].includes(selectedBookingForDetails.rawStatus) && (
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => handleCancelBooking(selectedBookingForDetails, () => setDetailsModalVisible(false))}
                  >
                    <Text style={styles.cancelModalBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      {!isTab && <BottomNavigation navigation={navigation} activeTab="Bookings" />}
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
    // alignItems: 'center',
    // justifyContent: 'space-between',
    // paddingHorizontal: 10,
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
  rejectionBox: {
    backgroundColor: '#FFF1F0',
    borderColor: '#FFA39E',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CF1322',
    fontFamily: 'serif',
  },
  rejectionText: {
    fontSize: 13,
    color: '#595959',
    marginTop: 2,
    fontFamily: 'serif',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    borderColor: '#FFE7BA',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D46B08',
    marginLeft: 6,
    fontFamily: 'serif',
  },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  advanceLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'serif',
  },
  advanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4F87',
    fontFamily: 'serif',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    marginRight: 8,
  },
  declineBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  payBtn: {
    backgroundColor: '#FF4F87',
    marginLeft: 8,
  },
  payBtnText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  chatBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF4F87',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
    paddingTop: 16,
  },
  reviewArtistAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE6EF',
    marginBottom: 10,
  },
  reviewArtistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  reviewServiceCategory: {
    fontSize: 13,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  ratingInstruction: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  starTouch: {
    padding: 6,
  },
  commentLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'serif',
    marginTop: 10,
  },
  commentInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitReviewBtn: {
    backgroundColor: '#FF4F87',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitReviewBtnDisabled: {
    backgroundColor: '#FFAEC7',
  },
  submitReviewBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  reviewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FFED',
    borderColor: '#B7EB8F',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#389E0D',
    marginLeft: 6,
    fontFamily: 'serif',
  },
  detailsScroll: {
    width: '100%',
  },
  detailsSection: {
    width: '100%',
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 10,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A7D77',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailsLabel: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'serif',
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'serif',
  },
  detailsValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4F87',
    fontFamily: 'serif',
  },
  policyBox: {
    backgroundColor: '#FFF7F9',
    borderColor: '#FFE6EF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4F87',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  policyText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    fontFamily: 'serif',
    marginVertical: 1,
  },
  cancelModalBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  cancelModalBtnText: {
    color: '#FF4F87',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  addonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#FFE6EF',
    marginVertical: 2,
  },
  otpCardBox: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  otpActiveContent: {
    backgroundColor: '#FFF7E6',
    borderColor: '#FFE7BA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  otpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D46B08',
    marginLeft: 6,
  },
  otpCode: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#D46B08',
    marginVertical: 4,
  },
  otpSubtitle: {
    fontSize: 11,
    color: '#8C4D00',
    textAlign: 'center',
  },
  otpPendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7FF',
    borderColor: '#BAE7FF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  otpPendingText: {
    fontSize: 12,
    color: '#003A8C',
    fontWeight: '600',
    flex: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  consentText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  otpRevealContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE7BA',
    width: '100%',
  },
  otpLockedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    marginVertical: 4,
  },
  otpLockedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 4,
  },
  otpLockedSubtext: {
    fontSize: 11,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default CustomerBookingsScreen;

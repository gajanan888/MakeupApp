import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { getArtists, getArtistBookedSlots, reselectBackupArtist } from '../../api/auth';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';
import { parseAdvanceNoticeMs } from './SelectDateTimeScreen';

const SelectBackupArtistScreen = ({ navigation, route }) => {
  const {
    artist,
    selectedService,
    selectedLocation,
    selectedDate,
    selectedTime,
    dateStr,
    selectedAddons = [],
    addonsTotal = 0,
    hasInsurance = true,
    insuranceFee = 1000,
    isReselecting = false,
    bookingId = null,
  } = route?.params || {};

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackupArtist, setSelectedBackupArtist] = useState(null);

  // Extract target city / location string from artist profile or selectedLocation
  const targetLocation = artist?.profile?.location || 
    (typeof selectedLocation === 'string' ? selectedLocation : selectedLocation?.address) || 
    '';

  // Format date to YYYY-MM-DD
  let dateFormatted = '';
  if (selectedDate) {
    const dObj = new Date(selectedDate);
    if (!isNaN(dObj.getTime())) {
      const year = dObj.getFullYear();
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const day = String(dObj.getDate()).padStart(2, '0');
      dateFormatted = `${year}-${month}-${day}`;
    }
  }

  useEffect(() => {
    const fetchCandidateArtists = async () => {
      try {
        setLoading(true);

        const filterParams = { location: targetLocation };
        if (dateFormatted) filterParams.availableDate = dateFormatted;
        if (selectedTime) filterParams.availableTime = selectedTime;

        // Fetch candidate artists matching location & date filters
        let data = await getArtists(filterParams);
        
        // Exclude primary artist
        let filtered = Array.isArray(data) ? data.filter(a => String(a.id) !== String(artist?.id)) : [];

        // Fallback: if no artists in specific location, fetch all available on date
        if (filtered.length === 0) {
          const allData = await getArtists({
            availableDate: dateFormatted,
            availableTime: selectedTime,
          });
          filtered = Array.isArray(allData) ? allData.filter(a => String(a.id) !== String(artist?.id)) : [];
        }

        // Perform thorough individual availability check (booked slots & advance notice limit)
        const verifiedAvailable = [];
        for (const candidate of filtered) {
          const isAvailable = await checkCandidateAvailability(candidate);
          if (isAvailable) {
            verifiedAvailable.push(candidate);
          }
        }

        setArtists(verifiedAvailable);

        // Pre-select first candidate backup artist if available
        if (verifiedAvailable.length > 0) {
          setSelectedBackupArtist(verifiedAvailable[0]);
        } else {
          setSelectedBackupArtist(null);
        }
      } catch (err) {
        console.warn('Failed to load backup artists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateArtists();
  }, [artist?.id, targetLocation, dateFormatted, selectedTime]);

  // Check if candidate backup artist is 100% available on booking date and slot
  const checkCandidateAvailability = async (candidate) => {
    try {
      // 1. Advance notice requirement check
      const noticeStr = candidate?.bookingPolicy?.advanceNotice || candidate?.advanceNotice;
      const noticeMs = parseAdvanceNoticeMs(noticeStr);
      if (noticeMs > 0 && selectedDate) {
        const now = new Date();
        const minTime = new Date(now.getTime() + noticeMs);
        const slotStartTime = new Date(selectedDate);
        if (selectedTime?.includes('Afternoon')) slotStartTime.setHours(11, 0, 0, 0);
        else if (selectedTime?.includes('Evening')) slotStartTime.setHours(15, 0, 0, 0);
        else slotStartTime.setHours(7, 0, 0, 0);

        if (slotStartTime < minTime) {
          return false; // Candidate requires more advance notice
        }
      }

      // 2. Booked and blocked slots check for date and time
      if (dateFormatted) {
        const booked = await getArtistBookedSlots(candidate.id);
        if (Array.isArray(booked) && booked.length > 0) {
          const isBusy = booked.some(b => {
            if (b.date !== dateFormatted) return false;
            if (!selectedTime || !b.time) return true;
            return b.time.trim() === selectedTime.trim();
          });
          if (isBusy) return false; // Candidate is already booked/blocked at this slot
        }
      }

      return true;
    } catch (err) {
      console.warn(`Availability check error for artist ${candidate.id}:`, err);
      return true;
    }
  };

  const handleConfirm = async () => {
    if (!selectedBackupArtist) {
      Alert.alert('Backup Artist Required', 'Please select a backup artist.');
      return;
    }

    if (isReselecting && bookingId) {
      try {
        setLoading(true);
        await reselectBackupArtist(bookingId, selectedBackupArtist.id);
        Alert.alert(
          'Backup Artist Assigned',
          `Selected ${selectedBackupArtist.name} as your new backup artist. They have 1 hour to confirm.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('ClientHome', { activeTab: 'Bookings' });
              },
            },
          ]
        );
      } catch (error) {
        const msg = error.response?.data?.message || error.message || 'Failed to assign new backup artist.';
        Alert.alert('Error', msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    navigation.navigate('BookingConfirmation', {
      artist,
      selectedService,
      selectedLocation,
      selectedDate,
      selectedTime,
      dateStr,
      selectedAddons,
      addonsTotal,
      hasInsurance,
      insuranceFee,
      backupArtist: selectedBackupArtist,
      backupArtistId: selectedBackupArtist.id,
    });
  };

  const renderArtistCard = ({ item }) => {
    const isSelected = selectedBackupArtist && String(selectedBackupArtist.id) === String(item.id);
    const spec = item.specializations?.[0]?.name || 'Backup Beauty Specialist';
    const rating = item.profile?.rating && Number(item.profile.rating) > 0 ? Number(item.profile.rating).toFixed(1) : '4.9';
    const locationText = item.profile?.location || targetLocation || 'Nearby City';

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedBackupArtist(item)}
        activeOpacity={0.85}
      >
        {/* Selection Checkbox/Radio */}
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>

        {/* Profile Avatar */}
        <Image source={{ uri: getUniqueProfileImage(item) }} style={styles.avatar} />

        {/* Artist Details */}
        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.backupBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#FF4F87" style={{ marginRight: 3 }} />
              <Text style={styles.backupBadgeText}>Backup Ready</Text>
            </View>
          </View>

          <Text style={styles.specText}>{spec}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color="#777" style={{ marginRight: 2 }} />
              <Text style={styles.metaText} numberOfLines={1}>{locationText}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="star" size={13} color="#FFB800" style={{ marginRight: 2 }} />
              <Text style={styles.metaText}>{rating}</Text>
            </View>
          </View>

          {/* Date Availability Indicator Badge */}
          <View style={styles.dateAvailBadge}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#059669" style={{ marginRight: 3 }} />
            <Text style={styles.dateAvailText}>Available on {dateStr ? dateStr.split(',')[0] : 'Booking Date'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader
        title="Select Backup Artist"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Banner Info Box */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="shield-checkmark" size={22} color="#FF4F87" />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>Protection Active</Text>
            <Text style={styles.bannerSubtext}>
              Choose a backup artist available on your booking date ({dateStr || 'Selected Date'}). If {artist?.name || 'your primary artist'} faces an emergency, your backup will step in.
            </Text>
          </View>
        </View>

        {/* List Title */}
        <Text style={styles.listHeaderTitle}>
          Available Backup Artists on {dateStr || 'Booking Date'} ({artists.length})
        </Text>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loadingText}>Checking backup artists availability for {dateStr || 'booking date'}...</Text>
          </View>
        ) : artists.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No Backup Artists Available on Date</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find other available artists on your selected date ({dateStr || 'Booking Date'}). You can still proceed and our system will assign an available backup if needed.
            </Text>
          </View>
        ) : (
          <FlatList
            data={artists}
            keyExtractor={item => String(item.id)}
            renderItem={renderArtistCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer Confirm Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, !selectedBackupArtist && artists.length > 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {selectedBackupArtist
                ? `Confirm ${selectedBackupArtist.name.split(' ')[0]} as Backup`
                : 'Confirm & Proceed to Review'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SelectBackupArtistScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Banner
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFD6E5',
    marginBottom: 20,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },

  // Header Title
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
  },

  // List
  listContent: {
    paddingBottom: 100,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF9FB',
  },

  // Radio
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#FF4F87',
    backgroundColor: '#FF4F87',
  },

  // Avatar
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
    marginRight: 14,
  },

  // Info
  infoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 6,
  },
  backupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  backupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4F87',
  },
  specText: {
    fontSize: 13,
    color: '#777',
    marginBottom: 6,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },

  // Date Availability Badge
  dateAvailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dateAvailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },

  // Loader & Empty
  loaderBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },
  emptyBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  confirmBtn: {
    height: 54,
    backgroundColor: '#FF4F87',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: '#FFAEC4',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

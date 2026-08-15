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
import { getArtists } from '../../api/auth';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';

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
  } = route?.params || {};

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackupArtist, setSelectedBackupArtist] = useState(null);

  // Extract target city / location string from artist profile or selectedLocation
  const targetLocation = artist?.profile?.location || 
    (typeof selectedLocation === 'string' ? selectedLocation : selectedLocation?.address) || 
    '';

  useEffect(() => {
    const fetchCandidateArtists = async () => {
      try {
        setLoading(true);
        // Try fetching artists by location first
        let data = await getArtists({ location: targetLocation });
        
        // Exclude primary artist
        let filtered = Array.isArray(data) ? data.filter(a => String(a.id) !== String(artist?.id)) : [];

        // Fallback: if no artists in same specific location, fetch all artists and filter out primary
        if (filtered.length === 0) {
          const allData = await getArtists({});
          filtered = Array.isArray(allData) ? allData.filter(a => String(a.id) !== String(artist?.id)) : [];
        }

        setArtists(filtered);

        // Pre-select first candidate artist if available
        if (filtered.length > 0) {
          setSelectedBackupArtist(filtered[0]);
        }
      } catch (err) {
        console.warn('Failed to load backup artists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateArtists();
  }, [artist, targetLocation]);

  const handleConfirm = () => {
    if (!selectedBackupArtist) {
      Alert.alert('Backup Artist Required', 'Please select a backup artist to proceed with Insurance Protection.');
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
              Choose a backup artist in your city. If {artist?.name || 'your primary artist'} faces an emergency, your backup will complete the service.
            </Text>
          </View>
        </View>

        {/* List Title */}
        <Text style={styles.listHeaderTitle}>
          Available Backup Artists ({artists.length})
        </Text>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loadingText}>Finding nearby backup artists...</Text>
          </View>
        ) : artists.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>No Backup Artists Found</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find other artists nearby right now. You can still proceed and our system will auto-assign a backup if needed.
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
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Banner
  bannerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0EB',
  },
  bannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4F87',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#555',
    lineHeight: 17,
  },

  // List Header
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  cardSelected: {
    backgroundColor: '#FFF',
    borderColor: '#FF4F87',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#BBB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  radioCircleSelected: {
    borderColor: '#FF4F87',
    backgroundColor: '#FF4F87',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  infoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  backupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  backupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF4F87',
  },
  specText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#555',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },

  // Loader & Empty
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  confirmBtn: {
    backgroundColor: '#FF4F87',
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnDisabled: {
    backgroundColor: '#FFB8CF',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

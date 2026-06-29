import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { getArtists } from '../../api/auth';

const BookLookArtistScreen = ({ navigation, route }) => {
  const look = route?.params?.look;

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Date and Time selection states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [tempDate, setTempDate] = useState(tomorrow);
  const [tempTime, setTempTime] = useState('10:00 AM');
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  const getNext14Days = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
  ];

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await getArtists();
        const list = Array.isArray(data) ? data : [];
        setArtists(list);
        if (list.length > 0) {
          setSelectedArtist(list[0]);
        }
      } catch (err) {
        console.warn('Failed to fetch artists:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const handleConfirm = () => {
    if (!selectedArtist) {
      Alert.alert('Required', 'Please select an artist to continue.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert('Required', 'Please select a date and time slot.');
      return;
    }

    // Navigate to BookAppointmentScreen
    navigation.navigate('BookAppointment', {
      artist: selectedArtist,
      selectedDate: selectedDate.toISOString(),
      selectedTime: selectedTime,
      selectedCategory: look?.title || look?.name || '',
    });
  };

  const formatDateLabel = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Book Makeup Artist"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {look && (
            <View style={styles.lookPreviewCard}>
              <Image
                source={look.image || require('../../assets/images/model.jpeg')}
                style={styles.lookPreviewImage}
              />
              <View style={styles.lookPreviewMeta}>
                <Text style={styles.lookPreviewLabel}>Booking Look</Text>
                <Text style={styles.lookPreviewTitle}>{look.title || look.name || 'Custom Glam Look'}</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Select Date & Time</Text>

          <TouchableOpacity
            style={styles.inputBox}
            activeOpacity={0.85}
            onPress={() => {
              setTempDate(selectedDate);
              setTempTime(selectedTime);
              setShowDateTimeModal(true);
            }}
          >
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.inputValueRow}>
              <Text style={styles.inputValue}>{formatDateLabel(selectedDate)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#FF4F87" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputBox}
            activeOpacity={0.85}
            onPress={() => {
              setTempDate(selectedDate);
              setTempTime(selectedTime);
              setShowDateTimeModal(true);
            }}
          >
            <Text style={styles.inputLabel}>Time</Text>
            <View style={styles.inputValueRow}>
              <Text style={styles.inputValue}>{selectedTime}</Text>
              <Ionicons name="time-outline" size={18} color="#FF4F87" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
            Select Artist
          </Text>

          {loading ? (
            <ActivityIndicator
              color="#FF4F87"
              size="large"
              style={{ marginVertical: 30 }}
            />
          ) : artists.length === 0 ? (
            <View style={styles.noArtistsContainer}>
              <Ionicons name="alert-circle-outline" size={36} color="#999" />
              <Text style={styles.noArtistsText}>No verified makeup artists found.</Text>
            </View>
          ) : (
            <View style={styles.artistList}>
              {artists.map(artist => {
                const isSelected = selectedArtist?.id === artist.id;
                const experience = artist.profile?.experience || 'Premium';
                const location = artist.profile?.location || 'India';
                const price = artist.services?.[0]?.priceRange || 'Price on Request';
                const rating = '4.8'; // default rating placeholder

                return (
                  <TouchableOpacity
                    key={artist.id}
                    style={[
                      styles.artistCard,
                      isSelected && styles.artistCardSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedArtist(artist)}
                  >
                    {artist.profile?.profileImage ? (
                      <Image
                        source={{ uri: artist.profile.profileImage }}
                        style={styles.artistImage}
                      />
                    ) : (
                      <View style={styles.artistImagePlaceholder}>
                        <Ionicons name="person" size={24} color="#FF4F87" />
                      </View>
                    )}
                    <View style={styles.artistInfo}>
                      <View style={styles.artistNameRow}>
                        <Text style={styles.artistName}>{artist.name}</Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color="#FF4F87" />
                        )}
                      </View>
                      <Text style={styles.artistDetailsText}>
                        ⭐ {rating} • {experience} yrs exp • {location}
                      </Text>
                    </View>
                    <Text style={styles.artistPrice}>{price}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date & Time Picker Modal */}
      <Modal visible={showDateTimeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date & Time</Text>
              <TouchableOpacity onPress={() => setShowDateTimeModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {getNext14Days().map((d, index) => {
                const isSelected = tempDate && d.toDateString() === tempDate.toDateString();
                const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                const dayNum = d.getDate();
                const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    onPress={() => setTempDate(d)}
                  >
                    <Text style={[styles.dayCardLabel, isSelected && styles.dayCardLabelSelected]}>{dayName}</Text>
                    <Text style={[styles.dayCardText, isSelected && styles.dayCardTextSelected]}>{dayNum}</Text>
                    <Text style={[styles.dayCardLabel, isSelected && styles.dayCardLabelSelected]}>{monthName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.filterLabel}>Select Time Slot</Text>
            <View style={styles.filterRow}>
              {timeSlots.map((slot, index) => {
                const isSelected = tempTime === slot;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.filterChip, isSelected && styles.selectedChip]}
                    onPress={() => setTempTime(slot)}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setShowDateTimeModal(false)}
              >
                <Text style={styles.clearButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setSelectedDate(tempDate);
                  setSelectedTime(tempTime);
                  setShowDateTimeModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Confirm Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BookLookArtistScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: {
    flex: 1,
    margin: 10,
    borderRadius: 28,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  lookPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
  },
  lookPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  lookPreviewMeta: {
    flex: 1,
    marginLeft: 12,
  },
  lookPreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4F87',
    textTransform: 'uppercase',
  },
  lookPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  lookSummaryCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFEBF1',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    marginBottom: 14,
  },
  lookSummaryTitle: {
    fontSize: 11,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  lookSummaryValue: {
    fontSize: 15,
    color: '#FF4F87',
    fontWeight: '800',
    marginTop: 2,
  },
  matchReason: {
    fontSize: 11,
    color: '#E05E85',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginVertical: 20,
  },
  inputBox: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '700',
  },
  inputValueRow: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D7E1',
    backgroundColor: '#FFF7FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  inputValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  artistList: {
    gap: 10,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F2E3E9',
  },
  artistCardSelected: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF5F8',
    borderWidth: 1.5,
  },
  artistImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  artistImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 10,
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  artistDetailsText: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 2,
  },
  artistPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#222',
    marginRight: 4,
  },
  noArtistsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
  },
  noArtistsText: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 35,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#222',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCard: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dayCardSelected: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  dayCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF4F87',
  },
  dayCardLabelSelected: {
    color: '#FFF',
  },
  dayCardText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4F87',
    marginVertical: 2,
  },
  dayCardTextSelected: {
    color: '#FFF',
  },
  filterChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 17,
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  filterChipText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedChipText: {
    color: '#FFF',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 10,
  },
  clearButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF4F87',
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#FF4F87',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

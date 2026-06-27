import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArtists } from '../../api/auth';
import ScreenHeader from '../../components/ScreenHeader';

const SearchScreen = ({ navigation, route, isTab = false }) => {
  const initialCategory = route?.params?.category || 'All';
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick select modal visibility states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Date and Time selection states
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
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

  const categories = [
    'All',
    'Bridal',
    'Party',
    'HD Makeup',
    'Airbrush',
    'Engagement',
    'Celebrity',
    'Reception',
    'Photoshoot',
    'Minimal',
  ];

  useEffect(() => {
    const fetchArtists = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await getArtists();
        const list = Array.isArray(data) ? data : [];
        setArtists(list);
      } catch (err) {
        console.warn('Failed to fetch artists:', err?.message);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchArtists();

    // Pre-populate city filter if detected
    AsyncStorage.getItem('detectedCity').then(city => {
      if (city) {
        setSelectedLocation(city);
      }
    });

    const interval = setInterval(() => {
      fetchArtists(true);
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (route?.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route?.params?.category]);

  const toggleFavorite = artistId => {
    if (favorites.includes(artistId)) {
      setFavorites(favorites.filter(id => id !== artistId));
    } else {
      setFavorites([...favorites, artistId]);
    }
  };

  const filteredArtists = artists.filter(artist => {
    const artistSpecialization =
      artist.specializations?.[0]?.name?.toLowerCase() || '';
    const artistLocation = artist.profile?.location?.toLowerCase() || '';
    const artistName = artist.name?.toLowerCase() || '';
    const artistRating = Number(artist.profile?.rating || artist.rating || 4.7);
    const artistPrice = Number(artist.services?.[0]?.price || 1500);

    const matchesCategory =
      selectedCategory === 'All' ||
      artistSpecialization.includes(selectedCategory.toLowerCase());

    const matchesLocation =
      !selectedLocation ||
      artistLocation.includes(selectedLocation.toLowerCase());

    const matchesRating = !selectedRating || artistRating >= selectedRating;

    let matchesPrice = true;
    if (selectedPrice === '0-2000') {
      matchesPrice = artistPrice <= 2000;
    } else if (selectedPrice === '2000-5000') {
      matchesPrice = artistPrice > 2000 && artistPrice <= 5000;
    } else if (selectedPrice === '5000+') {
      matchesPrice = artistPrice > 5000;
    }

    const matchesSearch =
      !searchText.trim() ||
      artistName.includes(searchText.toLowerCase()) ||
      artistSpecialization.includes(searchText.toLowerCase());

    return matchesCategory && matchesLocation && matchesRating && matchesPrice && matchesSearch;
  });

  const mainContent = (
    <View style={styles.container}>
      {/* Search Header */}
      {isTab ? (
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderTitle}>Search</Text>
        </View>
      ) : (
        <ScreenHeader title="Search" onBack={() => navigation.goBack()} />
      )}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 4 }} />
          <TextInput
            placeholder="Search artists, services..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="funnel-outline" size={20} color="#444" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Chips */}
      <View style={{ height: 46, marginBottom: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {/* Master Filters Chip */}
          <TouchableOpacity
            style={styles.filtersChip}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={13} color="#FF4F87" style={{ marginRight: 6 }} />
            <Text style={styles.filtersChipText}>Filters</Text>
          </TouchableOpacity>

          {/* Location Chip */}
          <TouchableOpacity
            style={[styles.filterPill, !!selectedLocation && styles.filterPillActive]}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={[styles.filterPillText, !!selectedLocation && styles.filterPillTextActive]}>
              {selectedLocation ? `Location: ${selectedLocation}` : 'Location'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={selectedLocation ? '#FF4F87' : '#666'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Price Chip */}
          <TouchableOpacity
            style={[styles.filterPill, !!selectedPrice && styles.filterPillActive]}
            onPress={() => setShowPriceModal(true)}
          >
            <Text style={[styles.filterPillText, !!selectedPrice && styles.filterPillTextActive]}>
              {selectedPrice ? `Price: ${selectedPrice === '0-2000' ? '₹0-₹2k' : selectedPrice === '2000-5000' ? '₹2k-₹5k' : '₹5k+'}` : 'Price'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={selectedPrice ? '#FF4F87' : '#666'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Rating Chip */}
          <TouchableOpacity
            style={[styles.filterPill, !!selectedRating && styles.filterPillActive]}
            onPress={() => setShowRatingModal(true)}
          >
            <Text style={[styles.filterPillText, !!selectedRating && styles.filterPillTextActive]}>
              {selectedRating ? `Rating: ${selectedRating}★` : 'Rating'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={selectedRating ? '#FF4F87' : '#666'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Schedule Chip */}
          <TouchableOpacity
            style={[styles.filterPill, !!selectedDate && styles.filterPillActive]}
            onPress={() => {
              setTempDate(selectedDate || new Date());
              setTempTime(selectedTime || '09:00 AM');
              setShowDateTimeModal(true);
            }}
          >
            <Text style={[styles.filterPillText, !!selectedDate && styles.filterPillTextActive]}>
              {selectedDate && selectedTime
                ? `${selectedDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })} at ${selectedTime}`
                : 'Schedule'}
            </Text>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={selectedDate ? '#FF4F87' : '#666'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Artists Scroll List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.artistSection}>
        {loading ? (
          <ActivityIndicator
            color="#FF4F87"
            size="large"
            style={{ marginVertical: 60 }}
          />
        ) : filteredArtists.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 60 }}>
            <Ionicons name="search-outline" size={48} color="#CCC" />
            <Text style={{ color: '#999', marginTop: 12, fontSize: 16 }}>
              No artists found
            </Text>
          </View>
        ) : (
          filteredArtists.map(artist => (
            <TouchableOpacity
              key={artist.id}
              style={styles.artistCard}
              onPress={() => navigation.navigate('ArtistDetails', {
                artist,
                selectedDate: selectedDate ? selectedDate.toISOString() : null,
                selectedTime,
                selectedCategory,
              })}
            >
              {artist.profile?.profileImage || artist.image ? (
                <Image
                  source={{
                    uri: artist.profile?.profileImage || artist.image,
                  }}
                  style={styles.artistImage}
                />
              ) : (
                <View style={styles.artistImagePlaceholder}>
                  <Ionicons name="person" size={32} color="#FF4F87" />
                </View>
              )}

              <View style={styles.artistInfo}>
                <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>

                <Text style={styles.artistSpeciality} numberOfLines={1}>
                  {artist.specializations?.[0]?.name || 'Makeup Artist'}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#F5B301" style={{ marginRight: 4 }} />
                  <Text style={styles.ratingText}>
                    {artist.profile?.rating || '4.8'} ({Number(artist.id) % 80 + 80})
                  </Text>
                  <Text style={styles.distanceText}>
                    {" • "}{(Number(artist.id) % 8) + 2} km
                  </Text>
                </View>

                <Text style={styles.artistPrice}>
                  From ₹{artist.services?.[0]?.price || 1500}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(artist.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={favorites.includes(artist.id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={favorites.includes(artist.id) ? '#FF4F87' : '#999'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MASTER FILTERS MODAL */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterRow}>
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, isSelected && styles.selectedChip]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Rating Filter */}
              <Text style={styles.filterLabel}>Rating</Text>
              <View style={styles.filterRow}>
                {[4.5, 4.0].map(rt => {
                  const isSelected = selectedRating === rt;
                  return (
                    <TouchableOpacity
                      key={rt}
                      style={[styles.filterChip, isSelected && styles.selectedChip]}
                      onPress={() => setSelectedRating(isSelected ? null : rt)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>
                        {rt} ★ & Above
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Filter */}
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.filterRow}>
                {['0-2000', '2000-5000', '5000+'].map(pr => {
                  const isSelected = selectedPrice === pr;
                  const label = pr === '0-2000' ? '₹0 - ₹2000' : pr === '2000-5000' ? '₹2000 - ₹5000' : '₹5000+';
                  return (
                    <TouchableOpacity
                      key={pr}
                      style={[styles.filterChip, isSelected && styles.selectedChip]}
                      onPress={() => setSelectedPrice(isSelected ? null : pr)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Location Filter */}
              <Text style={styles.filterLabel}>Location</Text>
              <View style={styles.filterRow}>
                {['Pune', 'Mumbai', 'Delhi', 'Bangalore'].map(loc => {
                  const isSelected = selectedLocation === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.filterChip, isSelected && styles.selectedChip]}
                      onPress={() => setSelectedLocation(isSelected ? null : loc)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedCategory('All');
                  setSelectedRating(null);
                  setSelectedPrice(null);
                  setSelectedLocation(null);
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilter(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* QUICK LOCATION MODAL */}
      <Modal visible={showLocationModal} animationType="slide" transparent onRequestClose={() => setShowLocationModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSheetContent}>
              {['All Locations', 'Pune', 'Mumbai', 'Delhi', 'Bangalore'].map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.bottomSheetOption, (loc === 'All Locations' ? !selectedLocation : selectedLocation === loc) && styles.bottomSheetOptionActive]}
                  onPress={() => {
                    setSelectedLocation(loc === 'All Locations' ? null : loc);
                    setShowLocationModal(false);
                  }}
                >
                  <Text style={[styles.bottomSheetOptionText, (loc === 'All Locations' ? !selectedLocation : selectedLocation === loc) && styles.bottomSheetOptionTextActive]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* QUICK PRICE MODAL */}
      <Modal visible={showPriceModal} animationType="slide" transparent onRequestClose={() => setShowPriceModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPriceModal(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Price Range</Text>
              <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSheetContent}>
              {['All Prices', '0-2000', '2000-5000', '5000+'].map(pr => {
                const isSelected = pr === 'All Prices' ? !selectedPrice : selectedPrice === pr;
                const label = pr === 'All Prices' ? 'All Prices' : pr === '0-2000' ? '₹0 - ₹2000' : pr === '2000-5000' ? '₹2000 - ₹5000' : '₹5000+';
                return (
                  <TouchableOpacity
                    key={pr}
                    style={[styles.bottomSheetOption, isSelected && styles.bottomSheetOptionActive]}
                    onPress={() => {
                      setSelectedPrice(pr === 'All Prices' ? null : pr);
                      setShowPriceModal(false);
                    }}
                  >
                    <Text style={[styles.bottomSheetOptionText, isSelected && styles.bottomSheetOptionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* QUICK RATING MODAL */}
      <Modal visible={showRatingModal} animationType="slide" transparent onRequestClose={() => setShowRatingModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRatingModal(false)}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Minimum Rating</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSheetContent}>
              {['All Ratings', 4.5, 4.0].map(rt => {
                const isSelected = rt === 'All Ratings' ? !selectedRating : selectedRating === rt;
                const label = rt === 'All Ratings' ? 'All Ratings' : `${rt} ★ & Above`;
                return (
                  <TouchableOpacity
                    key={rt}
                    style={[styles.bottomSheetOption, isSelected && styles.bottomSheetOptionActive]}
                    onPress={() => {
                      setSelectedRating(rt === 'All Ratings' ? null : rt);
                      setShowRatingModal(false);
                    }}
                  >
                    <Text style={[styles.bottomSheetOptionText, isSelected && styles.bottomSheetOptionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* DATE & TIME / SCHEDULE MODAL */}
      <Modal visible={showDateTimeModal} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDateTimeModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Appointment</Text>
              <TouchableOpacity onPress={() => setShowDateTimeModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginVertical: 10 }}>
              {getNext14Days().map((date, index) => {
                const isSelected = tempDate && tempDate.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    onPress={() => setTempDate(date)}
                  >
                    <Text style={[styles.dayCardLabel, isSelected && styles.dayCardLabelSelected]}>
                      {date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[styles.dayCardText, isSelected && styles.dayCardTextSelected]}>
                      {date.getDate()}
                    </Text>
                    <Text style={[styles.dayCardLabel, isSelected && styles.dayCardLabelSelected]}>
                      {date.toLocaleDateString('en-IN', { month: 'short' })}
                    </Text>
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
                onPress={() => {
                  setTempDate(null);
                  setTempTime(null);
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setSelectedDate(tempDate);
                  setSelectedTime(tempTime);
                  setShowDateTimeModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {!isTab && <BottomNavigation navigation={navigation} activeTab="Search" />}
    </View>
  );

  if (isTab) {
    return mainContent;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      {mainContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  tabHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    fontFamily: 'System',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#222',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  filtersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBF0',
    borderWidth: 1,
    borderColor: '#FFD1DC',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 36,
    marginRight: 10,
  },
  filtersChipText: {
    color: '#FF4F87',
    fontWeight: '600',
    fontSize: 13,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 36,
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: '#FFEBF0',
    borderColor: '#FF4F87',
  },
  filterPillText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#FF4F87',
  },
  artistSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  artistImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFEBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  artistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 2,
  },
  artistSpeciality: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
  },
  distanceText: {
    fontSize: 13,
    color: '#777777',
  },
  artistPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  favoriteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 35,
    maxHeight: '85%',
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
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedChip: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  selectedChipText: {
    color: '#FFF',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 25,
  },
  clearButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clearButtonText: {
    color: '#FF4F87',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#FF4F87',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    width: '100%',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  bottomSheetContent: {
    flexDirection: 'column',
  },
  bottomSheetOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    marginBottom: 8,
  },
  bottomSheetOptionActive: {
    backgroundColor: '#FFEBF0',
    borderColor: '#FF4F87',
  },
  bottomSheetOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  bottomSheetOptionTextActive: {
    color: '#FF4F87',
  },
  dayCard: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayCardSelected: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  dayCardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginVertical: 2,
  },
  dayCardTextSelected: {
    color: '#FFF',
  },
  dayCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
  },
  dayCardLabelSelected: {
    color: '#FFF',
  },
});

export default SearchScreen;

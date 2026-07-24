import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
import { useFocusEffect } from '@react-navigation/native';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArtists } from '../../api/auth';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';
import ScreenHeader from '../../components/ScreenHeader';

const LOCATIONIQ_API_KEY = 'pk.30df6c1f1ec752495ea504fe88556693'; // LocationIQ API access token

const SearchScreen = ({ navigation, route, isTab = false }) => {
  const initialCategory = route?.params?.category || 'All';
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showInlineLocation, setShowInlineLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedGender, setSelectedGender] = useState('All');
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [clientCityName, setClientCityName] = useState('Pune');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleToggleNearMe = async () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      setSelectedLocation(null);
    } else {
      try {
        const storedCity = await AsyncStorage.getItem('detectedCity');
        const storedLocName = await AsyncStorage.getItem('detectedLocationName');
        const targetCity = storedCity || storedLocName || 'Pune';
        setClientCityName(targetCity);
        setSelectedLocation(targetCity);
        setIsNearMeActive(true);
      } catch (err) {
        console.warn('Failed to load client city for Near Me:', err);
        setSelectedLocation('Pune');
        setIsNearMeActive(true);
      }
    }
  };

  useEffect(() => {
    if (!selectedLocation) {
      setIsNearMeActive(false);
    }
  }, [selectedLocation]);

  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem('client_favorites');
          if (stored) {
            setFavorites(JSON.parse(stored));
          } else {
            setFavorites([]);
          }
        } catch (err) {
          console.warn('Failed to load favorites:', err);
        }
      };
      loadFavorites();
    }, [])
  );

  // Quick select modal visibility states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Date and Time selection states
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  const [locationText, setLocationText] = useState(selectedLocation || '');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    setLocationText(selectedLocation || '');
  }, [selectedLocation]);

  const fetchLocationSuggestions = async (text) => {
    setLocationText(text);
    setSelectedLocation(text && text.trim().length > 0 ? text.trim() : null);
    if (!text || text.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await fetch(
        `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(text)}&limit=5&dedupe=1`
      );
      if (!response.ok) {
        throw new Error('LocationIQ query failed');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const suggestions = data.map(item => {
          const address = item.address || {};
          const city = address.city || address.town || address.village || address.city_district || address.state || item.display_name;
          return {
            displayName: item.display_name,
            cityName: city,
          };
        });

        // Filter duplicates by cityName
        const unique = [];
        const seen = new Set();
        for (const sugg of suggestions) {
          if (sugg.cityName && !seen.has(sugg.cityName.toLowerCase())) {
            seen.add(sugg.cityName.toLowerCase());
            unique.push(sugg);
          }
        }
        setLocationSuggestions(unique);
      } else {
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.warn('LocationIQ autocomplete failed:', error);
      setLocationSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

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
    'Morning Slot (7:00 AM - 11:00 AM)',
    'Afternoon Slot (11:00 AM - 3:00 PM)',
    'Evening Slot (3:00 PM - 8:00 PM)',
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

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchArtists = async (pageNum = 1, shouldReset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const filters = {
        page: pageNum,
        limit: 20,
        search: searchText,
        category: selectedCategory,
        rating: selectedRating,
        priceRange: selectedPrice,
        location: selectedLocation || undefined,
        gender: selectedGender !== 'All' ? selectedGender : undefined,
      };

      const data = await getArtists(filters);
      const list = Array.isArray(data) ? data : [];

      if (pageNum === 1) {
        setArtists(list);
      } else {
        setArtists((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const filteredNew = list.filter((a) => !existingIds.has(a.id));
          return [...prev, ...filteredNew];
        });
      }

      if (list.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.warn('Failed to fetch artists:', err?.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced API calls when search or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchArtists(1, true);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, selectedCategory, selectedRating, selectedPrice, selectedLocation, selectedGender]);

  useEffect(() => {
    if (route?.params?.category) {
      const cat = route.params.category;
      setSelectedCategory(cat);
      if (cat !== 'All') {
        setSearchText(cat);
      } else {
        setSearchText('');
      }
    }
  }, [route?.params?.category]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArtists(nextPage, false);
    }
  };

  const toggleFavorite = async (artistId) => {
    let updated;
    if (favorites.includes(artistId)) {
      updated = favorites.filter(id => id !== artistId);
    } else {
      updated = [...favorites, artistId];
    }
    setFavorites(updated);
    try {
      await AsyncStorage.setItem('client_favorites', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save favorites:', err);
    }
  };

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

        {/* Near Me Quick Button */}
        <TouchableOpacity
          style={[styles.nearMeBtn, isNearMeActive && styles.nearMeBtnActive]}
          onPress={handleToggleNearMe}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isNearMeActive ? "location" : "location-outline"}
            size={16}
            color={isNearMeActive ? "#FFF" : "#FF4F87"}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.nearMeBtnText, isNearMeActive && styles.nearMeBtnTextActive]}>
            Near Me
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
        >
          <Ionicons
            name={showOnlyFavorites ? 'heart' : 'heart-outline'}
            size={22}
            color={showOnlyFavorites ? '#FF4F87' : '#999'}
          />
        </TouchableOpacity>
      </View>

      {/* Active Near Me Location Banner */}
      {isNearMeActive && (
        <View style={styles.nearMeBanner}>
          <Ionicons name="location" size={15} color="#FF4F87" style={{ marginRight: 6 }} />
          <Text style={styles.nearMeBannerText}>
            Showing artists in <Text style={{ fontWeight: '700', color: '#111' }}>{selectedLocation || clientCityName}</Text>
          </Text>
          <TouchableOpacity onPress={handleToggleNearMe} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      {/* Horizontal Filter Chips (Only shown after entering search text) */}
      {!!searchText.trim() && (
        <View style={{ height: 46, marginBottom: 4, justifyContent: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}
          >
            {/* Near Me Chip */}
            <TouchableOpacity
              style={[styles.filterPill, isNearMeActive && styles.filterPillActive]}
              onPress={handleToggleNearMe}
            >
              <Ionicons name="location" size={13} color={isNearMeActive ? '#FF4F87' : '#666'} style={{ marginRight: 4 }} />
              <Text style={[styles.filterPillText, isNearMeActive && styles.filterPillTextActive]}>
                {isNearMeActive ? `Near Me (${selectedLocation || clientCityName})` : 'Near Me'}
              </Text>
            </TouchableOpacity>

            {/* Master Filters Chip */}
            <TouchableOpacity
              style={styles.filtersChip}
              onPress={() => setShowFilter(true)}
            >
              <Ionicons name="options-outline" size={13} color="#FF4F87" style={{ marginRight: 6 }} />
              <Text style={styles.filtersChipText}>Filters</Text>
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

            {/* Gender Chip */}
            <TouchableOpacity
              style={[styles.filterPill, selectedGender !== 'All' && styles.filterPillActive]}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={[styles.filterPillText, selectedGender !== 'All' && styles.filterPillTextActive]}>
                {selectedGender !== 'All' ? `Gender: ${selectedGender}` : 'Gender'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={selectedGender !== 'All' ? '#FF4F87' : '#666'}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}



      {/* Artists Scroll List */}
      {loading && page === 1 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
          <ActivityIndicator color="#FF4F87" size="large" />
        </View>
      ) : (
        <FlatList
          data={showOnlyFavorites ? artists.filter(a => favorites.includes(a.id)) : artists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item: artist }) => {
            return (
              <TouchableOpacity
                style={styles.artistCard}
                onPress={() => navigation.navigate('ArtistDetails', {
                  artist,
                  selectedDate: selectedDate ? selectedDate.toISOString() : null,
                  selectedTime,
                  selectedCategory,
                })}
              >
                <Image
                  source={{ uri: getUniqueProfileImage(artist) }}
                  style={styles.artistImage}
                />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <Text style={styles.artistSpeciality}>
                    {artist.specializations?.[0]?.name || 'Makeup Artist'} • {artist.profile?.location || 'India'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFB800" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>{Number(artist.profile?.rating || artist.rating || 4.7).toFixed(1)}</Text>
                    <View style={styles.glamBadgeChip}>
                      <Ionicons name="sparkles" size={11} color="#FF4F87" style={{ marginRight: 2 }} />
                      <Text style={styles.glamBadgeText}>{artist.glamScore ? Number(artist.glamScore).toFixed(1) : '95.0'} Glam Score</Text>
                    </View>
                  </View>
                  <Text style={styles.artistPrice}>
                    Starting: {artist.services?.[0]?.priceRange || '₹1,500'}
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
            );
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (!loadingMore) return null;
            return (
              <ActivityIndicator
                color="#FF4F87"
                size="small"
                style={{ marginVertical: 20 }}
              />
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginVertical: 60, paddingHorizontal: 20 }}>
              <Ionicons name={selectedLocation ? "location-outline" : "search-outline"} size={48} color={selectedLocation ? "#FF4F87" : "#CCC"} />
              <Text style={{ color: '#222', marginTop: 14, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
                {selectedLocation ? 'No artist at our location' : 'No artists found'}
              </Text>
              <Text style={{ color: '#777', marginTop: 6, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {selectedLocation
                  ? `No registered artists are available in ${selectedLocation} right now.`
                  : 'No artists found matching your criteria.'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.artistSection}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MASTER FILTERS MODAL */}
      <Modal visible={showFilter} animationType="slide" transparent onRequestClose={() => setShowFilter(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilter(false)} />
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

              {/* Gender Filter */}
              <Text style={styles.filterLabel}>Gender</Text>
              <View style={styles.filterRow}>
                {['All', 'Female', 'Male'].map(g => {
                  const isSelected = selectedGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.filterChip, isSelected && styles.selectedChip]}
                      onPress={() => setSelectedGender(g)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.selectedChipText]}>
                        {g}
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
                  setSelectedGender('All');
                  setLocationText('');
                  setLocationSuggestions([]);
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
        </View>
      </Modal>



      {/* QUICK PRICE MODAL */}
      <Modal visible={showPriceModal} animationType="slide" transparent onRequestClose={() => setShowPriceModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPriceModal(false)} />
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
        </View>
      </Modal>

      {/* QUICK RATING MODAL */}
      <Modal visible={showRatingModal} animationType="slide" transparent onRequestClose={() => setShowRatingModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRatingModal(false)} />
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
        </View>
      </Modal>

      {/* QUICK GENDER MODAL */}
      <Modal visible={showGenderModal} animationType="slide" transparent onRequestClose={() => setShowGenderModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGenderModal(false)} />
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.bottomSheetContent}>
              {['All', 'Female', 'Male'].map(g => {
                const isSelected = selectedGender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.bottomSheetOption, isSelected && styles.bottomSheetOptionActive]}
                    onPress={() => {
                      setSelectedGender(g);
                      setShowGenderModal(false);
                    }}
                  >
                    <Text style={[styles.bottomSheetOptionText, isSelected && styles.bottomSheetOptionActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* DATE & TIME / SCHEDULE MODAL */}
      <Modal visible={showDateTimeModal} animationType="slide" transparent onRequestClose={() => setShowDateTimeModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDateTimeModal(false)} />
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
        </View>
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
    marginLeft: 8,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
  },
  nearMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FFD6E5',
    marginLeft: 8,
  },
  nearMeBtnActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  nearMeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F87',
  },
  nearMeBtnTextActive: {
    color: '#FFFFFF',
  },
  nearMeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  nearMeBannerText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
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
  looksSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  lookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    elevation: 3,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  imageContainer: {
    width: '100%',
    height: 230,
    backgroundColor: '#F9F9F9',
    position: 'relative',
  },
  lookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lookImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBF0',
  },
  lookTagBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 79, 135, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lookTagText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    elevation: 1,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  lookInfo: {
    padding: 16,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  artistProfileThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFEBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFEBF0',
  },
  artistThumbImage: {
    width: '100%',
    height: '100%',
  },
  artistThumbInitials: {
    color: '#FF4F87',
    fontWeight: '700',
    fontSize: 16,
  },
  artistNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  artistSpecText: {
    fontSize: 12,
    color: '#777',
    marginTop: 1,
  },
  lookDescriptionText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  priceLabelText: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },
  priceValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4F87',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
  },
  locationInputIcon: {
    marginRight: 8,
  },
  locationTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
    paddingVertical: 0,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingVertical: 6,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  suggestionText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },

  // Inline Location Input (below the filter chips)
  inlineLocationWrapper: {
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    elevation: 3,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inlineLocationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
  },
  inlineLocationInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
    paddingVertical: 0,
  },
  inlineSuggestionsContainer: {
    marginHorizontal: 20,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD6E5',
    elevation: 6,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 999,
  },
  inlineSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF5F8',
  },
  inlineSuggestionText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  glamBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  glamBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F87',
  },
});

export default SearchScreen;

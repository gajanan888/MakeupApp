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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArtists } from '../../api/auth';
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
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Flatten all portfolio items from all artists, creating a fallback if they have no portfolio items
  const allPortfolioItems = [];
  artists.forEach(artist => {
    if (artist.portfolio && artist.portfolio.length > 0) {
      artist.portfolio.forEach(item => {
        allPortfolioItems.push({
          ...item,
          artist,
        });
      });
    } else {
      // Fallback look using the artist profile image
      allPortfolioItems.push({
        id: `fallback-${artist.id}`,
        beforeImageUrl: null,
        afterImageUrl: artist.profile?.profileImage || null,
        tag: artist.specializations?.[0]?.name || 'Signature Look',
        description: artist.profile?.bio || 'Professional makeup look',
        artist,
      });
    }
  });

  // Filter the portfolio items list
  const filteredLooks = allPortfolioItems.filter(item => {
    const artist = item.artist;
    const artistSpecialization = artist.specializations?.[0]?.name?.toLowerCase() || '';
    const artistLocation = artist.profile?.location?.toLowerCase() || '';
    const artistName = artist.name?.toLowerCase() || '';
    const artistRating = Number(artist.profile?.rating || artist.rating || 4.7);

    // Parse price from services
    const artistPrice = artist.services?.[0]?.priceRange
      ? parseInt(artist.services[0].priceRange.replace(/[^\d]/g, ''), 10)
      : 1500;

    const matchesCategory =
      selectedCategory === 'All' ||
      artistSpecialization.includes(selectedCategory.toLowerCase()) ||
      (item.tag && item.tag.toLowerCase().includes(selectedCategory.toLowerCase()));

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

    const searchLower = searchText.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      artistName.includes(searchLower) ||
      artistSpecialization.includes(searchLower) ||
      (item.tag && item.tag.toLowerCase().includes(searchLower)) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      (artist.services && artist.services.some(svc => svc.specialization?.toLowerCase().includes(searchLower)));

    const matchesFavorites = !showOnlyFavorites || favorites.includes(artist.id);

    return matchesCategory && matchesLocation && matchesRating && matchesPrice && matchesSearch && matchesFavorites;
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
          onPress={() => setShowOnlyFavorites(!showOnlyFavorites)}
        >
          <Ionicons
            name={showOnlyFavorites ? 'heart' : 'heart-outline'}
            size={22}
            color={showOnlyFavorites ? '#FF4F87' : '#999'}
          />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Chips */}
      <View style={{ height: 46, marginBottom: 4, justifyContent: 'center' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Master Filters Chip */}
          <TouchableOpacity
            style={styles.filtersChip}
            onPress={() => setShowFilter(true)}
          >
            <Ionicons name="options-outline" size={13} color="#FF4F87" style={{ marginRight: 6 }} />
            <Text style={styles.filtersChipText}>Filters</Text>
          </TouchableOpacity>

          {/* Location Chip - inline expandable */}
          <TouchableOpacity
            style={[styles.filterPill, (!!selectedLocation || showInlineLocation) && styles.filterPillActive]}
            onPress={() => setShowInlineLocation(!showInlineLocation)}
          >
            <Ionicons name="location-outline" size={13} color={(selectedLocation || showInlineLocation) ? '#FF4F87' : '#666'} style={{ marginRight: 4 }} />
            <Text style={[styles.filterPillText, (!!selectedLocation || showInlineLocation) && styles.filterPillTextActive]}>
              {selectedLocation ? selectedLocation : 'Location'}
            </Text>
            {selectedLocation ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedLocation(null);
                  setLocationText('');
                  setLocationSuggestions([]);
                  setShowInlineLocation(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color="#FF4F87" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name={showInlineLocation ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={(selectedLocation || showInlineLocation) ? '#FF4F87' : '#666'}
                style={{ marginLeft: 4 }}
              />
            )}
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
        </ScrollView>
      </View>

      {/* Inline Location Search (expanded below filter chips) */}
      {showInlineLocation && (
        <View>
          {/* Input row */}
          <View style={styles.inlineLocationWrapper}>
            <View style={styles.inlineLocationInputRow}>
              <Ionicons name="location-outline" size={18} color="#FF4F87" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inlineLocationInput}
                placeholder="Search city..."
                placeholderTextColor="#999"
                value={locationText}
                onChangeText={fetchLocationSuggestions}
                autoFocus
              />
              {locationText ? (
                <TouchableOpacity
                  onPress={() => {
                    setLocationText('');
                    setSelectedLocation(null);
                    setLocationSuggestions([]);
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#CCC" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Suggestions rendered OUTSIDE the wrapper to avoid overflow clipping */}
          {loadingSuggestions && (
            <ActivityIndicator color="#FF4F87" size="small" style={{ marginVertical: 6, alignSelf: 'flex-start', marginLeft: 28 }} />
          )}
          {locationSuggestions.length > 0 && (
            <View style={styles.inlineSuggestionsContainer}>
              {locationSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.inlineSuggestionItem}
                  onPress={() => {
                    setSelectedLocation(item.cityName);
                    setLocationText(item.cityName);
                    setLocationSuggestions([]);
                    setShowInlineLocation(false);
                  }}
                >
                  <Ionicons name="location" size={15} color="#FF4F87" style={{ marginRight: 8 }} />
                  <Text style={styles.inlineSuggestionText} numberOfLines={1}>{item.displayName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Looks/Portfolios Scroll List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.looksSection}>
        {loading ? (
          <ActivityIndicator
            color="#FF4F87"
            size="large"
            style={{ marginVertical: 60 }}
          />
        ) : filteredLooks.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 60 }}>
            <Ionicons name="search-outline" size={48} color="#CCC" />
            <Text style={{ color: '#999', marginTop: 12, fontSize: 16 }}>
              No looks found
            </Text>
          </View>
        ) : (
          filteredLooks.map(look => {
            const artist = look.artist;
            return (
              <TouchableOpacity
                key={`${artist.id}-${look.id}`}
                style={styles.lookCard}
                onPress={() => navigation.navigate('ArtistDetails', {
                  artist,
                  selectedDate: selectedDate ? selectedDate.toISOString() : null,
                  selectedTime,
                  selectedCategory,
                })}
              >
                <View style={styles.imageContainer}>
                  {look.afterImageUrl ? (
                    <Image
                      source={{ uri: look.afterImageUrl }}
                      style={styles.lookImage}
                    />
                  ) : (
                    <View style={styles.lookImagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#FF4F87" />
                    </View>
                  )}

                  {/* Look/Tag Badge */}
                  <View style={styles.lookTagBadge}>
                    <Text style={styles.lookTagText}>{look.tag || 'Makeup Look'}</Text>
                  </View>

                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFB800" style={{ marginRight: 2 }} />
                    <Text style={styles.ratingBadgeText}>
                      {artist.profile?.rating || '4.8'}
                    </Text>
                  </View>
                </View>

                <View style={styles.lookInfo}>
                  <View style={styles.artistRow}>
                    <View style={styles.artistProfileThumb}>
                      {artist.profile?.profileImage ? (
                        <Image
                          source={{ uri: artist.profile.profileImage }}
                          style={styles.artistThumbImage}
                        />
                      ) : (
                        <Text style={styles.artistThumbInitials}>
                          {artist.name?.charAt(0)?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.artistNameText} numberOfLines={1}>
                        {artist.name}
                      </Text>
                      <Text style={styles.artistSpecText} numberOfLines={1}>
                        {artist.specializations?.[0]?.name || 'Makeup Artist'} • {artist.profile?.location || 'India'}
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
                  </View>

                  {look.description ? (
                    <Text style={styles.lookDescriptionText} numberOfLines={2}>
                      {look.description}
                    </Text>
                  ) : null}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabelText}>Starting Service Price:</Text>
                    <Text style={styles.priceValueText}>
                      {artist.services?.[0]?.priceRange || '₹1,500'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
              <View style={styles.locationInputContainer}>
                <Ionicons name="location-outline" size={20} color="#FF4F87" style={styles.locationInputIcon} />
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Search city..."
                  placeholderTextColor="#999"
                  value={locationText}
                  onChangeText={fetchLocationSuggestions}
                />
                {locationText ? (
                  <TouchableOpacity
                    onPress={() => {
                      setLocationText('');
                      setSelectedLocation(null);
                      setLocationSuggestions([]);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#CCC" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {loadingSuggestions && (
                <ActivityIndicator color="#FF4F87" size="small" style={{ marginVertical: 8, alignSelf: 'flex-start' }} />
              )}

              {locationSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {locationSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSelectedLocation(item.cityName);
                        setLocationText(item.cityName);
                        setLocationSuggestions([]);
                      }}
                    >
                      <Ionicons name="location" size={16} color="#FF4F87" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText} numberOfLines={1}>{item.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedCategory('All');
                  setSelectedRating(null);
                  setSelectedPrice(null);
                  setSelectedLocation(null);
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
});

export default SearchScreen;

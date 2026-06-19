import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
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
} from 'react-native';
import { getArtists } from '../../api/auth';
import ScreenHeader from '../../components/ScreenHeader';

const SearchScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await getArtists();
        const list = Array.isArray(data) ? data : [];
        setArtists(list);
      } catch (err) {
        console.warn('Failed to fetch artists:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

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

    const matchesCategory =
      selectedCategory === 'All' ||
      artistSpecialization.includes(selectedCategory.toLowerCase());

    const matchesLocation =
      !selectedLocation ||
      artistLocation.includes(selectedLocation.toLowerCase());

    const matchesRating = !selectedRating;

    const matchesSearch =
      !searchText.trim() ||
      artistName.includes(searchText.toLowerCase()) ||
      artistSpecialization.includes(searchText.toLowerCase());

    return matchesCategory && matchesLocation && matchesRating && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScreenHeader title="Search" onBack={() => navigation.goBack()} />

      {/* Search Bar */}

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />

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
          <Ionicons name="options-outline" size={20} color="#444" />
        </TouchableOpacity>
      </View>
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>

              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Rating</Text>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedRating === 4.5 && styles.selectedChip,
                ]}
                onPress={() => setSelectedRating(4.5)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedRating === 4.5 && styles.selectedChipText,
                  ]}
                >
                  4.5 ★ & Above
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedRating === 4.0 && styles.selectedChip,
                ]}
                onPress={() => setSelectedRating(4.0)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedRating === 4.0 && styles.selectedChipText,
                  ]}
                >
                  4.0 ★ & Above
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Price Range</Text>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedPrice === '0-2000' && styles.selectedChip,
                ]}
                onPress={() => setSelectedPrice('0-2000')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPrice === '0-2000' && styles.selectedChipText,
                  ]}
                >
                  ₹0 - ₹2000
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedPrice === '2000-5000' && styles.selectedChip,
                ]}
                onPress={() => setSelectedPrice('2000-5000')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPrice === '2000-5000' && styles.selectedChipText,
                  ]}
                >
                  ₹2000 - ₹5000
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedPrice === '5000+' && styles.selectedChip,
                ]}
                onPress={() => setSelectedPrice('5000+')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPrice === '5000+' && styles.selectedChipText,
                  ]}
                >
                  ₹5000+
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Location</Text>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedLocation === 'Pune' && styles.selectedChip,
                ]}
                onPress={() => setSelectedLocation('Pune')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocation === 'Pune' && styles.selectedChipText,
                  ]}
                >
                  Pune
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedLocation === 'Mumbai' && styles.selectedChip,
                ]}
                onPress={() => setSelectedLocation('Mumbai')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocation === 'Mumbai' && styles.selectedChipText,
                  ]}
                >
                  Mumbai
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedLocation === 'Delhi' && styles.selectedChip,
                ]}
                onPress={() => setSelectedLocation('Delhi')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocation === 'Delhi' && styles.selectedChipText,
                  ]}
                >
                  Delhi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedLocation === 'Bangalore' && styles.selectedChip,
                ]}
                onPress={() => setSelectedLocation('Bangalore')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocation === 'Bangalore' && styles.selectedChipText,
                  ]}
                >
                  Bangalore
                </Text>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.clearButtonText}>Clear</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Filter Chips */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={
                selectedCategory === category ? styles.activeChip : styles.chip
              }
            >
              <Text
                style={{
                  color: selectedCategory === category ? '#FFF' : '#444',
                  fontWeight: '600',
                }}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.artistSection}>
          {loading ? (
            <ActivityIndicator
              color="#FF4F87"
              size="large"
              style={{ marginVertical: 40 }}
            />
          ) : filteredArtists.length === 0 ? (
            <View style={{ alignItems: 'center', marginVertical: 40 }}>
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
                onPress={() => navigation.navigate('ArtistDetails', { artist })}
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
                    <Ionicons name="person" size={40} color="#FF4F87" />
                  </View>
                )}

                <View style={styles.artistInfo}>
                  <View style={styles.topRow}>
                    <Text style={styles.artistName}>{artist.name}</Text>

                    <TouchableOpacity onPress={() => toggleFavorite(artist.id)}>
                      <Ionicons
                        name={
                          favorites.includes(artist.id)
                            ? 'heart'
                            : 'heart-outline'
                        }
                        size={22}
                        color={
                          favorites.includes(artist.id) ? '#FF4F87' : '#999'
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.artistSpeciality}>
                    {artist.specializations?.[0]?.name || 'Makeup Artist'}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F5B301" />

                    <Text style={styles.ratingText}>
                      {artist.profile?.experience
                        ? `${artist.profile.experience} yrs exp`
                        : 'New'}
                    </Text>

                    <Text style={styles.distanceText}>
                      • {artist.profile?.location || 'India'}
                    </Text>
                  </View>

                  <Text style={styles.artistPrice}>
                    {artist.services?.[0]?.priceRange || 'Price on Request'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNavigation navigation={navigation} activeTab="Search" />
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingTop: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 18,
  },

  filterButton: {
    width: 52,
    height: 48,

    borderRadius: 18,

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',

    marginLeft: 12,

    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  selectedFilter: {
    backgroundColor: '#FFE4ED',
    borderRadius: 12,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    paddingHorizontal: 12,

    height: 48,

    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,

    fontSize: 14,
    color: '#222',
  },

  filterContainer: {
    paddingLeft: 12,
    paddingRight: 10,
    marginTop: 22,
  },

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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },

  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },

  filterOption: {
    paddingVertical: 12,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 25,
  },

  clearButton: {
    flex: 1,
    height: 54,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: '#FF4F87',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 10,
  },

  clearButtonText: {
    color: '#FF4F87',
    fontSize: 16,
    fontWeight: '700',
  },

  applyButton: {
    flex: 2,

    backgroundColor: '#FF4F87',

    height: 54,

    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  activeChip: {
    backgroundColor: '#FF4F87',

    paddingHorizontal: 14,
    height: 34,

    borderRadius: 17,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  chip: {
    backgroundColor: '#FFFFFF',

    paddingHorizontal: 14,
    height: 34,

    borderRadius: 21,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,

    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  chipText: {
    color: '#444',
    fontWeight: '600',
    fontSize: 14,
  },
  artistSection: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 120,
  },

  artistCard: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 10,

    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,

    elevation: 2,
  },

  artistImage: {
    width: 82,
    height: 100,

    borderRadius: 16,
  },

  artistImagePlaceholder: {
    width: 82,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#FFE6EF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  artistInfo: {
    flex: 1,
    marginLeft: 10,
  },

  artistName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  artistSpeciality: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 8,
  },

  ratingText: {
    fontSize: 13,
    color: '#444',
    marginLeft: 4,
  },

  distanceText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },

  artistPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginTop: 6,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    height: 42,

    borderRadius: 21,

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
});

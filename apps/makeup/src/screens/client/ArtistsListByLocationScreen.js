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
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArtists } from '../../api/auth';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';

const ArtistsListByLocationScreen = ({ navigation, route }) => {
  const { location } = route.params;
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await getArtists({ location });
        if (Array.isArray(data)) {
          setArtists(data);
        }
      } catch (err) {
        console.warn('Failed to load artists by location:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [location]);

  const renderArtistItem = ({ item }) => {
    const spec = item.specializations?.[0]?.name || 'Makeup Artist';
    const rating = item.profile?.rating && Number(item.profile.rating) > 0 ? Number(item.profile.rating).toFixed(1) : '0';
    const reviews = item.profile?.reviewCount || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ArtistDetails', {
            artist: item,
            fromBookingFlow: true,
          })
        }
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: getUniqueProfileImage(item) }} style={styles.profileImage} />
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialization}>{spec}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#666" style={{ marginRight: 2 }} />
            <Text style={styles.locationText}>{item.profile?.location || 'India'}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB800" style={{ marginRight: 2 }} />
            <Text style={styles.ratingValue}>{rating}</Text>
            {item.glamScore ? (
              <View style={styles.glamBadgeChip}>
                <Ionicons name="sparkles" size={11} color="#FF4F87" style={{ marginRight: 2 }} />
                <Text style={styles.glamBadgeText}>{Number(item.glamScore).toFixed(1)} Glam Score</Text>
              </View>
            ) : (
              <View style={[styles.glamBadgeChip, { backgroundColor: '#E6FFFA', borderColor: '#B2F5EA' }]}>
                <Ionicons name="sparkles" size={11} color="#00B894" style={{ marginRight: 2 }} />
                <Text style={[styles.glamBadgeText, { color: '#00796B' }]}>New Artist</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.actionCircle}>
            <Ionicons name="chevron-forward" size={18} color="#FF4F87" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredArtists = artists.filter((artist) => {
    const artistName = artist.name?.toLowerCase() || '';
    const artistSpecialization = artist.specializations?.[0]?.name?.toLowerCase() || '';
    const artistBio = artist.profile?.bio?.toLowerCase() || '';
    const searchLower = searchText.toLowerCase().trim();

    return (
      !searchLower ||
      artistName.includes(searchLower) ||
      artistSpecialization.includes(searchLower) ||
      artistBio.includes(searchLower) ||
      (artist.services &&
        artist.services.some((svc) =>
          svc.specialization?.toLowerCase().includes(searchLower)
        ))
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Artists in {location}</Text>
          <Text style={styles.headerSubtitle}>Select an artist to continue booking</Text>
        </View>
      </View>

      {/* Search Bar */}
      {!loading && (artists.length > 0 || searchText) && (
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
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF4F87" />
          <Text style={styles.loadingText}>Finding nearby artists...</Text>
        </View>
      ) : artists.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="location-outline" size={40} color="#FF4F87" />
          </View>
          <Text style={styles.emptyText}>No artist at our location</Text>
          <Text style={styles.emptySubText}>
            No registered artists are available in {location} right now.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Try Another Location</Text>
          </TouchableOpacity>
        </View>
      ) : filteredArtists.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="search-outline" size={40} color="#FF4F87" />
          </View>
          <Text style={styles.emptyText}>No Matching Artists</Text>
          <Text style={styles.emptySubText}>
            We couldn't find any artists matching "{searchText}" in {location}.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setSearchText('')}
          >
            <Text style={styles.retryButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredArtists}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderArtistItem}
        />
      )}
    </SafeAreaView>
  );
};

export default ArtistsListByLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  infoArea: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  specialization: {
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '600',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  actionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#FF4F87',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
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

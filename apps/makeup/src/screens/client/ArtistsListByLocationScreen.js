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
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArtists } from '../../api/auth';

const ArtistsListByLocationScreen = ({ navigation, route }) => {
  const { location } = route.params;
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await getArtists();
        if (Array.isArray(data)) {
          // Filter artists whose location matches the chosen city (case-insensitive)
          const filtered = data.filter((artist) => {
            const artistLoc = artist.profile?.location || '';
            return artistLoc.toLowerCase().includes(location.toLowerCase());
          });
          setArtists(filtered);
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
    const rating = item.profile?.rating ? item.profile.rating.toFixed(1) : '4.5';
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
          {item.profile?.profileImage ? (
            <Image source={{ uri: item.profile.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>
                {item.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}
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
            <Text style={styles.reviewsCount}>({reviews} reviews)</Text>
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF4F87" />
          <Text style={styles.loadingText}>Finding nearby artists...</Text>
        </View>
      ) : artists.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={40} color="#FF4F87" />
          </View>
          <Text style={styles.emptyText}>No Artists Found</Text>
          <Text style={styles.emptySubText}>
            We couldn't find any registered artists in {location} right now.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Try Another Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={artists}
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
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getAiBaseUrl } from '../../api/aiClient';

const ReferenceSearchResultsScreen = ({ route, navigation }) => {
  const { recommendedArtists, selectedImage } = route.params || { recommendedArtists: [], selectedImage: null };
  const topRecommendations = recommendedArtists.slice(0, 5);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${getAiBaseUrl()}/${url.replace(/^\//, '')}`;
  };

  const renderArtistCard = ({ item }) => {
    const profileUri = getFullImageUrl(item.profile_photo);
    const matchedUri = getFullImageUrl(item.matched_image);
    const matchPercentage = Math.round(Math.min(item.similarity * 100, 100));
    const distance = (Math.random() * (15.0 - 2.0) + 2.0).toFixed(1); // Mock distance
    const basePrice = (Math.floor(Math.random() * (15 - 5) + 5) * 1000).toLocaleString('en-IN'); // Mock price

    const handleProfile = () => {
      navigation.navigate('ArtistDetails', { 
        artist: {
          id: item.artist_id,
          name: item.artist_name
        }
      });
    };

    return (
      <View style={styles.artistCard}>
        {/* Left Side: Matched Image */}
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: matchedUri }} style={styles.matchedImage} />
          <LinearGradient
            colors={['#FF4F87', '#FF85A7']}
            style={styles.similarityBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.similarityText}>{matchPercentage}% Match</Text>
          </LinearGradient>
        </View>

        {/* Right Side: Details */}
        <View style={styles.cardDetails}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.nameRow}>
              <Text style={styles.artistName} numberOfLines={1}>{item.artist_name}</Text>
              <Ionicons name="checkmark-circle" size={14} color="#FF4F87" style={{ marginLeft: 4 }} />
            </View>
            <TouchableOpacity hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="heart-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.categoryText}>{item.occasion || 'Bridal'} Makeup Artist</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB020" />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} <Text style={styles.reviewCount}>({item.completed_bookings * 3 + 12} reviews)</Text>
            </Text>
          </View>

          <Text style={styles.priceText}>₹{basePrice} <Text style={styles.priceSub}>onwards</Text></Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.locationText}>{distance} km away</Text>
          </View>

          <TouchableOpacity style={styles.viewProfileBtn} activeOpacity={0.8} onPress={handleProfile}>
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Matching Artists</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        <Text style={styles.sectionTitle}>Top matches for this look</Text>

        {topRecommendations.length > 0 ? (
          <FlatList
            data={topRecommendations}
            keyExtractor={(item) => item.artist_id.toString()}
            renderItem={renderArtistCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color="#D0C0C5" />
            <Text style={styles.emptyStateTitle}>No Matches Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try uploading a clearer look or a different style inspiration.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  artistCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#F5F5F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageContainer: {
    width: 110,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  matchedImage: {
    width: '100%',
    height: '100%',
  },
  similarityBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
  },
  similarityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  categoryText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontWeight: '500',
    color: '#888',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
  },
  priceSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  viewProfileBtn: {
    width: '100%',
    backgroundColor: '#FFF0F5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewProfileText: {
    color: '#FF4F87',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8A5D6D',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#A09095',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default ReferenceSearchResultsScreen;

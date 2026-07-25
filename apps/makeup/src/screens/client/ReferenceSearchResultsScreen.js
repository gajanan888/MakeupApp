import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import LinearGradient from 'react-native-linear-gradient';
import { getAiBaseUrl } from '../../api/aiClient';

const ReferenceSearchResultsScreen = ({ route, navigation }) => {
  const { recommendedArtists, selectedImage } = route.params || { recommendedArtists: [], selectedImage: null };

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
    const matchPercentage = Math.round(item.similarity * 100);

    const handleBook = () => {
      const look = {
        id: 'similarity_match',
        name: 'Custom Makeup Inspiration',
        category: 'Inspiration Match',
        description: `Visual match based on SigLIP image similarity (${matchPercentage}% matched).`,
      };
      const beauty_profile = {
        face_shape: 'Oval',
        skin_tone: 'Medium',
        undertone: 'Neutral',
      };
      navigation.navigate('SelectDateTime', {
        artistId: item.artist_id,
        serviceId: 2, // Default makeup service ID
        price: 2500, // Default price
        serviceName: 'Custom Visual Match Try-On & Booking',
        serviceDuration: 120,
        selectedLook: look,
        beautyProfile: beauty_profile,
      });
    };

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
        {/* Card Header: Artist Profile Summary */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.artistAvatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.placeholderAvatarText}>
                  {item.artist_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.artistDetails}>
            <Text style={styles.artistName} numberOfLines={1}>
              {item.artist_name}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#FFB020" />
              <Text style={styles.ratingText}>
                {item.rating.toFixed(1)} <Text style={styles.subText}>/ 5.0</Text>
              </Text>
            </View>
          </View>
          <View style={styles.badgeWrap}>
            <LinearGradient
              colors={['#FF4F87', '#FF85A7']}
              style={styles.similarityBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.similarityText}>{matchPercentage}% Match</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Side-by-Side Comparison Collage */}
        <View style={styles.collageContainer}>
          <View style={styles.collageHalf}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.collageImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={styles.collageLabelOverlay}
            >
              <Text style={styles.collageLabelText}>Your Upload</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.collageMiddle}>
            <View style={styles.collageArrowCircle}>
              <Ionicons name="sparkles" size={12} color="#FF4F87" />
            </View>
          </View>
          
          <View style={styles.collageHalf}>
            <Image source={{ uri: matchedUri }} style={styles.collageImage} resizeMode="contain" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={styles.collageLabelOverlay}
            >
              <Text style={styles.collageLabelText}>Matched Look</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Artist Profile Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBlock}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#FF4F87" />
            <Text style={styles.metricVal}>{item.completed_bookings}</Text>
            <Text style={styles.metricLabel}>Completed Bookings</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Ionicons name="briefcase-outline" size={16} color="#FF4F87" />
            <Text style={styles.metricVal}>{item.experience} yrs</Text>
            <Text style={styles.metricLabel}>Experience</Text>
          </View>
        </View>

        {/* Explainable AI (XAI) Reason box removed as requested */}


        {/* Card Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionBtnOutline} 
            activeOpacity={0.8}
            onPress={handleProfile}
          >
            <Text style={styles.actionBtnOutlineText}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtnSolid} 
            activeOpacity={0.88}
            onPress={handleBook}
          >
            <Text style={styles.actionBtnSolidText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <ScreenHeader title="Matches Found" onBack={() => navigation.goBack()} />

      <View style={styles.mainContainer}>
        {recommendedArtists.length > 0 ? (
          <FlatList
            data={recommendedArtists}
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#F7F5F6',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  artistCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#8A5D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FFF0F5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#FFF0F5',
  },
  artistAvatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderAvatarText: {
    color: '#FF4F87',
    fontWeight: '800',
    fontSize: 14,
  },
  artistDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
    marginLeft: 4,
  },
  subText: {
    fontSize: 9,
    color: '#888',
    fontWeight: '500',
  },
  badgeWrap: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarityBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  similarityText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  collageContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 260,
    backgroundColor: '#FAF8F9',
  },
  collageHalf: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  collageImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#FAF8F9',
  },
  collageLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  collageLabelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  collageMiddle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -16,
    marginTop: -16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  collageArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F7F5F6',
    paddingVertical: 10,
    backgroundColor: '#FCFCFC',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginTop: 3,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8A5D6D',
    fontWeight: '600',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#F5F5F7',
  },
  reasonBox: {
    backgroundColor: '#FFF8FA',
    borderWidth: 1.2,
    borderColor: '#FFE0EC',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 10,
    padding: 10,
  },
  reasonHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF4F87',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 11,
    color: '#8A5D6D',
    lineHeight: 16,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#F7F5F6',
  },
  actionBtnOutline: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4F87',
  },
  actionBtnSolid: {
    flex: 1.2,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
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

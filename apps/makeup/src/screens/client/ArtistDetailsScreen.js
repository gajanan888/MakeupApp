import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getArtistReviews, getArtists } from '../../api/auth';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';

const ArtistDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const { artist } = route.params;
  const [currentArtist, setCurrentArtist] = useState(artist);
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Instagram Post Detail States
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [modalWidth, setModalWidth] = useState(340);
  const [fullImageUri, setFullImageUri] = useState(null);

  useEffect(() => {
    const fetchFreshArtist = async () => {
      try {
        const data = await getArtists({ id: artist.id });
        if (data && data.length > 0) {
          setCurrentArtist(data[0]);
        }
      } catch (err) {
        console.warn('Failed to fetch fresh artist:', err);
      }
    };
    fetchFreshArtist();
  }, [artist.id]);

  useEffect(() => {
    if (activeTab === 'Reviews') {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true);
          const data = await getArtistReviews(artist.id);
          setReviews(data);
        } catch (err) {
          console.warn('Failed to fetch reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [activeTab, artist.id]);

  const heroImageUri =
    currentArtist.profile?.profileImage ||
    (typeof currentArtist.image === 'string' ? currentArtist.image : currentArtist.image?.uri);

  const buttonTop = 16;
  const contentPaddingBottom = 110;

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const stored = await AsyncStorage.getItem('client_favorites');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.includes(artist.id)) {
            setLiked(true);
          }
        }
      } catch (err) {
        console.warn('Failed to check favorite status:', err);
      }
    };
    checkFavorite();
  }, [artist.id]);

  const toggleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      const stored = await AsyncStorage.getItem('client_favorites');
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];
      if (newLiked) {
        if (!list.includes(artist.id)) {
          list.push(artist.id);
        }
      } else {
        list = list.filter(id => id !== artist.id);
      }
      await AsyncStorage.setItem('client_favorites', JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to update favorite status:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>

        <TouchableOpacity style={styles.headerButton} onPress={toggleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#FF4F87' : '#999'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: heroImageUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
            style={styles.avatar}
          />
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{currentArtist.name}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#1890FF" style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFC53D" style={{ marginRight: 4 }} />
              <Text style={styles.ratingText}>
                {currentArtist.profile?.rating ? currentArtist.profile.rating.toFixed(1) : currentArtist.rating || '4.8'}
                {' '}({currentArtist.profile?.reviewCount || currentArtist.profile?.bookingsCount || 8})
              </Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#8A7D77" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{currentArtist.profile?.location || 'Pune'}</Text>
            </View>
          </View>
        </View>

        {/* STATS CARD */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>
              {currentArtist.profile?.bookingsCount || currentArtist.profile?.reviewCount || 8}
            </Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>
              {currentArtist.profile?.rating ? currentArtist.profile.rating.toFixed(1) : currentArtist.rating || '4.8'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>
              {currentArtist.profile?.experience ? `${currentArtist.profile.experience}+ Yrs` : '8+ Yrs'}
            </Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Portfolio', 'About', 'Services', 'Reviews'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Content */}
        {activeTab === 'Portfolio' && (
          <View style={styles.portfolioGrid}>
            {currentArtist.portfolio && currentArtist.portfolio.length > 0 ? (
              currentArtist.portfolio.map((item, index) => {
                const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
                const isObject = typeof firstImage === 'object' && firstImage !== null;
                const imgUrl = isObject 
                  ? firstImage.url 
                  : (firstImage || item.afterImageUrl || item.beforeImageUrl || 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=200&q=80');
                const scale = isObject ? (firstImage.scale || 1) : 1;
                const translateX = isObject ? (firstImage.translateX || 0) : 0;
                const translateY = isObject ? (firstImage.translateY || 0) : 0;
                const isMultiImage = item.images && item.images.length > 1;

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.gridItemContainer} 
                    onPress={() => {
                      setSelectedPost({ ...item, index });
                      setActiveSlideIndex(0);
                      setShowPostDetailModal(true);
                    }}
                  >
                    <View style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
                      <Image 
                        source={{ uri: imgUrl }} 
                        style={[
                          styles.gridImage, 
                          {
                            transform: [
                              { scale },
                              { translateX },
                              { translateY }
                            ]
                          }
                        ]} 
                      />
                    </View>
                    {isMultiImage && (
                      <View style={styles.carouselBadge}>
                        <Ionicons name="copy" size={14} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 40, width: '100%' }}>
                <Ionicons name="images-outline" size={48} color="#FFD1E1" />
                <Text style={{ fontSize: 14, color: '#888', marginTop: 10, fontFamily: 'serif' }}>
                  No portfolio images uploaded yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'About' && (
          <>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>
                  {currentArtist.profile?.experience
                    ? `${currentArtist.profile.experience}+ Years`
                    : '8+ Years'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Starting Price</Text>
                <Text style={styles.infoValue}>
                  {currentArtist.services?.[0]?.priceRange || 'Contact for pricing'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Response Time</Text>
                <Text style={styles.infoValue}>10 mins</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="language-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Languages</Text>
                <Text style={styles.infoValue}>English, Hindi</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Text style={styles.aboutText}>
              {currentArtist.profile?.bio ||
                'Passionate makeup artist specializing in bridal looks, party makeup, HD makeup and photoshoot styling. Dedicated to making every client feel confident and beautiful.'}
            </Text>
          </>
        )}

        {activeTab === 'Services' && (
          <View style={styles.servicesContainer}>
            {currentArtist.services && currentArtist.services.length > 0
              ? currentArtist.services.map(service => (
                  <View
                    key={service.id || service.specialization}
                    style={styles.serviceChip}
                  >
                    <Text style={styles.serviceText}>
                      {service.specialization} ({service.priceRange})
                    </Text>
                  </View>
                ))
              : (currentArtist.specializations || []).map((spec, idx) => (
                  <View key={spec.id || idx} style={styles.serviceChip}>
                    <Text style={styles.serviceText}>
                      {spec.name || spec}
                    </Text>
                  </View>
                ))}
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={{ minHeight: 150 }}>
            {loadingReviews ? (
              <ActivityIndicator size="large" color="#FF4F87" style={{ marginTop: 30 }} />
            ) : reviews.length > 0 ? (
              reviews.map(review => {
                const ratingStars = '⭐'.repeat(Math.round(review.rating));
                const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) : '';

                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.reviewName}>
                        {review.customer?.name || 'Verified Client'}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#999', fontFamily: 'serif' }}>
                        {reviewDate}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 4, fontSize: 13 }}>{ratingStars}</Text>
                    {review.comment ? (
                      <Text style={styles.reviewText}>{review.comment}</Text>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#FFD1E1" />
                <Text style={{ fontSize: 14, color: '#888', marginTop: 10, fontFamily: 'serif' }}>
                  No reviews yet. Be the first to review!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* INSTAGRAM POST DETAIL MODAL */}
      <Modal
        visible={showPostDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostDetailModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          {/* Header */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 20) }]}>
            <TouchableOpacity onPress={() => setShowPostDetailModal(false)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="arrow-back-outline" size={24} color="#111" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Post Detail</Text>
            </TouchableOpacity>
          </View>
          
          {selectedPost && (
            <View style={styles.modalBody}>
              {/* Header */}
              <View style={styles.instaPostHeader}>
                <Image 
                  source={{ uri: heroImageUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }} 
                  style={styles.instaAvatar} 
                />
                <View style={styles.instaHeaderInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.instaUsername}>{currentArtist.name}</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#1890FF" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.instaLocation}>{currentArtist.profile?.location || 'Pune'}</Text>
                </View>
              </View>

              {/* Carousel */}
              {(() => {
                const postImages = selectedPost.images && selectedPost.images.length > 0
                  ? selectedPost.images
                  : [selectedPost.afterImageUrl || selectedPost.beforeImageUrl].filter(Boolean);

                return (
                  <View 
                    style={styles.instaImageContainer}
                    onLayout={(e) => setModalWidth(e.nativeEvent.layout.width)}
                  >
                    <ScrollView 
                      horizontal 
                      pagingEnabled 
                      showsHorizontalScrollIndicator={false}
                      onScroll={(event) => {
                        const slideSize = event.nativeEvent.layoutMeasurement.width;
                        const offset = event.nativeEvent.contentOffset.x;
                        if (slideSize > 0) {
                          const index = Math.round(offset / slideSize);
                          setActiveSlideIndex(index);
                        }
                      }}
                      scrollEventThrottle={16}
                      style={{ width: '100%', height: 350 }}
                    >
                      {postImages.map((imgItem, idx) => {
                        const isObject = typeof imgItem === 'object' && imgItem !== null;
                        const imgUrl = isObject ? imgItem.url : imgItem;
                        const scale = isObject ? (imgItem.scale || 1) : 1;
                        const translateX = isObject ? (imgItem.translateX || 0) : 0;
                        const translateY = isObject ? (imgItem.translateY || 0) : 0;

                        return (
                          <TouchableOpacity 
                            key={idx} 
                            activeOpacity={0.9} 
                            onPress={() => setFullImageUri(imgUrl)}
                            style={{ width: modalWidth, height: 350, overflow: 'hidden' }}
                          >
                            <Image 
                              source={{ uri: imgUrl }} 
                              style={[
                                styles.instaPostImage,
                                {
                                  transform: [
                                    { scale },
                                    { translateX },
                                    { translateY }
                                  ]
                                }
                              ]}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    
                    {postImages.length > 1 && (
                      <View style={styles.instaCarouselBadge}>
                        <Text style={styles.instaCarouselBadgeText}>
                          {activeSlideIndex + 1}/{postImages.length}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Dots Indicator */}
              {(() => {
                const postImages = selectedPost.images && selectedPost.images.length > 0
                  ? selectedPost.images
                  : [selectedPost.afterImageUrl || selectedPost.beforeImageUrl].filter(Boolean);

                if (postImages.length <= 1) return null;

                return (
                  <View style={styles.carouselDotsContainer}>
                    {postImages.map((_, idx) => (
                      <View 
                        key={idx} 
                        style={[
                          styles.carouselDot, 
                          activeSlideIndex === idx && styles.carouselDotActive
                        ]} 
                      />
                    ))}
                  </View>
                );
              })()}

              {/* Caption */}
              <View style={[styles.instaCaptionContainer, { marginTop: 16 }]}>
                <Text style={styles.instaCaptionText}>
                  <Text style={styles.instaCaptionUsername}>{currentArtist.name} </Text>
                  {selectedPost.description || 'No description provided.'}
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* FULL SCREEN IMAGE VIEWER */}
      <Modal
        visible={fullImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageUri(null)}
      >
        <View style={styles.fullImageModalContainer}>
          <TouchableOpacity 
            style={styles.fullImageCloseBtn} 
            onPress={() => setFullImageUri(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: fullImageUri }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* BOOKING BOTTOM FLOATING CARD */}
      <View style={[styles.bottomContainer, { paddingBottom: (insets.bottom || 0) + 16 }]}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => {
            if (route.params?.fromBookingFlow) {
              navigation.navigate('BookAppointment', {
                artist: currentArtist,
                selectedDate: route.params?.selectedDate,
                selectedTime: route.params?.selectedTime,
                selectedCategory: route.params?.selectedCategory,
              });
            } else {
              navigation.navigate('EnterBookingAddress', { artist: currentArtist });
            }
          }}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ArtistDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  heroImage: {
    width: '100%',
    height: 300,
  },

  heroImagePlaceholder: {
    backgroundColor: '#FFE6EF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,

    width: 42,
    height: 42,

    borderRadius: 21,
    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,

    width: 42,
    height: 42,

    borderRadius: 21,
    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    backgroundColor: '#FFFFFF',

    marginTop: -30,

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },

  artistName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },

  detailRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },

  detailRankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B78103',
  },

  speciality: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },

  separator: {
    marginHorizontal: 8,
    color: '#999',
  },

  locationText: {
    color: '#777',
    fontSize: 14,
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  tabButton: {
    alignItems: 'center',
  },

  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },

  activeTabText: {
    color: '#FF4F87',
    fontWeight: '700',
  },

  activeLine: {
    width: 24,
    height: 3,

    borderRadius: 2,

    backgroundColor: '#FF4F87',

    marginTop: 6,
  },

  infoSection: {
    backgroundColor: '#FAFAFA',

    borderRadius: 20,

    padding: 18,

    marginBottom: 24,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 16,
  },

  infoLabel: {
    flex: 1,

    marginLeft: 12,

    fontSize: 14,
    color: '#666',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },

  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },

  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  serviceChip: {
    backgroundColor: '#FFF1F6',

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 20,

    marginRight: 10,
    marginBottom: 10,
  },

  serviceText: {
    color: '#FF4F87',
    fontWeight: '600',
    fontSize: 14,
  },

  reviewCard: {
    backgroundColor: '#FAFAFA',

    borderRadius: 18,

    padding: 16,

    marginBottom: 14,
  },

  reviewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },

  reviewText: {
    color: '#666',
    lineHeight: 22,
    marginTop: 8,
  },

  portfolioImage: {
    width: 240,
    height: 320,
    borderRadius: 20,
    marginRight: 16,
  },

  imageModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageCounter: {
    position: 'absolute',
    top: 16,
    left: 20,

    color: '#FFF',

    fontSize: 16,
    fontWeight: '700',

    zIndex: 100,
  },

  fullScreenImage: {
    width: '100%',
    height: '100%',
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 25,
    zIndex: 10,
  },

  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 20,
    paddingTop: 16,
    // paddingBottom is set dynamically in JSX using insets.bottom

    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },

  bookButton: {
    height: 58,

    backgroundColor: '#FF4F87',

    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },

  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── CUSTOM INSTAGRAM STYLING FOR CLIENT DETAIL VIEW ──────────────────────────
  header: {
    height: 56,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // leave space for book button
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4ED',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#8A7D77',
    fontFamily: 'serif',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  statLabel: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F3ECF0',
    alignSelf: 'center',
  },

  // Portfolio 3-column Grid
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  gridItemContainer: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
    zIndex: 2,
  },

  // Modal Detail Styles
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  instaPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  instaAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  instaHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  instaUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  instaLocation: {
    fontSize: 11,
    color: '#8A7D77',
    marginTop: 1,
  },
  instaImageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    backgroundColor: '#FFF9FB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  instaPostImage: {
    width: '100%',
    height: '100%',
  },
  instaCarouselBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  instaCarouselBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0D8DB',
    marginHorizontal: 3,
  },
  carouselDotActive: {
    backgroundColor: '#FF4F8F',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instaCaptionContainer: {
    paddingHorizontal: 16,
  },
  instaCaptionText: {
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    lineHeight: 18,
  },
  instaCaptionUsername: {
    fontWeight: '700',
  },

  // Zoom overlay styles
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});

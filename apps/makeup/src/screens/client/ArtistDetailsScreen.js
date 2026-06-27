import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

const ArtistDetailsScreen = ({ route, navigation }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const { artist } = route.params;
  const [activeTab, setActiveTab] = useState('About');
  const heroImageUri =
    artist.profile?.profileImage ||
    (typeof artist.image === 'string' ? artist.image : artist.image?.uri);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}

        <View>
          {heroImageUri ? (
            <Image source={{ uri: heroImageUri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="person" size={80} color="#FF4F87" />
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => setLiked(!liked)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={24}
              color={liked ? '#FF4F87' : '#999'}
            />
          </TouchableOpacity>
        </View>

        {/* Content Card */}

        <View style={styles.contentContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Text style={styles.artistName}>{artist.name}</Text>
            {artist.trendingRank && (
              <View style={styles.detailRankBadge}>
                <Ionicons name="trophy" size={12} color="#B78103" />
                <Text style={styles.detailRankBadgeText}>Rank #{artist.trendingRank} Trending in India</Text>
              </View>
            )}
          </View>

          <Text style={styles.speciality}>
            {artist.speciality ||
              artist.specializations?.[0]?.name ||
              'Makeup Artist'}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F5B301" />

            <Text style={styles.ratingText}>
              {artist.profile?.rating
                ? artist.profile.rating.toFixed(1)
                : artist.rating || '4.8'}
            </Text>

            <Text style={styles.separator}>•</Text>

            <Text style={styles.locationText}>
              {artist.profile?.location || 'India'}
            </Text>
          </View>

          {/* Tabs */}

          <View style={styles.tabsContainer}>
            {['About', 'Services', 'Reviews', 'Portfolio'].map(tab => (
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

          {activeTab === 'About' && (
            <>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Experience</Text>

                  <Text style={styles.infoValue}>
                    {artist.profile?.experience
                      ? `${artist.profile.experience}+ Years`
                      : '8+ Years'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Price Range</Text>

                  <Text style={styles.infoValue}>
                    {artist.services?.[0]?.priceRange || 'Contact for pricing'}
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
                {artist.profile?.bio ||
                  'Passionate makeup artist specializing in bridal looks, party makeup, HD makeup and photoshoot styling. Dedicated to making every client feel confident and beautiful.'}
              </Text>
            </>
          )}

          {activeTab === 'Services' && (
            <View style={styles.servicesContainer}>
              {artist.services && artist.services.length > 0
                ? artist.services.map(service => (
                    <View
                      key={service.id || service.specialization}
                      style={styles.serviceChip}
                    >
                      <Text style={styles.serviceText}>
                        {service.specialization} ({service.priceRange})
                      </Text>
                    </View>
                  ))
                : (artist.specializations || []).map((spec, idx) => (
                    <View key={spec.id || idx} style={styles.serviceChip}>
                      <Text style={styles.serviceText}>
                        {spec.name || spec}
                      </Text>
                    </View>
                  ))}
            </View>
          )}

          {activeTab === 'Reviews' && (
            <>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewName}>Priya Sharma</Text>

                <Text>⭐⭐⭐⭐⭐</Text>

                <Text style={styles.reviewText}>
                  Amazing bridal makeup and very professional.
                </Text>
              </View>

              <View style={styles.reviewCard}>
                <Text style={styles.reviewName}>Sneha Patil</Text>

                <Text>⭐⭐⭐⭐⭐</Text>

                <Text style={styles.reviewText}>
                  Excellent service and beautiful finishing.
                </Text>
              </View>
            </>
          )}

          {activeTab === 'Portfolio' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {artist.portfolio && artist.portfolio.length > 0 ? (
                artist.portfolio.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedImage(image);
                      setSelectedIndex(index);
                      setShowImageModal(true);
                    }}
                  >
                    <Image source={image} style={styles.portfolioImage} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#999', paddingVertical: 20 }}>
                  No portfolio images uploaded yet.
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <Modal visible={showImageModal} transparent={false} animationType="fade">
        <View style={styles.imageModalContainer}>
          <Text style={styles.imageCounter}>
            {selectedIndex + 1} / {artist.portfolio?.length || 0}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>

          <Image
            source={selectedImage}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookAppointment', {
            artist,
            selectedDate: route.params?.selectedDate,
            selectedTime: route.params?.selectedTime,
            selectedCategory: route.params?.selectedCategory,
          })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    top: 60,
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
    top: 60,
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
    paddingVertical: 16,

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
});

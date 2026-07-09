import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { recommendArtistsByImage } from '../../api/aiClient';
import ScreenHeader from '../../components/ScreenHeader';

const { width } = Dimensions.get('window');

const SERVICE_TYPES = ['All', 'Bridal', 'Glam', 'Party', 'HD Makeup', 'Airbrush', 'Minimal'];

const ReferenceImageSearchScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Recommendations from server
  const [rawRecommendations, setRawRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedService, setSelectedService] = useState('All');

  // Trigger local filtering when raw recommendations or filter states change
  useEffect(() => {
    let result = [...rawRecommendations];

    // Filter by budget
    if (budget.trim()) {
      const maxBudget = parseInt(budget, 10);
      if (!isNaN(maxBudget)) {
        result = result.filter(item => item.price <= maxBudget);
      }
    }

    // Filter by location
    if (location.trim()) {
      const locQuery = location.toLowerCase();
      result = result.filter(item => 
        item.location && item.location.toLowerCase().includes(locQuery)
      );
    }

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(item => item.rating >= minRating);
    }

    // Filter by service type
    if (selectedService !== 'All') {
      const serviceQuery = selectedService.toLowerCase();
      result = result.filter(item => 
        (item.specialty && item.specialty.toLowerCase().includes(serviceQuery)) ||
        (item.bio && item.bio.toLowerCase().includes(serviceQuery))
      );
    }

    setFilteredRecommendations(result);
  }, [rawRecommendations, budget, location, minRating, selectedService]);

  const handleSelectImage = (source) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    const callback = async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selected = response.assets[0];
        setImage(selected);
        await runRecommendation(selected);
      }
    };

    if (source === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const runRecommendation = async (targetImage) => {
    setLoading(true);
    setUploadProgress(0);
    setStatusMessage('Uploading reference image...');
    setRawRecommendations([]);

    try {
      // Setup progress animation states
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 150);

      const results = await recommendArtistsByImage(
        targetImage,
        {}, // We pass empty filters initially and filter locally for instant UI response
        (progress) => {
          if (progress === 100) {
            clearInterval(progressInterval);
            setUploadProgress(100);
            setStatusMessage('Analyzing makeup style & matching artists...');
          } else {
            setUploadProgress(progress);
          }
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setStatusMessage('Analysis complete!');
      
      setTimeout(() => {
        setRawRecommendations(results);
        setLoading(false);
      }, 500);

    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert(
        'Recommendation Failed',
        error.response?.data?.detail || 'Could not match artists. Please try another image.'
      );
    }
  };

  const handleReset = () => {
    setImage(null);
    setRawRecommendations([]);
    setFilteredRecommendations([]);
    setBudget('');
    setLocation('');
    setMinRating(0);
    setSelectedService('All');
    setShowFilters(false);
  };

  const renderArtistCard = ({ item }) => {
    const bestMatchImg = item.best_matching_image;
    
    return (
      <View style={styles.artistCard}>
        <View style={styles.artistHeader}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#A0A0A0" />
            </View>
          )}
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>{item.name}</Text>
            <Text style={styles.artistSpecialty}>{item.specialty}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({item.review_count} reviews)</Text>
            </View>
            {item.location ? (
              <Text style={styles.locationText}>
                <Ionicons name="location-outline" size={12} color="#777" /> {item.location}
              </Text>
            ) : null}
          </View>
          
          {/* Visual Similarity Badge */}
          <View style={styles.similarityContainer}>
            <View style={styles.similarityRing}>
              <Text style={styles.similarityValue}>{item.visual_similarity}%</Text>
              <Text style={styles.similarityLabel}>Match</Text>
            </View>
          </View>
        </View>

        {bestMatchImg ? (
          <View style={styles.portfolioMatchContainer}>
            <Text style={styles.portfolioMatchTitle}>Best Portfolio Match:</Text>
            <View style={styles.portfolioMatchRow}>
              <Image source={{ uri: bestMatchImg.image_url }} style={styles.portfolioMatchImage} />
              <View style={styles.portfolioMatchDetails}>
                <Text style={styles.portfolioMatchTag}>Tag: {bestMatchImg.image_type.toUpperCase()}</Text>
                <Text style={styles.portfolioMatchDesc} numberOfLines={2}>
                  This portfolio image has a {bestMatchImg.similarity.toFixed(1)}% visual similarity to your reference photo.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>From ₹{item.price.toLocaleString('en-IN')}</Text>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => navigation.navigate('ArtistDetails', { id: item.artist_id })}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScreenHeader title="AI Artist Finder" onBack={() => navigation.goBack()} />

      {!image ? (
        <ScrollView contentContainerStyle={styles.uploadContainer}>
          <View style={styles.introCard}>
            <Ionicons name="sparkles" size={32} color="#FF4F87" style={styles.introIcon} />
            <Text style={styles.introTitle}>Find Artists by Reference Photo</Text>
            <Text style={styles.introDesc}>
              Upload a makeup look from Pinterest, Instagram, or Google, and our AI will match you with artists who have done similar work.
            </Text>
          </View>

          <View style={styles.dropzone}>
            <Ionicons name="cloud-upload-outline" size={64} color="#FF4F87" />
            <Text style={styles.dropzoneTitle}>Select a Reference Image</Text>
            <Text style={styles.dropzoneSubtitle}>JPEG or PNG up to 8MB</Text>

            <View style={styles.uploadButtonsRow}>
              <TouchableOpacity
                style={[styles.uploadButton, styles.cameraButton]}
                onPress={() => handleSelectImage('camera')}
              >
                <Ionicons name="camera" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.galleryButton]}
                onPress={() => handleSelectImage('gallery')}
              >
                <Ionicons name="images" size={20} color="#FF4F87" style={{ marginRight: 8 }} />
                <Text style={[styles.uploadButtonText, { color: '#FF4F87' }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips for Best Results</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.tipText}>Use high-resolution images with good lighting.</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.tipText}>Ensure the face is front-facing and clearly visible.</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <Text style={styles.tipText}>Avoid photos with heavy filters, hands, or jewelry blocking the face.</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Reference Image Thumbnail Bar */}
          <View style={styles.previewBar}>
            <Image source={{ uri: image.uri }} style={styles.previewThumbnail} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Reference Image Selected</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.changePhotoText}>Upload Different Photo</Text>
              </TouchableOpacity>
            </View>
            
            {/* Filter Toggle Button */}
            {!loading && (
              <TouchableOpacity 
                style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons name="funnel" size={18} color={showFilters ? '#FFF' : '#FF4F87'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dynamic Filters Section */}
          {showFilters && !loading && (
            <View style={styles.filtersSection}>
              <View style={styles.filterRow}>
                <View style={styles.filterInputContainer}>
                  <Text style={styles.filterLabel}>Max Budget (₹)</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="e.g. 5000"
                    keyboardType="numeric"
                    value={budget}
                    onChangeText={setBudget}
                  />
                </View>
                <View style={styles.filterInputContainer}>
                  <Text style={styles.filterLabel}>Location</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="e.g. Mumbai"
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterInputContainer}>
                  <Text style={styles.filterLabel}>Min Rating</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity key={star} onPress={() => setMinRating(star === minRating ? 0 : star)}>
                        <Ionicons 
                          name={star <= minRating ? 'star' : 'star-outline'} 
                          size={24} 
                          color="#FFD700" 
                          style={{ marginRight: 4 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.filterLabel}>Service / Specialization</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {SERVICE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, selectedService === type && styles.chipActive]}
                    onPress={() => setSelectedService(type)}
                  >
                    <Text style={[styles.chipText, selectedService === type && styles.chipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FF4F87" />
              <Text style={styles.loaderText}>{statusMessage}</Text>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{uploadProgress}%</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecommendations}
              keyExtractor={(item) => item.artist_id.toString()}
              renderItem={renderArtistCard}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#A0A0A0" />
                  <Text style={styles.emptyTitle}>No matching artists found</Text>
                  <Text style={styles.emptyDesc}>
                    Try adjusting your filters or uploading a different reference photo.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F9',
  },
  uploadContainer: {
    padding: 20,
    alignItems: 'center',
  },
  introCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  introIcon: {
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  dropzone: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD1DF',
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  dropzoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginTop: 16,
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginBottom: 24,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    flex: 0.47,
  },
  cameraButton: {
    backgroundColor: '#FF4F87',
  },
  galleryButton: {
    backgroundColor: '#FFF0F4',
    borderWidth: 1,
    borderColor: '#FFD1DF',
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBEF',
  },
  previewThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  changePhotoText: {
    fontSize: 12,
    color: '#FF4F87',
    fontWeight: '500',
    marginTop: 2,
  },
  filterToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleActive: {
    backgroundColor: '#FF4F87',
  },
  filtersSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBEF',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterInputContainer: {
    flex: 0.48,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  filterInput: {
    backgroundColor: '#F7F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#222',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  chipsScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3EFF2',
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#FF4F87',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loaderText: {
    fontSize: 15,
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF4F87',
  },
  progressPercent: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  artistCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  artistSpecialty: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  similarityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarityRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F4',
  },
  similarityValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F87',
  },
  similarityLabel: {
    fontSize: 8,
    color: '#FF4F87',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  portfolioMatchContainer: {
    backgroundColor: '#FAF6F8',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  portfolioMatchTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  portfolioMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioMatchImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  portfolioMatchDetails: {
    flex: 1,
    marginLeft: 12,
  },
  portfolioMatchTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4F87',
    backgroundColor: '#FFF0F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  portfolioMatchDesc: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBEF',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F87',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  viewProfileText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
});

export default ReferenceImageSearchScreen;

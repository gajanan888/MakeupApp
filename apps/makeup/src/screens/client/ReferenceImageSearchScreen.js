import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  FlatList,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ScreenHeader from '../../components/ScreenHeader';
import { recommendArtistsByImage, getAiBaseUrl } from '../../api/aiClient';

const ReferenceImageSearchScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${getAiBaseUrl()}/${url.replace(/^\//, '')}`;
  };

  const handleCameraCapture = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission Needed',
            message: 'This app needs access to your camera to take inspiration photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to capture photo from camera.');
      } else if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('Image Library Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick image from library.');
      } else if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleSearch = async () => {
    if (!selectedImage) {
      Alert.alert('Selection Required', 'Please capture or upload an inspiration photo first.');
      return;
    }

    try {
      setLoading(true);
      const response = await recommendArtistsByImage(selectedImage);
      if (response && response.success) {
        navigation.navigate('ReferenceSearchResults', {
          recommendedArtists: response.recommended_artists || [],
          selectedImage: selectedImage
        });
      } else {
        Alert.alert('Search Failed', 'Could not retrieve artist recommendations.');
      }
    } catch (error) {
      console.error('[SearchScreen] Error recommending artists:', error);
      Alert.alert('Server Error', error.message || 'An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <ScreenHeader title="AI Artist Recommendation" onBack={() => navigation.goBack()} />

      <View style={styles.mainContainer}>
        {/* Inspiration Upload Area */}
        <View style={styles.uploadCard}>
          <Text style={styles.uploadTitle}>📸 Upload Inspiration Look</Text>
          <Text style={styles.uploadSubtitle}>
            Find artists whose portfolio makeup matches this inspiration
          </Text>

          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity
                style={styles.removeImageBtn}
                activeOpacity={0.7}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4F87" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadBtn}
                activeOpacity={0.85}
                onPress={handleCameraCapture}
              >
                <Ionicons name="camera-outline" size={32} color="#FF4F87" />
                <Text style={styles.uploadBtnText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.optionDivider} />
              <TouchableOpacity
                style={styles.uploadBtn}
                activeOpacity={0.85}
                onPress={handlePickImage}
              >
                <Ionicons name="images-outline" size={32} color="#FF4F87" />
                <Text style={styles.uploadBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.searchBtn, !selectedImage && styles.searchBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleSearch}
            disabled={!selectedImage || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.searchBtnText}>Search Similar Looks</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loaderText}>AI is calculating visual similarities...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ReferenceImageSearchScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  uploadCard: {
    backgroundColor: '#FFF8FA',
    borderWidth: 1.5,
    borderColor: '#FFE4EF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF4F87',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF4F87',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#8A5D6D',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '600',
  },
  uploadOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 120,
    borderWidth: 2,
    borderColor: '#FFE8F2',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A5D6D',
    marginTop: 6,
  },
  optionDivider: {
    width: 2,
    height: 60,
    backgroundColor: '#FFE8F2',
  },
  previewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFE4EF',
    backgroundColor: '#FAF8F9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  searchBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: '#FFB8CF',
  },
  searchBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  resultsHeader: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A5D6D',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 12,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  artistCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFE0EC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5F0',
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  artistAvatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF4F87',
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5F0',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8A5D6D',
    fontWeight: '700',
    marginTop: 1,
  },
  metricDivider: {
    width: 1.5,
    height: 30,
    backgroundColor: '#FFE5F0',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  actionBtnOutline: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  actionBtnOutlineText: {
    color: '#FF4F87',
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnSolid: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FF4F87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolidText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 12,
    color: '#8A5D6D',
    fontWeight: '700',
    marginTop: 10,
  },
});

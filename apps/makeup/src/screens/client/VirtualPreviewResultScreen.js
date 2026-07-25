import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Share,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { getPreview, getAiBaseUrl } from '../../api/aiClient';

const VirtualPreviewResultScreen = ({ navigation, route }) => {
  const { preview_id, selfie_id, chat_session_id, image } = route?.params || {};
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('after'); // 'before' or 'after'
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    if (preview && preview.prompt) {
      try {
        setCopied(true);
        await Share.share({
          message: preview.prompt,
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('[Share] Error sharing/copying prompt:', err);
        setCopied(false);
      }
    }
  };

  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const data = await getPreview(preview_id);
        if (active) {
          setPreview(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[PreviewResult] Error fetching preview:', err);
        if (active) {
          setLoading(false);
        }
      }
    };

    if (preview_id) {
      fetchPreview();
    }
    return () => {
      active = false;
    };
  }, [preview_id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F87" />
          <Text style={styles.loadingText}>Retrieving your preview...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4F87" />
          <Text style={styles.errorText}>Preview could not be loaded.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.navigate('FaceScan')}
          >
            <Text style={styles.retryBtnText}>Go back to Upload</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle local path versus absolute URL
  const getImageUrl = (urlPath) => {
    if (!urlPath) return null;
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    // Append AI base URL for local files
    return `${getAiBaseUrl()}/${urlPath.replace(/^\//, '')}`;
  };

  const originalUri = image?.uri || getImageUrl(preview.selfie_image_url);
  const editedUri = getImageUrl(preview.edited_image_url);

  const displayImage = viewMode === 'before' ? { uri: originalUri } : { uri: editedUri };

  const prefs = preview.preferences || {};

  const handleBookArtist = () => {
    const look = {
      id: 'virtual_preview',
      name: `${prefs.style || 'Custom'} Try-On`,
      category: prefs.style || 'Custom',
      description: preview.prompt || 'AI generated Virtual Try-On look.',
    };
    const beauty_profile = {
      face_shape: 'Oval',
      skin_tone: 'Medium',
      undertone: 'Neutral',
    };
    navigation.navigate('BookLookArtist', { look, beauty_profile });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <ScreenHeader
        title="Virtual Try-On Result"
        onBack={() => navigation.navigate('FaceScan')}
      />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Image Display Card */}
          <View style={styles.imageCard}>
            <Image source={displayImage} style={styles.previewImage} resizeMode="cover" />
            
            {/* View Mode Toggle Overlay */}
            <View style={styles.toggleOverlay}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'before' && styles.toggleBtnActive]}
                onPress={() => setViewMode('before')}
              >
                <Text style={[styles.toggleBtnText, viewMode === 'before' && styles.toggleBtnTextActive]}>
                  Before 📸
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'after' && styles.toggleBtnActive]}
                onPress={() => setViewMode('after')}
              >
                <Text style={[styles.toggleBtnText, viewMode === 'after' && styles.toggleBtnTextActive]}>
                  After ✨
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Prescription Details */}
          <View style={styles.prescriptionCard}>
            <Text style={styles.prescriptionTitle}>💄 Your AI Beauty Prescription</Text>
            <View style={styles.divider} />

            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Occasion</Text>
              <Text style={styles.recValue}>{prefs.event || 'Party'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Location</Text>
              <Text style={styles.recValue}>{prefs.location || 'Indoor'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Time</Text>
              <Text style={styles.recValue}>{prefs.time || 'Evening'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Outfit</Text>
              <Text style={styles.recValue}>{prefs.outfit || 'Western'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Outfit Color</Text>
              <Text style={styles.recValue}>{prefs.outfit_color || 'Black'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Style</Text>
              <Text style={styles.recValue}>{prefs.style || 'Soft Glam'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Boldness</Text>
              <Text style={styles.recValue}>{prefs.boldness || '3 = Medium'}</Text>
            </View>
            <View style={styles.recRow}>
              <Text style={styles.recLabel}>Accessories</Text>
              <Text style={styles.recValue}>{prefs.accessories || 'None'}</Text>
            </View>
          </View>

          {/* AI Prompt Details */}
          {preview.prompt ? (
            <View style={styles.prescriptionCard}>
              <View style={styles.promptHeader}>
                <Text style={styles.prescriptionTitle}>📝 AI Generation Prompt</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copied && styles.copyBtnActive]}
                  onPress={handleCopyPrompt}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={copied ? "checkmark-done-outline" : "share-social-outline"} 
                    size={13} 
                    color={copied ? "#FFF" : "#FF4F87"} 
                  />
                  <Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
                    {copied ? "Copied" : "Copy / Share"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              <TextInput
                value={preview.prompt}
                editable={true}
                selectTextOnFocus={true}
                showSoftInputOnFocus={false}
                multiline={true}
                style={styles.promptInputText}
              />
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={handleBookArtist}
            >
              <Text style={styles.primaryBtnText}>Book Artist to Recreate Look</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('FaceScan')}
            >
              <Text style={styles.secondaryBtnText}>Try Another Style</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
};

export default VirtualPreviewResultScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
    marginVertical: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF4F87',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  imageCard: {
    width: '100%',
    height: 380,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE0EC',
    overflow: 'hidden',
    backgroundColor: '#FFF8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  toggleOverlay: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: '#FF4F87',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5D6D',
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  prescriptionCard: {
    width: '100%',
    backgroundColor: '#FFF8FA',
    borderWidth: 1.5,
    borderColor: '#FFE4EF',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },
  prescriptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF4F87',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE4EF',
    marginVertical: 12,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  recLabel: {
    fontSize: 13,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  recValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '800',
  },
  actionsContainer: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FF4F87',
    fontSize: 13,
    fontWeight: '800',
  },
  promptInputText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '600',
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0EC',
    gap: 3,
  },
  copyBtnActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F87',
  },
  copyBtnTextActive: {
    color: '#FFF',
  },
});

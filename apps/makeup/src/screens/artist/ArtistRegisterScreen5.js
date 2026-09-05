// PortfolioUploadScreen.js

// INSTALL THESE:
//
// npm install react-native-image-picker
// npm install react-native-vector-icons

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  Image,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadFile } from '../../api/files';

import Ionicons from '@react-native-vector-icons/ionicons';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return cameraGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  }
  return true;
};

const ArtistRegisterScreen5 = ({ navigation, route }) => {
  const { data, setPortfolio } = useArtistRegistration();
  
  const getInitialWorks = () => {
    if (data.portfolio && data.portfolio.length > 0) {
      return data.portfolio.map(item => ({
        id: item.id || Date.now() + Math.random(),
        beforeImage: item.beforeImageUrl || item.beforeImage || null,
        afterImage: item.afterImageUrl || item.afterImage || null,
        images: Array.isArray(item.images)
          ? item.images
          : (item.afterImageUrl || item.afterImage ? [item.afterImageUrl || item.afterImage] : []),
        tag: item.tag || '',
        description: item.description || '',
      }));
    }
    return [
      {
        id: Date.now(),
        beforeImage: null,
        afterImage: null,
        images: [],
        tag: '',
        description: '',
      },
    ];
  };

  const [works, setWorks] = useState(getInitialWorks());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagePick = (type, index) => {
    if (type === 'work') {
      const currentWork = works[index];
      if (currentWork && currentWork.images && currentWork.images.length >= 10) {
        Alert.alert('Limit Reached', 'You can upload up to 10 after photos only.');
        return;
      }
    }
    Alert.alert(
      'Select Image Source',
      'Choose an option to upload your photo',
      [
        {
          text: 'Camera',
          onPress: () => handleCameraLaunch(type, index),
        },
        {
          text: 'Gallery',
          onPress: () => handleGalleryLaunch(type, index),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleCameraLaunch = async (type, index) => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission is needed');
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      await processSelectedImage(type, index, result.assets[0]);
    }
  };

  const handleGalleryLaunch = async (type, index) => {
    const currentCount = (works[index]?.images || []).length;
    const limit = type === 'before' ? 1 : 10 - currentCount;

    if (limit <= 0) {
      Alert.alert('Limit Reached', 'You can upload up to 10 after photos only.');
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: limit,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      if (type === 'before') {
        await processSelectedImage('before', index, result.assets[0]);
      } else {
        await processMultipleSelectedImages(index, result.assets);
      }
    }
  };

  const processSelectedImage = async (type, index, asset) => {
    const rawName = asset.fileName || `photo_${Date.now()}.jpg`;
    const cleanName = rawName.replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const file = {
      uri: asset.uri,
      name: cleanName || 'photo.jpg',
      type: (asset.type || 'image/jpeg').replace(/[^\x00-\x7F]/g, ''),
    };

    try {
      if (type === 'before') {
        setWorks(prev =>
          prev.map((item, idx) =>
            idx === index ? { ...item, beforeImage: asset.uri } : item,
          ),
        );
      } else {
        setWorks(prev =>
          prev.map((item, idx) => {
            if (idx === index) {
              const currentImages = item.images || [];
              return {
                ...item,
                images: [...currentImages, asset.uri],
                afterImage: item.afterImage || asset.uri,
              };
            }
            return item;
          }),
        );
      }

      const url = await uploadFile(file);
      if (url) {
        if (type === 'before') {
          setWorks(prev =>
            prev.map((item, idx) =>
              idx === index ? { ...item, beforeImage: url } : item,
            ),
          );
        } else {
          setWorks(prev =>
            prev.map((item, idx) => {
              if (idx === index) {
                const updatedImages = (item.images || []).map(img =>
                  img === asset.uri ? url : img,
                );
                return {
                  ...item,
                  images: updatedImages,
                  afterImage: item.afterImage === asset.uri ? url : item.afterImage,
                };
              }
              return item;
            }),
          );
        }
      }
    } catch (err) {
      console.warn('Upload failed', err);
      Alert.alert('Upload failed', err.message || 'Unable to upload image');
    }
  };

  const processMultipleSelectedImages = async (index, assets) => {
    const localUris = assets.map(asset => asset.uri);

    // 1. Add all assets' local URIs instantly to the UI
    setWorks(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const currentImages = item.images || [];
          const combined = [...currentImages, ...localUris].slice(0, 10);
          return {
            ...item,
            images: combined,
            afterImage: item.afterImage || combined[0] || null,
          };
        }
        return item;
      }),
    );

    // 2. Upload each asset sequentially
    for (const asset of assets) {
      const rawName = asset.fileName || `photo_${Date.now()}.jpg`;
      const cleanName = rawName.replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const file = {
        uri: asset.uri,
        name: cleanName || 'photo.jpg',
        type: (asset.type || 'image/jpeg').replace(/[^\x00-\x7F]/g, ''),
      };

      try {
        const url = await uploadFile(file);
        if (url) {
          setWorks(prev =>
            prev.map((item, idx) => {
              if (idx === index) {
                const updatedImages = (item.images || []).map(img =>
                  img === asset.uri ? url : img,
                );
                return {
                  ...item,
                  images: updatedImages,
                  afterImage: item.afterImage === asset.uri ? url : item.afterImage,
                };
              }
              return item;
            }),
          );
        }
      } catch (err) {
        console.warn('Upload failed for one of the images', err);
        Alert.alert('Upload failed', `Unable to upload ${file.name}`);
      }
    }
  };

  const handleRemoveWorkImage = (index, imgIdx) => {
    setWorks(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          const filtered = (item.images || []).filter((_, i) => i !== imgIdx);
          return {
            ...item,
            images: filtered,
            afterImage: filtered[0] || null,
          };
        }
        return item;
      }),
    );
  };

  const addWork = () => {
    setWorks(prev => [
      ...prev,
      {
        id: Date.now() + prev.length,
        beforeImage: null,
        afterImage: null,
        images: [],
        tag: '',
        description: '',
      },
    ]);
  };

  const updateWorkField = (index, field, value) => {
    setWorks(prev =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeWork = (index) => {
    setWorks(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        >
          {/* HEADER */}
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              Let’s <Text style={styles.pinkText}>Flaunt</Text>
              {'\n'}
              Your Work{'\n'}
              with <Text style={styles.pinkText}>World</Text>
            </Text>
          </View>

          {/* SPECIALIZATION COVERAGE STATUS BANNER */}
          {(data.specializations || []).length > 0 && (
            <View style={styles.specCoverageBanner}>
              <View style={styles.specCoverageHeader}>
                <Ionicons name="sparkles" size={18} color="#FF4F8F" />
                <Text style={styles.specCoverageTitle}>
                  Upload Past Work for Selected Specializations
                </Text>
              </View>
              <Text style={styles.specCoverageSub}>
                Upload at least 1 photo post for each specialization you selected:
              </Text>
              <View style={styles.specChipsContainer}>
                {(data.specializations || []).map((spec, sIdx) => {
                  const isCovered = works.some(
                    w =>
                      w.images &&
                      w.images.length > 0 &&
                      (w.description?.toLowerCase().trim() === spec.toLowerCase().trim() ||
                        w.tag?.toLowerCase().trim() === spec.toLowerCase().trim() ||
                        w.description?.toLowerCase().includes(spec.toLowerCase()))
                  );

                  return (
                    <View
                      key={sIdx}
                      style={[
                        styles.specChipStatus,
                        isCovered ? styles.specChipCovered : styles.specChipMissing,
                      ]}
                    >
                      <Ionicons
                        name={isCovered ? 'checkmark-circle' : 'alert-circle-outline'}
                        size={15}
                        color={isCovered ? '#2E7D32' : '#D32F2F'}
                      />
                      <Text
                        style={[
                          styles.specChipText,
                          isCovered ? styles.specChipTextCovered : styles.specChipTextMissing,
                        ]}
                      >
                        {spec}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {works.map((work, index) => (
            <View key={work?.id ?? index} style={styles.workCard}>
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeCardButton}
                  onPress={() => removeWork(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={24} color="#FF4F8F" />
                </TouchableOpacity>
              )}

              {/* Specialization Quick Selector Chips */}
              {(data.specializations || []).length > 0 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.quickSpecLabel}>Choose Specialization Tag:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }}>
                    {(data.specializations || []).map((spec, sIdx) => {
                      const isSelected = work.description === spec;
                      return (
                        <TouchableOpacity
                          key={sIdx}
                          style={[
                            styles.quickSpecChip,
                            isSelected && styles.quickSpecChipSelected,
                          ]}
                          onPress={() => {
                            updateWorkField(index, 'description', spec);
                            if (!work.tag) {
                              updateWorkField(index, 'tag', `${spec} Work`);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.quickSpecChipText,
                              isSelected && styles.quickSpecChipTextSelected,
                            ]}
                          >
                            {spec}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Event Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Event Name</Text>
                </View>
                <TextInput
                  placeholder="e.g. Wedding Event / Party Makeup"
                  placeholderTextColor="#C7AAA0"
                  value={work?.tag ?? ''}
                  onChangeText={text => updateWorkField(index, 'tag', text)}
                  style={styles.input}
                />
              </View>

              {/* Makeup Type */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Makeup Type / Specialization</Text>
                </View>
                <TextInput
                  placeholder="e.g. Bridal / HD / Airbrush"
                  placeholderTextColor="#C7AAA0"
                  value={work?.description ?? ''}
                  onChangeText={text => updateWorkField(index, 'description', text)}
                  style={styles.input}
                />
              </View>

              {/* Upload Past Work's Photos container */}
              <View style={styles.photosContainer}>
                <View style={styles.photosHeader}>
                  <Text style={styles.photosTitle}>Upload Past Work's Photos</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Suggestions',
                        '1. Add at least 1 photo of without makeup\n2. Add at least 3 photos of a single work.'
                      );
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#FF4F8F" />
                  </TouchableOpacity>
                </View>

                {/* Subtitle list style hint */}
                <Text style={styles.photoHint}>
                  • Add at least 1 photo of without makeup{'\n'}
                  • Add at least 3 photos of a single work
                </Text>

                <View style={styles.photosRow}>
                  {/* Without Makeup (Before) */}
                  <View style={styles.photoSlotGroup}>
                    <Text style={styles.slotLabel}>Without Makeup</Text>
                    <TouchableOpacity
                      style={styles.beforePhotoSlot}
                      onPress={() => handleImagePick('before', index)}
                    >
                      {work?.beforeImage ? (
                        <Image source={{ uri: work.beforeImage }} style={styles.slotImage} />
                      ) : (
                        <View style={styles.slotPlaceholder}>
                          <Ionicons name="camera-outline" size={24} color="#B7A9A1" />
                          <Text style={styles.slotPlaceholderText}>Before</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Vertical Divider */}
                  <View style={styles.verticalDivider} />

                  {/* Work Photos (After) */}
                  <View style={[styles.photoSlotGroup, { flex: 1 }]}>
                    <Text style={styles.slotLabel}>Work Photos (After)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workPhotosScroll}>
                      {(work?.images || []).map((imgUrl, imgIdx) => (
                        <View key={imgIdx} style={styles.workPhotoSlot}>
                          <Image source={{ uri: imgUrl }} style={styles.slotImage} />
                          <TouchableOpacity
                            style={styles.deletePhotoBadge}
                            onPress={() => handleRemoveWorkImage(index, imgIdx)}
                          >
                            <Ionicons name="close" size={12} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add Button */}
                      {(work?.images || []).length < 10 && (
                        <TouchableOpacity
                          style={styles.addWorkPhotoSlot}
                          onPress={() => handleImagePick('work', index)}
                        >
                          <Ionicons name="add" size={24} color="#FF4F8F" />
                          <Text style={[styles.slotPlaceholderText, { color: '#FF4F8F' }]}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addWorkButton} onPress={addWork}>
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={20} color="#FF4F8F" />
            </View>
            <Text style={styles.addWorkText}>Add More +</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={async () => {
              // Validations
              for (let i = 0; i < works.length; i++) {
                const w = works[i];
                const workNum = i + 1;
                
                if (!w.tag.trim()) {
                  Alert.alert('Validation Error', `Event Name is required for work ${workNum}`);
                  return;
                }
                
                if (!w.description.trim()) {
                  Alert.alert('Validation Error', `Makeup Type is required for work ${workNum}`);
                  return;
                }
                
                if (!w.beforeImage) {
                  Alert.alert('Validation Error', `Please upload a Without Makeup (Before) image for work ${workNum}`);
                  return;
                }
                
                if (!w.images || w.images.length < 3) {
                  Alert.alert('Validation Error', `Please upload at least 3 Work (After) photos for work ${workNum}`);
                  return;
                }
              }

              // Validate that ALL selected specializations have past work uploaded
              const selectedSpecs = data.specializations || [];
              if (selectedSpecs.length > 0) {
                const missingSpecs = selectedSpecs.filter(spec => {
                  return !works.some(
                    w =>
                      w.images &&
                      w.images.length > 0 &&
                      (w.description?.toLowerCase().trim() === spec.toLowerCase().trim() ||
                        w.tag?.toLowerCase().trim() === spec.toLowerCase().trim() ||
                        w.description?.toLowerCase().includes(spec.toLowerCase()))
                  );
                });

                if (missingSpecs.length > 0) {
                  Alert.alert(
                    'Portfolio Required For All Specializations',
                    `You must upload past work photos for each of your selected specializations.\n\nMissing Specialization(s):\n• ${missingSpecs.join('\n• ')}`
                  );
                  return;
                }
              }

              try {
                setIsSubmitting(true);
                const portfolioPayload = works.map(item => ({
                  beforeImage: item?.beforeImage,
                  afterImage: item?.afterImage || item?.images?.[0] || null,
                  images: item?.images || [],
                  tag: item?.tag,
                  description: item?.description,
                }));
                
                await updateArtistProfile({ portfolio: portfolioPayload });
                setPortfolio(works);
                
                if (route?.params?.fromPending) {
                  navigation.navigate('ArtistRegistrationPending');
                } else {
                  navigation.navigate('BookingPreferencesScreen', route.params);
                }
              } catch (error) {
                console.error('Save step 5 error:', error);
                const msg = error?.response?.data?.message || error?.message || 'Failed to save portfolio';
                Alert.alert('Error', msg);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Lets Make-up Profile</Text>

                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ArtistRegisterScreen5;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },

  // HEADER

  headerCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 30,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  headerText: {
    fontSize: 24,
    color: '#111',
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '700',
  },

  pinkText: {
    color: '#FF4F8F',
  },

  // INPUTS

  inputGroup: {
    position: 'relative',
    marginTop: 18,
  },

  labelRow: {
    position: 'absolute',
    top: -10,
    left: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fieldLabel: {
    color: '#FF4F8F',
    fontSize: 13,
    fontWeight: '700',
  },

  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    color: '#111',
    fontSize: 15,
    marginBottom: 14,
  },

  workCard: {
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 24,
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 20,
    position: 'relative',
  },

  removeCardButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },

  // PHOTOS CONTAINER

  photosContainer: {
    marginTop: 8,
  },

  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  photosTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  photoHint: {
    fontSize: 11,
    color: '#8A7D77',
    lineHeight: 16,
    marginBottom: 12,
  },

  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  photoSlotGroup: {
    alignItems: 'flex-start',
  },

  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F8F',
    marginBottom: 8,
  },

  beforePhotoSlot: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderStyle: 'dashed',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  slotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  slotPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  slotPlaceholderText: {
    fontSize: 10,
    color: '#B7A9A1',
    fontWeight: '600',
    marginTop: 2,
  },

  verticalDivider: {
    width: 1.5,
    height: 80,
    backgroundColor: '#FFE4ED',
    marginHorizontal: 16,
  },

  workPhotosScroll: {
    flexGrow: 0,
  },

  workPhotoSlot: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },

  addWorkPhotoSlot: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderStyle: 'dashed',
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deletePhotoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4F8F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },

  // ADD MORE BUTTON

  addWorkButton: {
    height: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 24,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  plusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  addWorkText: {
    color: '#FF4F8F',
    fontSize: 18,
    fontWeight: '700',
  },

  // SUBMIT BUTTON

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // SPECIALIZATION COVERAGE BANNER STYLES
  specCoverageBanner: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  specCoverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  specCoverageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginLeft: 6,
  },
  specCoverageSub: {
    fontSize: 12,
    color: '#8A7D77',
    marginBottom: 10,
  },
  specChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specChipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  specChipCovered: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  specChipMissing: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  specChipTextCovered: {
    color: '#2E7D32',
  },
  specChipTextMissing: {
    color: '#D32F2F',
  },

  // QUICK SPEC CHIPS IN WORK CARD
  quickSpecLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4F8F',
    marginBottom: 4,
  },
  quickSpecChip: {
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },
  quickSpecChipSelected: {
    backgroundColor: '#FF4F8F',
    borderColor: '#FF4F8F',
  },
  quickSpecChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4F8F',
  },
  quickSpecChipTextSelected: {
    color: '#FFF',
  },
});

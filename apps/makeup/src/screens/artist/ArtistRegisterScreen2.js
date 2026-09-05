// ProfileSetupScreen.js
import { PermissionsAndroid, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from '@react-native-vector-icons/ionicons';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';
import { ActivityIndicator } from 'react-native';

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
const containerPaddingTop =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 20;
const ProfileSetupScreen = ({ navigation, route }) => {
  const fromPending = route?.params?.fromPending;
  const { data, setProfileInfo } = useArtistRegistration();
  const [profileImage, setProfileImage] = useState(
    data.profile.profileImage || null,
  );
  const [uploadError, setUploadError] = useState('');
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOption, setActiveOption] = useState('');
  const [selectedGender, setSelectedGender] = useState(
    data.profile.gender || '',
  );
  const [selectedExperience, setSelectedExperience] = useState(
    data.profile.experience || '',
  );
  
  const [selectedHomeService, setSelectedHomeService] = useState(
    data.profile.homeService || '',
  );
  
  const [languageQuery, setLanguageQuery] = useState('');
  const [languages, setLanguages] = useState(
    data.profile.languages || [],
  );

  const [bio, setBio] = useState(data.profile.bio || '');
  const [location, setLocation] = useState(data.profile.location || '');
  const parseParlourAddress = (fullAddress) => {
    if (!fullAddress) return { line: '', city: '', pinCode: '' };
    const pinIndex = fullAddress.lastIndexOf('-');
    let pinCode = '';
    let rest = fullAddress;
    if (pinIndex !== -1) {
      pinCode = fullAddress.substring(pinIndex + 1).trim();
      rest = fullAddress.substring(0, pinIndex).trim();
    }
    const commaIndex = rest.lastIndexOf(',');
    let city = '';
    let line = rest;
    if (commaIndex !== -1) {
      city = rest.substring(commaIndex + 1).trim();
      line = rest.substring(0, commaIndex).trim();
    }
    return { line, city, pinCode };
  };

  const initialAddress = parseParlourAddress(data.profile.parlourAddress || '');
  const [parlourName, setParlourName] = useState(data.profile.parlourName || '');
  const [parlourAddressLine, setParlourAddressLine] = useState(initialAddress.line);
  const [parlourCity, setParlourCity] = useState(initialAddress.city);
  const [parlourPinCode, setParlourPinCode] = useState(initialAddress.pinCode);
  const [parlourCityQuery, setParlourCityQuery] = useState(initialAddress.city);
  const [parlourCitySuggestions, setParlourCitySuggestions] = useState([]);
  const [loadingParlourCitySuggestions, setLoadingParlourCitySuggestions] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(
    data.profile.location
      ? data.profile.location
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [],
  );
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!locationQuery || locationQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        setLoadingSuggestions(true);
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=pk.a74ba553bc5de1a0d26527268257f8d4&q=${encodeURIComponent(
            locationQuery,
          )}`,
        );
        const result = await response.json();
        if (Array.isArray(result)) {
          setSuggestions(result);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [locationQuery]);

  useEffect(() => {
    const fetchParlourCitySuggestions = async () => {
      if (!parlourCityQuery || parlourCityQuery.trim().length < 3) {
        setParlourCitySuggestions([]);
        return;
      }
      try {
        setLoadingParlourCitySuggestions(true);
        const response = await fetch(
          `https://api.locationiq.com/v1/autocomplete?key=pk.a74ba553bc5de1a0d26527268257f8d4&q=${encodeURIComponent(
            parlourCityQuery,
          )}`,
        );
        const result = await response.json();
        if (Array.isArray(result)) {
          const parsed = result
            .map((item) => {
              const addr = item.address;
              if (!addr) return null;
              const city = addr.city || addr.town || addr.village || '';
              const state = addr.state || '';
              const country = addr.country || '';
              if (!city) return null;
              return {
                display: `${city}, ${state ? state + ', ' : ''}${country}`,
                city,
              };
            })
            .filter((item) => item !== null);

          const unique = [];
          const seen = new Set();
          for (const item of parsed) {
            if (!seen.has(item.city.toLowerCase())) {
              seen.add(item.city.toLowerCase());
              unique.push(item);
            }
          }
          setParlourCitySuggestions(unique);
        } else {
          setParlourCitySuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching parlour cities:', err);
      } finally {
        setLoadingParlourCitySuggestions(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchParlourCitySuggestions();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [parlourCityQuery]);

  useEffect(() => {
    setLocation(selectedLocations.join(', '));
  }, [selectedLocations]);

  const displayName = data.basic.name || 'Artist';

  const genderOptions = ['Female', 'Male', 'Other'];
  const experienceOptions = [
    '0-1 years',
    '1-2 years',
    '2-3 years',
    '3-4 years',
    '4-5 years',
    '5+ years',
  ];
  const homeServiceOptions = ['Yes, I travel to client', 'No, only Studio/Salon', 'Both Studio and Home Service'];

  const openOptionModal = type => {
    Keyboard.dismiss();
    setActiveOption(type);
    setOptionModalVisible(true);
  };

  const handleOptionSelect = value => {
    if (activeOption === 'gender') {
      setSelectedGender(value);
    } else if (activeOption === 'experience') {
      setSelectedExperience(value);
    } else if (activeOption === 'homeService') {
      setSelectedHomeService(value);
    }
    setOptionModalVisible(false);
  };

  const openCamera = async () => {
    const granted = await requestCameraPermission();

    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission is needed');
      return;
    }

    setImagePickerVisible(false);

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 1,
      cameraType: 'front',
      saveToPhotos: true,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      try {
        setUploadError('');
        const asset = result.assets[0];
        const rawName = asset.fileName || `photo_${Date.now()}.jpg`;
        const cleanName = rawName.replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
        const file = {
          uri: asset.uri,
          name: cleanName || 'photo.jpg',
          type: (asset.type || 'image/jpeg').replace(/[^\x00-\x7F]/g, ''),
        };

        const url = await uploadFile(file);
        if (url) {
          setProfileImage(url);
        } else {
          setProfileImage(asset.uri);
        }
      } catch (err) {
        console.warn('Upload failed', err);
        setUploadError(err.message || 'Unable to upload image');
        Alert.alert('Upload failed', err.message || 'Unable to upload image');
        setProfileImage(result.assets[0].uri);
      }
    }
  };

  // OPEN GALLERY
  const openGallery = async () => {
    setImagePickerVisible(false);

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      try {
        setUploadError('');
        const asset = result.assets[0];
        const rawName = asset.fileName || `photo_${Date.now()}.jpg`;
        const cleanName = rawName.replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
        const file = {
          uri: asset.uri,
          name: cleanName || 'photo.jpg',
          type: (asset.type || 'image/jpeg').replace(/[^\x00-\x7F]/g, ''),
        };

        const url = await uploadFile(file);
        if (url) {
          setProfileImage(url);
        } else {
          setProfileImage(asset.uri);
        }
      } catch (err) {
        console.warn('Upload failed', err);
        setUploadError(err.message || 'Unable to upload image');
        Alert.alert('Upload failed', err.message || 'Unable to upload image');
        setProfileImage(result.assets[0].uri);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={containerPaddingTop}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* PROFILE SECTION */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : {
                        uri: 'https://png.pngtree.com/png-vector/20220608/ourmid/pngtree-anonymous-user-unidentified-contact-avatar-png-image_4816655.png',
                      }
                }
                style={styles.profileImage}
              />

              {/* ADD IMAGE BUTTON */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setImagePickerVisible(true);
                }}
              >
                <Ionicons name="add" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {!!uploadError ? (
              <Text style={styles.uploadErrorText}>{uploadError}</Text>
            ) : null}

            {/* NAME */}
            <TouchableOpacity style={styles.nameContainer}>
              <Text style={styles.nameText}>{displayName}</Text>
            </TouchableOpacity>
          </View>

          {/* BIO */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>

            <TextInput
              placeholder={`A short Intro about you, ${displayName}`}
              placeholderTextColor="#B7A9A1"
              multiline
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput]}
            />
          </View>
          
          {/* LANGUAGES */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Languages Known</Text>

            <View style={styles.inputWithLoader}> 
              <TextInput
                placeholder="Type language and press space/enter"
                placeholderTextColor="#B7A9A1"
                value={languageQuery}
                onChangeText={(val) => {
                  if (val.endsWith(' ') || val.endsWith(',')) {
                    const lang = val.replace(/[, ]/g, '').trim();
                    if (lang && !languages.includes(lang)) {
                      setLanguages([...languages, lang]);
                    }
                    setLanguageQuery('');
                  } else {
                    setLanguageQuery(val);
                  }
                }}
                onSubmitEditing={() => {
                  const lang = languageQuery.trim();
                  if (lang && !languages.includes(lang)) {
                    setLanguages([...languages, lang]);
                  }
                  setLanguageQuery('');
                }}
                style={styles.input}
              />
            </View>
            
            {languages.length > 0 && (
              <View style={styles.chipsContainer}>
                {languages.map((lang, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{lang}</Text>
                    <TouchableOpacity
                      onPress={() => setLanguages(languages.filter(item => item !== lang))}
                      style={styles.chipRemoveButton}
                    >
                      <Ionicons name="close" size={16} color="#FF4F8F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* GENDER */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => openOptionModal('gender')}
            >
              <Text
                style={
                  selectedGender ? styles.dropdownText : styles.placeholder
                }
              >
                {selectedGender || 'Select your Gender'}
              </Text>

              <Ionicons name="chevron-down" size={22} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {/* EXPERIENCE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => openOptionModal('experience')}
            >
              <Text
                style={
                  selectedExperience ? styles.dropdownText : styles.placeholder
                }
              >
                {selectedExperience || 'Select experience'}
              </Text>

              <Ionicons name="chevron-down" size={22} color="#FF4F8F" />
            </TouchableOpacity>
          </View>
          
          {/* HOME SERVICE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Home Service</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => openOptionModal('homeService')}
            >
              <Text
                style={
                  selectedHomeService ? styles.dropdownText : styles.placeholder
                }
              >
                {selectedHomeService || 'Do you offer Home Service?'}
              </Text>

              <Ionicons name="chevron-down" size={22} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {/* LOCATION */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>

            <View style={styles.inputWithLoader}> 
              <TextInput
                placeholder="Search & add service City"
                placeholderTextColor="#B7A9A1"
                value={locationQuery}
                onChangeText={setLocationQuery}
                style={[styles.input, { paddingRight: 50 }]}
              />
              <View style={styles.rightIconsContainer}>
                {loadingSuggestions && (
                  <ActivityIndicator
                    color="#FF4F8F"
                    size="small"
                    style={{ marginRight: 8 }}
                  />
                )}
                <TouchableOpacity
                  onPress={() => Alert.alert('Service Locations', 'Choose all the cities where you can provide service')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="information-circle-outline" size={22} color="#FF4F8F" />
                </TouchableOpacity>
              </View>
            </View>

      

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                  {suggestions.map((item, index) => {
                    const name = item.display_name;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          if (!selectedLocations.includes(name)) {
                            setSelectedLocations([...selectedLocations, name]);
                          }
                          setLocationQuery('');
                          setSuggestions([]);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#FF4F8F"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.suggestionText} numberOfLines={2}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedLocations.length > 0 && (
              <View style={styles.chipsContainer}>
                {selectedLocations.map((loc, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText} numberOfLines={1}>
                      {loc}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedLocations(
                          selectedLocations.filter(item => item !== loc),
                        );
                      }}
                      style={styles.chipRemoveButton}
                    >
                      <Ionicons name="close" size={16} color="#FF4F8F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* OWNED PARLOUR DETAILS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parlour Name (Optional)</Text>
            <TextInput
              placeholder="e.g. Blossom Beauty Parlour"
              placeholderTextColor="#B7A9A1"
              value={parlourName}
              onChangeText={setParlourName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parlour Address Line (Optional)</Text>
            <TextInput
              placeholder="Flat/House No., Building, Street, Area"
              placeholderTextColor="#B7A9A1"
              value={parlourAddressLine}
              onChangeText={setParlourAddressLine}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parlour City (Optional)</Text>
            <View style={styles.inputWithLoader}>
              <TextInput
                placeholder="e.g. Pune"
                placeholderTextColor="#B7A9A1"
                value={parlourCityQuery}
                onChangeText={(val) => {
                  setParlourCity(val);
                  parlourCityQuery !== val && setParlourCityQuery(val);
                }}
                style={styles.input}
              />
              {loadingParlourCitySuggestions && (
                <ActivityIndicator
                  color="#FF4F8F"
                  size="small"
                  style={styles.loaderInsideInput}
                />
              )}
            </View>

            {parlourCitySuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 160 }}>
                  {parlourCitySuggestions.map((item, index) => {
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setParlourCity(item.city);
                          setParlourCityQuery(item.city);
                          setParlourCitySuggestions([]);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#FF4F8F"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.suggestionText} numberOfLines={2}>
                          {item.display}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Parlour PIN Code (Optional)</Text>
            <TextInput
              placeholder="6-digit PIN code"
              placeholderTextColor="#B7A9A1"
              value={parlourPinCode}
              onChangeText={(val) => setParlourPinCode(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
            />
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={async () => {
              Keyboard.dismiss();
              const hasParlour = !!parlourName.trim();
              const hasAddressLine = !!parlourAddressLine.trim();
              const hasCity = !!parlourCity.trim();
              const hasPinCode = !!parlourPinCode.trim();
              const hasAnyAddressPart = hasAddressLine || hasCity || hasPinCode;

              if (hasParlour && (!hasAddressLine || !hasCity || !hasPinCode)) {
                Alert.alert(
                  'Validation Error',
                  'Please fill in all parlour address fields (Address Line, City, and PIN Code) if you specify a parlour name.'
                );
                return;
              }

              if (hasAnyAddressPart && !hasParlour) {
                Alert.alert('Validation Error', 'Please enter the parlour name if you specify a parlour address.');
                return;
              }

              if (hasPinCode && (parlourPinCode.trim().length !== 6 || isNaN(parlourPinCode.trim()))) {
                Alert.alert('Validation Error', 'Please enter a valid 6-digit PIN Code.');
                return;
              }

              try {
                setIsSubmitting(true);

                // Validate PIN Code matches selected City via LocationIQ
                if (hasPinCode && hasCity) {
                  let pinValid = false;
                  try {
                    const response = await fetch(
                      `https://api.locationiq.com/v1/search?key=pk.a74ba553bc5de1a0d26527268257f8d4&q=${encodeURIComponent(
                        parlourPinCode.trim() + ', India'
                      )}&format=json`
                    );
                    const resData = await response.json();
                    if (Array.isArray(resData) && resData.length > 0) {
                      const place = resData[0];
                      const placeDisplayName = (place.display_name || '').toLowerCase();
                      const cityLower = parlourCity.trim().toLowerCase();
                      if (placeDisplayName.includes(cityLower)) {
                        pinValid = true;
                      }
                    }
                  } catch (err) {
                    console.warn('PIN Code validation API error:', err);
                    pinValid = true; // Fallback
                  }

                  if (!pinValid) {
                    Alert.alert(
                      'Validation Error',
                      `The PIN Code ${parlourPinCode.trim()} does not belong to the selected city: ${parlourCity.trim()}.`
                    );
                    setIsSubmitting(false);
                    return;
                  }
                }

                const combinedAddress = hasParlour
                  ? `${parlourAddressLine.trim()}, ${parlourCity.trim()} - ${parlourPinCode.trim()}`
                  : '';

                const profilePayload = {
                  profileImage,
                  gender: selectedGender,
                  bio,
                  location,
                  experience: selectedExperience,
                  parlourName: parlourName.trim() || undefined,
                  parlourAddress: combinedAddress || undefined,
                  languages,
                  homeService: selectedHomeService,
                };
                
                await updateArtistProfile({ profile: profilePayload });
                setProfileInfo(profilePayload);
                
                if (fromPending) {
                  navigation.navigate('ArtistRegistrationPending');
                } else {
                  navigation.navigate('ArtistRegister3');
                }
              } catch (error) {
                console.error('Save step 2 error:', error);
                const msg = error?.response?.data?.message || error?.message || 'Failed to save basic info';
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
                <Text style={styles.buttonText}>Let’s Make-up Profile</Text>

                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color="#FFF"
                  style={{ marginLeft: 10 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* IMAGE PICKER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imagePickerVisible}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setImagePickerVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Choose Profile Photo</Text>

            {/* CAMERA */}
            <TouchableOpacity style={styles.sheetButton} onPress={openCamera}>
              <Ionicons name="camera" size={22} color="#FF4F8F" />

              <Text style={styles.sheetButtonText}>Open Camera</Text>
            </TouchableOpacity>

            {/* GALLERY */}
            <TouchableOpacity style={styles.sheetButton} onPress={openGallery}>
              <Ionicons name="image" size={22} color="#FF4F8F" />

              <Text style={styles.sheetButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* DROPDOWN OPTION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={optionModalVisible}
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOptionModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>
              {activeOption === 'gender'
                ? 'Select Gender'
                : activeOption === 'experience'
                ? 'Select Experience'
                : 'Home Service Settings'}
            </Text>

            {(activeOption === 'gender'
              ? genderOptions
              : activeOption === 'experience'
              ? experienceOptions
              : homeServiceOptions
            ).map(item => (
              <TouchableOpacity
                key={item}
                style={styles.sheetButton}
                onPress={() => handleOptionSelect(item)}
              >
                <Text style={styles.sheetButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setOptionModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 24,
    paddingTop: containerPaddingTop,
  },

  headerText: {
    marginTop: 10,
    fontSize: 18,
    color: '#7A7A7A',
    fontFamily: 'serif',
  },

  imageSection: {
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 40,
  },

  imageWrapper: {
    position: 'relative',
  },

  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#FFD1E1',
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: -5,
    borderWidth: 1.5,
    borderColor: '#FF4F8F',
  },

  nameContainer: {
    marginTop: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
  },

  uploadErrorText: {
    marginTop: 12,
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  nameText: {
    fontSize: 24,
    color: '#111',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  inputGroup: {
    marginBottom: 28,
  },

  label: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    marginLeft: 18,
    marginBottom: -10,
    zIndex: 10,
    color: '#FF4F8F',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'serif',
  },

  input: {
    minHeight: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 24,
    paddingHorizontal: 22,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#FFF',
    fontFamily: 'serif',
  },

  bioInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 20,
  },

  dropdown: {
    height: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 24,
    paddingHorizontal: 22,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  placeholder: {
    fontSize: 16,
    color: '#B7A9A1',
    fontFamily: 'serif',
  },

  dropdownText: {
    fontSize: 16,
    color: '#111',
    fontFamily: 'serif',
  },

  locationInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 18,
  },

  inputWithLoader: {
    position: 'relative',
    justifyContent: 'center',
  },

  loaderInsideInput: {
    position: 'absolute',
    right: 18,
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  chipText: {
    color: '#FF4F8F',
    fontSize: 14,
    fontFamily: 'serif',
    marginRight: 4,
    maxWidth: 200,
  },

  chipRemoveButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  suggestionsContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 18,
    marginTop: 6,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4ED',
  },

  suggestionText: {
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    flex: 1,
  },

  rightIconsContainer: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 6,
  },

  locationInfoText: {
    color: '#8A7D77',
    fontSize: 12,
    fontFamily: 'serif',
  },

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '700',
    fontFamily: 'serif',
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: 'serif',
  },

  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  sheetButtonText: {
    fontSize: 18,
    color: '#111',
    marginLeft: 16,
    fontFamily: 'serif',
  },

  cancelButton: {
    marginTop: 20,
    backgroundColor: '#FFE4ED',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },

  cancelText: {
    color: '#FF4F8F',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },
});

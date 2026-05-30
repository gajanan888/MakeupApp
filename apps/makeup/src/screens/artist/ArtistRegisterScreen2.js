// ProfileSetupScreen.js
import { PermissionsAndroid, Platform } from 'react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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

import Ionicons from '@react-native-vector-icons/ionicons';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      const storageGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES ||
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );

      return (
        cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
        storageGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  return true;
};
const containerPaddingTop =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 20;
const ProfileSetupScreen = ({ navigation }) => {
  const { data, setProfileInfo } = useArtistRegistration();
  const [profileImage, setProfileImage] = useState(
    data.profile.profileImage || null,
  );
  const [uploadError, setUploadError] = useState('');
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [activeOption, setActiveOption] = useState('');
  const [selectedGender, setSelectedGender] = useState(
    data.profile.gender || '',
  );
  const [selectedExperience, setSelectedExperience] = useState(
    data.profile.experience || '',
  );
  const [bio, setBio] = useState(data.profile.bio || '');
  const [location, setLocation] = useState(data.profile.location || '');

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
    }
    setOptionModalVisible(false);
  };

  const openCamera = async () => {
    const granted = await requestPermissions();

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
        const file = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
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
    const granted = await requestPermissions();

    if (!granted) {
      Alert.alert('Permission Required', 'Gallery permission is needed');
      return;
    }

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
        const file = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={containerPaddingTop}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
        >
          {/* PROFILE SECTION */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : {
                        uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
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
              placeholder="A short Intro about you, Mona"
              placeholderTextColor="#B7A9A1"
              multiline
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput]}
            />
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

          {/* LOCATION */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>

            <TextInput
              placeholder="Give service City/Area
(Can choose more than one area)"
              placeholderTextColor="#B7A9A1"
              multiline
              value={location}
              onChangeText={setLocation}
              style={[styles.input, styles.locationInput]}
            />
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Keyboard.dismiss();
              setProfileInfo({
                profileImage,
                gender: selectedGender,
                bio,
                location,
                experience: selectedExperience,
              });
              navigation.navigate('ArtistRegister3');
            }}
          >
            <Text style={styles.buttonText}>Let’s Make-up Profile</Text>

            <Ionicons
              name="arrow-forward"
              size={22}
              color="#FFF"
              style={{ marginLeft: 10 }}
            />
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
                : 'Select Experience'}
            </Text>

            {(activeOption === 'gender'
              ? genderOptions
              : experienceOptions
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

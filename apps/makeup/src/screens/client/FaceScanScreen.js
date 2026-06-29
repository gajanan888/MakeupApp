import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import LinearGradient from 'react-native-linear-gradient';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const FaceScanScreen = ({ navigation }) => {
  const handleLiveCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to scan your face.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Camera permission denied');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      cameraType: 'front',
      quality: 0.8,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        navigation.navigate('FaceScanScanning', { image: response.assets[0] });
      }
    });
  };

  const handleUploadPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image library');
      } else if (response.errorMessage) {
        console.log('Image Library Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        navigation.navigate('FaceScanScanning', { image: response.assets[0] });
      }
    });
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader title="AI Face Scan" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.heading}>Let's analyze your face</Text>
        <Text style={styles.subheading}>
          Choose a method to scan your face
        </Text>

        <View style={styles.optionList}>
          <TouchableOpacity
            style={styles.optionCardWrap}
            activeOpacity={0.88}
            onPress={handleLiveCamera}
          >
            <LinearGradient
              colors={['#FFFBFD', '#FFF0F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionCard}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="camera" size={26} color="#FF4F87" />
              </View>
              <Text style={styles.optionTitle}>Live Camera</Text>
              <Text style={styles.optionText}>
                Use your camera for real-time scan
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCardWrap}
            activeOpacity={0.88}
            onPress={handleUploadPhoto}
          >
            <LinearGradient
              colors={['#FFFBFD', '#FFF0F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionCard}
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={26}
                  color="#FF4F87"
                />
              </View>
              <Text style={styles.optionTitle}>Upload Photo</Text>
              <Text style={styles.optionText}>
                Upload a clear front-facing photo
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Make sure your face is clearly visible for best results.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 6,
    fontSize: 14,
    color: '#7D7D7D',
    textAlign: 'center',
  },
  optionList: {
    width: '100%',
    marginTop: 18,
    alignItems: 'center',
    gap: 18,
  },
  optionCardWrap: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  optionCard: {
    width: '100%',
    minHeight: 150,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFE1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0EB',
    marginBottom: 12,
    shadowColor: '#FF4F87',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1C',
  },
  optionText: {
    marginTop: 6,
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    marginTop: 'auto',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFF7F9',
    borderWidth: 1,
    borderColor: '#F7D7E2',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#8B6A76',
    textAlign: 'center',
    lineHeight: 17,
  },
});

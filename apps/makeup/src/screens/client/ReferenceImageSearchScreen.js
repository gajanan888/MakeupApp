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
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const RECENT_SEARCHES = [
  { id: '1', uri: 'https://res.cloudinary.com/djonmzyiu/image/upload/v1785500838/ymv8sdwvuaqsiz4j8tsz.png' },
  { id: '2', uri: 'https://res.cloudinary.com/djonmzyiu/image/upload/v1785500838/ymv8sdwvuaqsiz4j8tsz.png' },
  { id: '3', uri: 'https://res.cloudinary.com/djonmzyiu/image/upload/v1785500838/ymv8sdwvuaqsiz4j8tsz.png' },
  { id: '4', uri: 'https://res.cloudinary.com/djonmzyiu/image/upload/v1785500838/ymv8sdwvuaqsiz4j8tsz.png' },
];

const ReferenceImageSearchScreen = ({ navigation }) => {
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
        navigation.navigate('ReferenceAnalyzing', {
          selectedImage: response.assets[0],
        });
      }
    });
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
        navigation.navigate('ReferenceAnalyzing', {
          selectedImage: response.assets[0],
        });
      }
    });
  };

  const renderTip = (text, icon) => (
    <View style={styles.tipCard}>
      <View style={styles.tipIconBox}>
        <Ionicons name={icon} size={20} color="#FF4F87" />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Artist</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.titleText}>
          Find the perfect{'\n'}
          <Text style={{color: '#333'}}>makeup artist</Text>{'\n'}
          <Text style={styles.titleHighlight}>by reference image</Text>
        </Text>
        
        <Text style={styles.subtitleText}>
          Upload a makeup look you love and we'll recommend the best matching artists.
        </Text>

        <TouchableOpacity 
          style={styles.uploadCard} 
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Upload Image',
              'Choose an option',
              [
                { text: 'Camera', onPress: handleCameraCapture },
                { text: 'Gallery', onPress: handlePickImage },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <View style={styles.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={36} color="#FF4F87" />
          </View>
          <Text style={styles.uploadTitle}>Upload Reference Image</Text>
          <Text style={styles.uploadSub}>JPG, PNG up to 10MB</Text>
          
          <View style={styles.chooseBtn}>
            <Ionicons name="image-outline" size={16} color="#FF4F87" style={{marginRight: 6}} />
            <Text style={styles.chooseBtnText}>Choose from Gallery</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Tips for better results</Text>
        {renderTip("Use a clear front face photo", "person-outline")}
        {renderTip("Good lighting and no heavy filter", "sunny-outline")}
        {renderTip("Close-up of the makeup look", "scan-circle-outline")}

        <View style={styles.searchesHeaderRow}>
          <Text style={styles.sectionTitle}>Your searches</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchesScroll}>
          {RECENT_SEARCHES.map((item, index) => (
            <TouchableOpacity key={item.id} style={styles.recentSearchCard}>
              <Image source={{ uri: item.uri }} style={styles.recentSearchImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReferenceImageSearchScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    lineHeight: 40,
    marginTop: 20,
  },
  titleHighlight: {
    color: '#FF4F87',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
    fontWeight: '500',
  },
  uploadCard: {
    backgroundColor: '#FFF8FA',
    borderWidth: 2,
    borderColor: '#FFE0EC',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
    marginBottom: 24,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  chooseBtnText: {
    color: '#FF4F87',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipIconBox: {
    marginRight: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#8A5D6D',
    fontWeight: '600',
  },
  searchesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '700',
    marginBottom: 16,
  },
  searchesScroll: {
    gap: 12,
    paddingRight: 24,
  },
  recentSearchCard: {
    width: 76,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentSearchImage: {
    width: '100%',
    height: '100%',
  },
});

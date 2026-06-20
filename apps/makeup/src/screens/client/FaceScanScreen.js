import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';

const FaceScanScreen = ({ navigation }) => {
  const handleAction = () => {
    navigation.navigate('FaceScanScanning');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader title="AI Face Scan" onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          <Text style={styles.heading}>Let's analyze your face</Text>
          <Text style={styles.subheading}>
            Choose a method to scan your face
          </Text>

          <View style={styles.optionList}>
            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.85}
              onPress={handleAction}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="camera" size={26} color="#FF4F87" />
              </View>
              <Text style={styles.optionTitle}>Live Camera</Text>
              <Text style={styles.optionText}>
                Use your camera for real-time scan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              activeOpacity={0.85}
              onPress={handleAction}
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
            </TouchableOpacity>
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Make sure your face is clearly visible for best results.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: {
    flex: 1,
    margin: 10,
    borderRadius: 28,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    overflow: 'hidden',
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
  optionCard: {
    width: '100%',
    minHeight: 150,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE1EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
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

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const FaceScanScanningScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scanning...</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Position your face</Text>
        <Text style={styles.subtitle}>Keep your face in the frame</Text>

        <View style={styles.faceFrameWrap}>
          <View style={styles.faceFrame}>
            <Image
              source={require('../../assets/images/model.jpeg')}
              style={styles.faceImage}
              resizeMode="cover"
            />

            <View style={styles.frameOverlay}>
              <View style={styles.faceOval} />
            </View>
          </View>
        </View>

        <Text style={styles.tipTitle}>Move your face slowly</Text>
        <Text style={styles.tipText}>We are capturing your best angle</Text>

        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('FaceScanAnalyzing')}
        >
          <View style={styles.scanButtonOuter}>
            <View style={styles.scanButtonInner} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanScanningScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F6E1E8',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 26,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  faceFrameWrap: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  faceFrame: {
    width: '100%',
    maxWidth: 300,
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 150,
    height: 214,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  tipTitle: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  tipText: {
    marginTop: 4,
    fontSize: 13,
    color: '#767676',
    textAlign: 'center',
  },
  scanButton: {
    marginTop: 18,
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  scanButtonOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  scanButtonInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: '#FF4F87',
  },
});

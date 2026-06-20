import React, { useEffect } from 'react';
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

const ANALYSIS_STEPS = [
  'Detecting facial features',
  'Analyzing face shape',
  'Analyzing skin tone',
  'Finding best makeup match',
];

const FaceScanAnalyzingScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('FaceScanResult');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader title="Analyzing..." onBack={() => navigation.goBack()} />

        <View style={styles.content}>
          <Text style={styles.heading}>AI is analyzing your face</Text>
          <Text style={styles.subheading}>This may take a few seconds</Text>

          <View style={styles.progressRing}>
            <Text style={styles.progressValue}>85%</Text>
          </View>

          <View style={styles.stepList}>
            {ANALYSIS_STEPS.map(step => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Ionicons name="checkmark" size={10} color="#FFF" />
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Please don't close the app
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanAnalyzingScreen;

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
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 5,
    fontSize: 13,
    color: '#7B7B7B',
    textAlign: 'center',
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 7,
    borderColor: '#FF4F87',
    borderTopColor: '#FFD4E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
    shadowColor: '#FF4F87',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#222',
  },
  stepList: {
    width: '100%',
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#4B4B4B',
    fontWeight: '600',
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
  },
});

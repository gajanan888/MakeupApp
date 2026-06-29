import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { recommendLooks, probeAndLockBaseURL } from '../../api/aiClient';

const ANALYSIS_STEPS = [
  'Detecting facial features',
  'Analyzing face shape',
  'Analyzing skin tone',
  'Finding best makeup match',
];

const FaceScanAnalyzingScreen = ({ navigation, route }) => {
  const image = route?.params?.image;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;

    // 1. Progress and step tick animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 96) {
          const next = prev + Math.floor(Math.random() * 8) + 2;
          return Math.min(next, 96);
        }
        return prev;
      });
    }, 150);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 500);

    // 2. Perform API call
    const runAnalysis = async () => {
      try {
        if (!image) {
          Alert.alert('Error', 'No image selected. Please try again.');
          navigation.navigate('FaceScan');
          return;
        }

        console.log('[Analyzing] Uploading image to AI backend...', image.uri);

        // Fast probe: find working server in ≤3s per candidate before 30s upload
        await probeAndLockBaseURL();

        const result = await recommendLooks(image);

        if (!active) return;

        if (result && result.face_detected && result.beauty_profile) {
          setProgress(100);
          setCurrentStep(3);
          // Small pause so the user sees 100% complete
          setTimeout(() => {
            if (active) {
              navigation.replace('FaceScanResult', {
                beauty_profile: result.beauty_profile,
                recommended_looks: result.recommended_looks || [],
                image: image,
              });
            }
          }, 400);
        } else {
          Alert.alert(
            'Analysis Failed',
            result?.message || 'No face detected. Please ensure your face is clearly visible, well-lit, and not cropped.'
          );
          navigation.navigate('FaceScan');
        }
      } catch (error) {
        console.error('[Analyzing] Request failed:', error);
        if (active) {
          Alert.alert(
            'Connection Error',
            'Failed to connect to the AI backend. Please ensure the server is running on port 8000 and accessible.'
          );
          navigation.navigate('FaceScan');
        }
      }
    };

    runAnalysis();

    return () => {
      active = false;
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [image, navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader title="Analyzing Face..." onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.heading}>AI is analyzing your face</Text>
        <Text style={styles.subheading}>This may take a few seconds</Text>

        <View style={styles.progressRing}>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>

        <View style={styles.stepList}>
          {ANALYSIS_STEPS.map((step, index) => {
            const completed = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIcon,
                    completed && styles.stepIconCompleted,
                    isCurrent && styles.stepIconActive,
                    !completed && !isCurrent && styles.stepIconPending,
                  ]}
                >
                  {completed ? (
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  ) : isCurrent ? (
                    <View style={styles.activeDot} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    completed && styles.stepTextCompleted,
                    isCurrent && styles.stepTextActive,
                    !completed && !isCurrent && styles.stepTextPending,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Please don't close the app
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanAnalyzingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepIconCompleted: {
    backgroundColor: '#FF4F87',
  },
  stepIconActive: {
    backgroundColor: '#FFE6EF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
  },
  stepIconPending: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4F87',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  stepTextCompleted: {
    color: '#222',
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  stepTextPending: {
    color: '#9E9E9E',
    fontWeight: '500',
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

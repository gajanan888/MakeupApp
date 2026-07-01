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
import { 
  uploadPreviewSelfie, 
  validatePreviewSelfie, 
  analyzePreviewFace, 
  sendPreviewChatMessage, 
  probeAndLockBaseURL 
} from '../../api/aiClient';

const ANALYSIS_STEPS = [
  'Uploading front-facing selfie',
  'Validating lighting and quality',
  'Analyzing features and parsing face masks',
  'Connecting to AI Beauty Advisor',
];

const FaceScanAnalyzingScreen = ({ navigation, route }) => {
  const image = route?.params?.image;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;

    // 1. Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 95) {
          const next = prev + Math.floor(Math.random() * 4) + 1;
          return Math.min(next, 95);
        }
        return prev;
      });
    }, 150);

    // 2. Perform Virtual Makeup Preview API Pipeline
    const runAnalysis = async () => {
      try {
        if (!image) {
          Alert.alert('Error', 'No image selected. Please try again.');
          navigation.navigate('FaceScan');
          return;
        }

        console.log('[Analyzing] Starting Virtual Preview Pipeline...');

        // Connect/probe base URL
        await probeAndLockBaseURL();

        // Step 0: Upload Selfie
        setCurrentStep(0);
        const uploadResult = await uploadPreviewSelfie(image);
        if (!active) return;
        const selfieId = uploadResult?.id;
        if (!selfieId) {
          throw new Error('Selfie upload failed: No ID returned.');
        }

        // Step 1: Validate Quality
        setProgress(30);
        setCurrentStep(1);
        const validateResult = await validatePreviewSelfie(selfieId);
        if (!active) return;
        if (!validateResult?.is_valid) {
          throw new Error(validateResult?.error_message || 'Selfie validation failed. Make sure your face is visible, centered, and well-lit.');
        }

        // Step 2: Analyze Face (landmarks + segment parsing masks)
        setProgress(60);
        setCurrentStep(2);
        const analyzeResult = await analyzePreviewFace(selfieId);
        if (!active) return;
        if (!analyzeResult?.landmarks) {
          throw new Error('Face landmark extraction failed.');
        }

        // Step 3: Initialize Gemini Chat Session
        setProgress(90);
        setCurrentStep(3);
        const chatInit = await sendPreviewChatMessage(selfieId, null, 'Hello! Initiate makeup prescription.');
        if (!active) return;
        
        setProgress(100);

        // Small delay so user sees completion
        setTimeout(() => {
          if (active) {
            navigation.replace('VirtualPreviewChat', {
              selfie_id: selfieId,
              chat_session_id: chatInit?.chat_session_id,
              first_reply: chatInit?.reply,
              image: image,
            });
          }
        }, 600);

      } catch (error) {
        console.error('[Analyzing] Pipeline failed:', error);
        if (active) {
          Alert.alert(
            'Analysis Error',
            error.message || 'An error occurred during face analysis. Please try again with a clear, well-lit photo.'
          );
          navigation.navigate('FaceScan');
        }
      }
    };

    runAnalysis();

    return () => {
      active = false;
      clearInterval(progressInterval);
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

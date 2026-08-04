import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Easing,
  Alert
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { recommendArtistsByImage } from '../../api/aiClient';

const ReferenceAnalyzingScreen = ({ route, navigation }) => {
  const { selectedImage } = route.params || {};

  const [stepsCompleted, setStepsCompleted] = useState(0);
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation loop
    const createPulseAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1.2,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        ])
      );
    };

    createPulseAnimation(pulseAnim1, 0).start();
    createPulseAnimation(pulseAnim2, 750).start();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Simulate progression of steps visually while API runs
    const timer1 = setTimeout(() => { if (isMounted) setStepsCompleted(1); }, 1500);
    const timer2 = setTimeout(() => { if (isMounted) setStepsCompleted(2); }, 3000);
    const timer3 = setTimeout(() => { if (isMounted) setStepsCompleted(3); }, 4500);

    const runAnalysis = async () => {
      try {
        if (!selectedImage) {
          throw new Error("No image selected");
        }
        const response = await recommendArtistsByImage(selectedImage);
        
        if (isMounted) {
          setStepsCompleted(4); // All complete
          
          setTimeout(() => {
            if (response && response.success) {
              navigation.replace('ReferenceSearchResults', {
                recommendedArtists: response.recommended_artists || [],
                selectedImage: selectedImage
              });
            } else {
              Alert.alert('Search Failed', 'Could not retrieve artist recommendations.');
              navigation.goBack();
            }
          }, 600); // Short delay before navigating so they see the final checkmark
        }
      } catch (error) {
        if (isMounted) {
          console.error('[AnalyzingScreen] Error recommending artists:', error);
          Alert.alert('Server Error', error.message || 'An error occurred during search.');
          navigation.goBack();
        }
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [selectedImage]);

  const renderStep = (text, icon, stepIndex) => {
    const isCompleted = stepsCompleted >= stepIndex;
    const isCurrent = stepsCompleted === stepIndex - 1;

    return (
      <View style={styles.stepRow}>
        <View style={styles.stepIconContainer}>
          <Ionicons name={icon} size={18} color="#FF4F87" />
        </View>
        <Text style={[styles.stepText, isCurrent && styles.stepTextActive]}>{text}</Text>
        <View style={styles.stepStatus}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={20} color="#FF4F87" />
          ) : isCurrent ? (
            <Animated.View style={{ transform: [{ rotate: pulseAnim1.interpolate({ inputRange: [1, 1.2], outputRange: ['0deg', '360deg'] }) }] }}>
              <Ionicons name="scan-outline" size={20} color="#FF4F87" />
            </Animated.View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <ScreenHeader title="Analyzing Look" onBack={() => navigation.goBack()} />

      <View style={styles.mainContainer}>
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.pulseRing, styles.pulseRingOuter, { transform: [{ scale: pulseAnim2 }], opacity: pulseAnim2.interpolate({ inputRange: [1, 1.2], outputRange: [0.6, 0] }) }]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRingInner, { transform: [{ scale: pulseAnim1 }], opacity: pulseAnim1.interpolate({ inputRange: [1, 1.2], outputRange: [0.8, 0] }) }]} />
          
          <View style={styles.imageContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.uploadedImage} />
            ) : null}
          </View>
        </View>

        <Text style={styles.analyzingText}>Analyzing your reference look...</Text>

        <View style={styles.stepsContainer}>
          {renderStep("Detecting face & key features", "scan-outline", 1)}
          <View style={styles.stepDivider} />
          {renderStep("Analyzing makeup style", "color-palette-outline", 2)}
          <View style={styles.stepDivider} />
          {renderStep("Extracting colors & tones", "color-filter-outline", 3)}
          <View style={styles.stepDivider} />
          {renderStep("Finding best matching artists", "search-outline", 4)}
        </View>

        <View style={styles.bottomCard}>
          <Ionicons name="sparkles" size={20} color="#FF4F87" style={styles.bottomCardIcon} />
          <View>
            <Text style={styles.bottomCardTextBold}>This may take a few seconds.</Text>
            <Text style={styles.bottomCardText}>Please don't close the app.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReferenceAnalyzingScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  animationContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#FF4F87',
  },
  pulseRingInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  pulseRingOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 40,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#333',
    fontWeight: '700',
  },
  stepStatus: {
    width: 24,
    alignItems: 'center',
  },
  stepDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F5F5F7',
    marginVertical: 12,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 'auto',
    marginBottom: 24,
  },
  bottomCardIcon: {
    marginRight: 12,
  },
  bottomCardTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  bottomCardText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

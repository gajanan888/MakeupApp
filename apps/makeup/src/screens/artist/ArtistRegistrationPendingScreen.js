import React, { useEffect, useState, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { getArtistProfile } from '../../api/auth';

const CompleteProfileScreen = ({navigation}) => {
  const { data, loadProfileData } = useArtistRegistration();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out and exit profile completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userRole');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (err) {
              console.warn('Failed to log out:', err);
            }
          }
        }
      ]
    );
  };

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await getArtistProfile();
      if (profile) {
        loadProfileData(profile);
      }
    } catch (error) {
      console.warn('Failed to load profile details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadProfileData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfile();
    });
    return unsubscribe;
  }, [navigation, fetchProfile]);

  // Compute status for steps dynamically
  const step1Completed = true; // Account verification is done since they verified OTP and created account
  
  const step2Completed = !!(
    data.profile?.profileImage &&
    data.profile?.gender &&
    data.profile?.bio &&
    data.profile?.location &&
    data.profile?.experience
  );

  const step3Completed = !!(data.specializations && data.specializations.length > 0);

  const step4Completed = !!(data.services && data.services.length > 0);

  const step5Completed = !!(data.portfolio && data.portfolio.length > 0);

  const step6Completed = !!(
    data.payment?.upiId ||
    (data.payment?.accountNumber && data.payment?.ifscCode)
  );

  const PROFILE_STEPS = [
    {
      id: 1,
      title: 'Account Verification',
      subtitle: 'Mobile & Email Verified',
      completed: step1Completed,
      screen: null,
    },
    {
      id: 2,
      title: 'Complete Profile',
      subtitle: 'Name, Bio, Gender, Location',
      completed: step2Completed,
      screen: 'ArtistRegister2',
    },
    {
      id: 3,
      title: 'Select Specializations',
      subtitle: 'Makeup Categories Selected',
      completed: step3Completed,
      screen: 'ArtistRegister3',
    },
    {
      id: 4,
      title: 'Add Services',
      subtitle: 'Add your services and rates',
      completed: step4Completed,
      screen: 'ArtistRegister4',
    },
    {
      id: 5,
      title: 'Add Portfolio',
      subtitle: 'Upload before & after images',
      completed: step5Completed,
      screen: 'ArtistRegister5',
    },
    {
      id: 6,
      title: 'Payment Details',
      subtitle: 'Add UPI / Bank details',
      completed: step6Completed,
      screen: 'ArtistRegister6',
    },
  ];

  const completedCount = PROFILE_STEPS.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / PROFILE_STEPS.length) * 100);

  const handleStepComplete = (screen) => {
    if (screen) {
      navigation.navigate(screen, { fromPending: true });
    }
  };

  const handleContinue = () => {
    if (!step2Completed) {
      navigation.navigate('ArtistRegister2', { fromPending: true });
    } else if (!step3Completed) {
      navigation.navigate('ArtistRegister3', { fromPending: true });
    } else if (!step4Completed) {
      navigation.navigate('ArtistRegister4', { fromPending: true });
    } else if (!step5Completed) {
      navigation.navigate('ArtistRegister5', { fromPending: true });
    } else if (!step6Completed) {
      navigation.navigate('ArtistRegister6', { fromPending: true });
    } else {
      navigation.navigate('ArtistRegisterSummary');
    }
  };

  const remainingSteps = PROFILE_STEPS.filter(item => !item.completed).length;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {isLoading && completedCount === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#FF4F8F" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? 40 : 25,
          }}>
          {/* HEADER IMAGE BACKGROUND */}
          <View style={styles.headerContainer}>
            <ImageBackground
              source={{
                uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600',
              }}
              style={styles.headerBackground}
              resizeMode="cover"
            >
              {/* Fade overlay at the bottom */}
              <View style={styles.fadeContainer}>
                {[...Array(10)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 8,
                      backgroundColor: '#F7F7F7',
                      opacity: i / 9,
                    }}
                  />
                ))}
              </View>
            </ImageBackground>

            {/* Floating Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          {/* AVATAR */}
          <View style={styles.avatarContainer}>
            <Image
              source={
                data.profile?.profileImage
                  ? { uri: data.profile.profileImage }
                  : {
                      uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
                    }
              }
              style={styles.avatarImage}
            />
          </View>

          {/* GREETING */}
          <View style={styles.greetingContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {data.basic?.name || 'Glam Artist'}! 👋
            </Text>
            <Text style={styles.subtitleText}>
              Let's set up your profile and start getting booked.
            </Text>
          </View>

          {/* STEPS CARD */}
          <View style={styles.stepsCard}>
            {PROFILE_STEPS.map((step, index) => {
              const isLast = index === PROFILE_STEPS.length - 1;
              return (
                <View key={step.id}>
                  <TouchableOpacity
                    style={styles.stepRow}
                    onPress={() => handleStepComplete(step.screen)}
                    disabled={!step.screen}
                  >
                    <View style={styles.stepLeft}>
                      {step.completed ? (
                        <View style={styles.completedCircle}>
                          <Ionicons name="checkmark" size={18} color="#FFF" />
                        </View>
                      ) : (
                        <View style={styles.pendingCircle}>
                          <Text style={styles.pendingNumber}>{step.id}</Text>
                        </View>
                      )}
                      
                      <View style={styles.textContainer}>
                        <Text style={[
                          styles.stepTitle,
                          step.completed ? styles.completedTitle : styles.pendingTitle
                        ]}>
                          {step.title}
                        </Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={step.completed ? '#32C766' : '#B7A9A1'}
                    />
                  </TouchableOpacity>
                  {!isLast && <View style={styles.rowDivider} />}
                </View>
              );
            })}
          </View>

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.continueButton}
          >
            <Text style={styles.buttonText}>
              {remainingSteps === 0 ? 'Get Started' : 'Continue Registration'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default CompleteProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  headerContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },

  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },

  fadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  avatarContainer: {
    alignSelf: 'center',
    marginTop: -60,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  greetingContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    fontFamily: 'serif',
  },

  subtitleText: {
    fontSize: 15,
    color: '#6F625D',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'serif',
    marginTop: 8,
  },

  stepsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFD1E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },

  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  completedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#32C766',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pendingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  pendingNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#777',
    fontFamily: 'serif',
  },

  textContainer: {
    marginLeft: 14,
    flex: 1,
  },

  stepTitle: {
    fontSize: 16,
    fontFamily: 'serif',
  },

  completedTitle: {
    fontWeight: '700',
    color: '#111',
  },

  pendingTitle: {
    fontWeight: '600',
    color: '#8A7D77',
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#FFE4ED',
    marginHorizontal: 20,
  },

  continueButton: {
    backgroundColor: '#FF4F8F',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'serif',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
import React, { useEffect, useState, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { getArtistProfile } from '../../api/auth';

const CompleteProfileScreen = ({navigation}) => {
  const { data, loadProfileData } = useArtistRegistration();
  const [isLoading, setIsLoading] = useState(false);

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
      title: 'Basic Information',
      subtitle: 'Name, Bio, Gender, Location',
      completed: step2Completed,
      screen: 'ArtistRegister2',
    },
    {
      id: 3,
      title: 'Specializations',
      subtitle: 'Makeup Categories Selected',
      completed: step3Completed,
      screen: 'ArtistRegister3',
    },
    {
      id: 4,
      title: 'Services & Pricing',
      subtitle: 'Add your services and rates',
      completed: step4Completed,
      screen: 'ArtistRegister4',
    },
    {
      id: 5,
      title: 'Portfolio Upload',
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#F7F7F7"
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
            paddingBottom: 40,
          }}>
          {/* HEADER CARD */}

          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>
              Complete Your Profile
            </Text>

            <Text style={styles.headerSubtitle}>
              You're almost ready to start
              receiving bookings
            </Text>

            <Text style={styles.percentText}>
              {percentage}% Complete
            </Text>

            {/* PROGRESS BAR */}

            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* STEPS */}

          {PROFILE_STEPS.map(step => (
            <View
              key={step.id}
              style={styles.stepCard}>
              <View style={styles.leftSection}>
                {step.completed ? (
                  <View
                    style={styles.completedIcon}>
                    <Icon
                      name="check"
                      size={18}
                      color="#FFF"
                    />
                  </View>
                ) : (
                  <View
                    style={styles.pendingIcon}>
                    <Icon
                      name="clock"
                      size={16}
                      color="#FF4F8F"
                    />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.stepTitle}>
                    {step.title}
                  </Text>

                  <Text
                    style={
                      styles.stepSubtitle
                    }>
                    {step.subtitle}
                  </Text>
                </View>
              </View>

              {!step.completed && (
                <TouchableOpacity
                  style={
                    styles.completeButton
                  }
                  onPress={() => handleStepComplete(step.screen)}>
                  <Text
                    style={
                      styles.completeText
                    }>
                    Complete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* REMAINING */}

          {remainingSteps > 0 && (
            <View style={styles.infoCard}>
              <Icon
                name="alert-circle"
                size={22}
                color="#FF4F8F"
              />

              <Text style={styles.infoText}>
                {remainingSteps} step{remainingSteps > 1 ? 's' : ''} remaining before you
                can start accepting bookings.
              </Text>
            </View>
          )}

          {/* CONTINUE BUTTON */}

          <TouchableOpacity onPress={handleContinue} 
            style={styles.continueButton}>
            <Text style={styles.buttonText}>
              {remainingSteps === 0 ? 'Review & Submit' : 'Continue Registration'}
            </Text>

            <Icon
              name="arrow-right"
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CompleteProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'android'
        ? 20
        : 10,
  },

  headerCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 30,
    padding: 25,
    marginTop: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  headerSubtitle: {
    marginTop: 8,
    color: '#6F625D',
    fontSize: 15,
    lineHeight: 22,
  },

  percentText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4F8F',
  },

  progressBg: {
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: 12,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FF4F8F',
  },

  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F3E1E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  completedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#32C766',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  stepSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#8A7D77',
  },

  completeButton: {
    backgroundColor: '#FF4F8F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  completeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  infoCard: {
    marginTop: 24,
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F3E1E8',
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#6F625D',
    lineHeight: 22,
  },

  continueButton: {
    marginTop: 30,
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
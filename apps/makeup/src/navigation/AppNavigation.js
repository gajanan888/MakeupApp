import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getArtistProfile } from '../api/auth';

import OnboardingScreen from '../screens/common/OnboardingScreen';
import RoleSelectionScreen from '../screens/common/RoleSelectionScreen';
import ClientLoginScreen from '../screens/client/ClientLoginScreen';
import ArtistLoginScreen from '../screens/artist/ArtistLoginScreen';
import ArtistRegisterScreen1 from '../screens/artist/ArtistRegisterScreen1';
import ArtistRegisterScreen2 from '../screens/artist/ArtistRegisterScreen2';
import ArtistRegisterScreen3 from '../screens/artist/ArtistRegisterScreen3';
import ArtistRegisterScreen4 from '../screens/artist/ArtistRegisterScreen4';
import ArtistRegisterScreen5 from '../screens/artist/ArtistRegisterScreen5';
import ArtistRegisterScreen6 from '../screens/artist/ArtistRegisterScreen6';
import ArtistRegisterSummaryScreen from '../screens/artist/ArtistRegisterSummaryScreen';
import ArtistOTPVerificationScreen from '../screens/artist/ArtistOTPVerificationScreen';
import ArtistRegistrationPendingScreen from '../screens/artist/ArtistRegistrationPendingScreen';
import ArtistHomeScreen from '../screens/artist/ArtistHomeScreen';
import ClientRegisterScreen from '../screens/client/ClientRegisterScreen';
import ClientOTPVerificationScreen from '../screens/client/ClientOTPVerificationScreen';
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import OtpVerificationScreen from '../screens/common/OtpVerificationScreen';
import CreateNewPasswordScreen from '../screens/common/CreateNewPasswordScreen';
import SearchScreen from '../screens/client/SearchScreen';
import ArtistDetailsScreen from '../screens/client/ArtistDetailsScreen';
import BookAppointmentScreen from '../screens/client/BookAppointmentScreen';
import CustomerBookingsScreen from '../screens/client/CustomerBookingsScreen';
import ArtistMessageScreen from '../screens/artist/ArtistMessageScreen';
import CustomerMessageScreen from '../screens/client/CustomerMessageScreen';
import ProfileScreen from '../screens/client/ProfileScreen';
import AIMatchScreen from '../screens/client/AIMatchScreen';
import FaceScanScreen from '../screens/client/FaceScanScreen';
import FaceScanScanningScreen from '../screens/client/FaceScanScanningScreen';
import FaceScanAnalyzingScreen from '../screens/client/FaceScanAnalyzingScreen';
import FaceScanResultScreen from '../screens/client/FaceScanResultScreen';
import FaceScanRecommendationsScreen from '../screens/client/FaceScanRecommendationsScreen';
import LookDetailsScreen from '../screens/client/LookDetailsScreen';
import TryThisLookScreen from '../screens/client/TryThisLookScreen';
import BookLookArtistScreen from '../screens/client/BookLookArtistScreen';
import SelectDateTimeScreen from '../screens/client/SelectDateTimeScreen';
import AddOnsScreen from '../screens/client/AddOnsScreen';
import BookingConfirmationScreen from '../screens/client/BookingConfirmationScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import BookingSuccessScreen from '../screens/client/BookingSuccessScreen';
import SelectLocationScreen from '../screens/client/SelectLocationScreen';
import ArtistsListByLocationScreen from '../screens/client/ArtistsListByLocationScreen';
import EnterBookingAddressScreen from '../screens/client/EnterBookingAddressScreen';
import ClientNotificationScreen from '../screens/client/ClientNotificationScreen';
import ArtistNotificationScreen from '../screens/artist/ArtistNotificationScreen';
import VirtualPreviewChatScreen from '../screens/client/VirtualPreviewChatScreen';
import VirtualPreviewResultScreen from '../screens/client/VirtualPreviewResultScreen';
import VirtualTryOnScreen from '../screens/client/VirtualTryOnScreen';
import ReferenceImageSearchScreen from '../screens/client/ReferenceImageSearchScreen';
import ReferenceSearchResultsScreen from '../screens/client/ReferenceSearchResultsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('Onboarding');

  React.useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');

        if (token) {
          if (role === 'artist') {
            try {
              const profileData = await getArtistProfile();
              if (profileData) {
                const hasProfile = profileData.profile && 
                                   profileData.profile.profileImage && 
                                   profileData.profile.gender && 
                                   profileData.profile.bio && 
                                   profileData.profile.location && 
                                   profileData.profile.experience;

                const hasSpecializations = profileData.specializations && profileData.specializations.length > 0;
                const hasServices = profileData.services && profileData.services.length > 0;
                const hasPortfolio = profileData.portfolio && profileData.portfolio.length > 0;
                const hasPayment = profileData.payment && 
                                  (profileData.payment.upiId || 
                                   (profileData.payment.accountNumber && profileData.payment.ifscCode));

                const isComplete = hasProfile && hasSpecializations && hasServices && hasPortfolio && hasPayment;

                if (isComplete) {
                  setInitialRoute('ArtistHome');
                } else {
                  setInitialRoute('ArtistRegistrationPending');
                }
              } else {
                setInitialRoute('ArtistRegistrationPending');
              }
            } catch (err) {
              console.warn('Failed to fetch profile on startup, clearing token:', err);
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userRole');
              setInitialRoute('Onboarding');
            }
          } else if (role === 'client') {
            setInitialRoute('ClientHome');
          }
        }
      } catch (e) {
        console.error('Error checking login status:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCFCFC' }}>
        <ActivityIndicator size="large" color="#FF4F87" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />

        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

        <Stack.Screen name="ClientLogin" component={ClientLoginScreen} />

        <Stack.Screen name="ArtistLogin" component={ArtistLoginScreen} />

        <Stack.Screen name="ClientRegister" component={ClientRegisterScreen} />
        <Stack.Screen name="ClientOTPVerification" component={ClientOTPVerificationScreen} />

        <Stack.Screen name="ClientHome" component={ClientHomeScreen} />

        <Stack.Screen
          name="ArtistRegister1"
          component={ArtistRegisterScreen1}
        />

        <Stack.Screen
          name="ArtistRegister2"
          component={ArtistRegisterScreen2}
        />

        <Stack.Screen
          name="ArtistRegister3"
          component={ArtistRegisterScreen3}
        />

        <Stack.Screen
          name="ArtistRegister4"
          component={ArtistRegisterScreen4}
        />

        <Stack.Screen
          name="ArtistRegister5"
          component={ArtistRegisterScreen5}
        />

        <Stack.Screen
          name="ArtistRegister6"
          component={ArtistRegisterScreen6}
        />

        <Stack.Screen
          name="ArtistRegisterSummary"
          component={ArtistRegisterSummaryScreen}
        />

        <Stack.Screen
          name="ArtistOTPVerification"
          component={ArtistOTPVerificationScreen}
        />

        <Stack.Screen
          name="ArtistRegistrationPending"
          component={ArtistRegistrationPendingScreen}
        />

        <Stack.Screen name="ArtistHome" component={ArtistHomeScreen} />

        <Stack.Screen name="ArtistMessage" component={ArtistMessageScreen} />

        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
        />

        <Stack.Screen
          name="CreateNewPassword"
          component={CreateNewPasswordScreen}
        />

        <Stack.Screen name="Search" component={SearchScreen} />

        <Stack.Screen name="ArtistDetails" component={ArtistDetailsScreen} />

        <Stack.Screen
          name="BookAppointment"
          component={BookAppointmentScreen}
        />

        <Stack.Screen
          name="CustomerBookings"
          component={CustomerBookingsScreen}
        />
        <Stack.Screen
          name="CustomerMessage"
          component={CustomerMessageScreen}
        />
        <Stack.Screen name="CustomerProfile" component={ProfileScreen} />
        <Stack.Screen name="AIMatch" component={AIMatchScreen} />
        <Stack.Screen name="FaceScan" component={FaceScanScreen} />
        <Stack.Screen
          name="FaceScanScanning"
          component={FaceScanScanningScreen}
        />
        <Stack.Screen
          name="FaceScanAnalyzing"
          component={FaceScanAnalyzingScreen}
        />
        <Stack.Screen name="FaceScanResult" component={FaceScanResultScreen} />
        <Stack.Screen
          name="FaceScanRecommendations"
          component={FaceScanRecommendationsScreen}
        />
        <Stack.Screen name="LookDetails" component={LookDetailsScreen} />
        <Stack.Screen name="TryThisLook" component={TryThisLookScreen} />
        <Stack.Screen name="BookLookArtist" component={BookLookArtistScreen} />
        <Stack.Screen name="SelectDateTime" component={SelectDateTimeScreen} />
        <Stack.Screen name="AddOns" component={AddOnsScreen} />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
        />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
        <Stack.Screen name="SelectLocation" component={SelectLocationScreen} />
        <Stack.Screen name="ArtistsListByLocation" component={ArtistsListByLocationScreen} />
        <Stack.Screen name="EnterBookingAddress" component={EnterBookingAddressScreen} />
        <Stack.Screen name="ClientNotification" component={ClientNotificationScreen} />
        <Stack.Screen name="ArtistNotification" component={ArtistNotificationScreen} />
        <Stack.Screen name="VirtualPreviewChat" component={VirtualPreviewChatScreen} />
        <Stack.Screen name="VirtualPreviewResult" component={VirtualPreviewResultScreen} />
        <Stack.Screen name="VirtualTryOn" component={VirtualTryOnScreen} />
        <Stack.Screen name="ReferenceImageSearch" component={ReferenceImageSearchScreen} />
        <Stack.Screen name="ReferenceSearchResults" component={ReferenceSearchResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

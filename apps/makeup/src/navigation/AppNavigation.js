import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
import ClientRegisterScreen from '../screens/client/ClientRegisterScreen';
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import ForgotPasswordScreen from '../screens/common/ForgotPasswordScreen';
import OtpVerificationScreen from '../screens/common/OtpVerificationScreen';
import CreateNewPasswordScreen from '../screens/common/CreateNewPasswordScreen';
import SearchScreen from '../screens/client/SearchScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
        />

        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
        />

        <Stack.Screen
          name="ClientLogin"
          component={ClientLoginScreen}
        />

        <Stack.Screen
          name="ArtistLogin"
          component={ArtistLoginScreen}
        />
        <Stack.Screen
          name="ClientRegister"
          component={ClientRegisterScreen}
        />

        <Stack.Screen
        name="ClientHome"
        component={ClientHomeScreen}
      />
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
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
        />

        <Stack.Screen
          name="CreateNewPassword"
          component={CreateNewPasswordScreen}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
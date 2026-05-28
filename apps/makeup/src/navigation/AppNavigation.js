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
import ArtistOTPVerificationScreen from '../screens/artist/ArtistOTPVerificationScreen';
import ClientRegisterScreen from '../screens/client/ClientRegisterScreen';
import ClientHomeScreen from '../screens/client/ClientHomeScreen';

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
        name="ArtistOTPVerification"
        component={ArtistOTPVerificationScreen}
      />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
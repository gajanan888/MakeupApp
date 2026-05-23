import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/common/OnboardingScreen';
import RoleSelectionScreen from '../screens/common/RoleSelectionScreen';
import ClientLoginScreen from '../screens/client/ClientLoginScreen';
import ArtistLoginScreen from '../screens/artist/ArtistLoginScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
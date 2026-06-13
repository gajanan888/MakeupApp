import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigation';
import { ArtistRegistrationProvider } from './src/context/ArtistRegistrationContext';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff7f8" />
      <ArtistRegistrationProvider>
        <AppNavigator />
      </ArtistRegistrationProvider>
    </SafeAreaProvider>
  );
}

export default App;

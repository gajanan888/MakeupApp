import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigation';
import { ArtistRegistrationProvider } from './src/context/ArtistRegistrationContext';
import { CallProvider } from './src/context/CallContext';
import CallOverlay from './src/components/call/CallOverlay';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff7f8" />
      <ArtistRegistrationProvider>
        <CallProvider>
          <AppNavigator />
          <CallOverlay />
        </CallProvider>
      </ArtistRegistrationProvider>
    </SafeAreaProvider>
  );
}

export default App;

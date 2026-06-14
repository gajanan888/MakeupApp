import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  BackHandler,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ArtistDashboardScreen from './ArtistDashboardScreen';
import ArtistBookingScreen from './ArtistBookingScreen';
import ArtistCalenderScreen from './ArtistCalenderScreen';
import ArtistEarningScreen from './ArtistEarningScreen';
import ArtistProfileScreen from './ArtistProfileScreen';

const PlaceholderScreen = ({ name }) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="construct-outline" size={48} color="#FF4F8F" />
    <Text style={styles.placeholderTitle}>{name} Screen</Text>
    <Text style={styles.placeholderSubtitle}>This screen is currently empty to show tab switching.</Text>
  </View>
);

const ArtistHomeScreen = () => {
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const backAction = () => {
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <ArtistDashboardScreen />;
      case 'Bookings':
        return <ArtistBookingScreen onBack={() => setActiveTab('Home')} />;
      case 'Calendar':
        return <ArtistCalenderScreen onBack={() => setActiveTab('Home')} />;
      case 'Earnings':
        return <ArtistEarningScreen />;
      case 'Profile':
        return <ArtistProfileScreen onBack={() => setActiveTab('Home')} />;
      default:
        return <ArtistDashboardScreen />;
    }
  };

  const tabs = [
    { id: 'Home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { id: 'Bookings', label: 'Bookings', activeIcon: 'clipboard', inactiveIcon: 'clipboard-outline' },
    { id: 'Calendar', label: 'Calendar', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
    { id: 'Earnings', label: 'Earnings', activeIcon: 'wallet', inactiveIcon: 'wallet-outline' },
    { id: 'Profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={22}
                  color={isActive ? '#FF4F8F' : '#8A7D77'}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isActive ? '#FF4F8F' : '#8A7D77' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ArtistHomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },

  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },

  contentContainer: {
    flex: 1,
  },

  tabBar: {
    height: Platform.OS === 'ios' ? 65 : 60,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0E6EA',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'serif',
  },

  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 40,
  },

  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginTop: 15,
    fontFamily: 'serif',
  },

  placeholderSubtitle: {
    fontSize: 14,
    color: '#8A7D77',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'serif',
  },
});
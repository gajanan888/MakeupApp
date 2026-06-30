import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
  Keyboard,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import ClientDashboardScreen from './ClientDashboardScreen';
import SearchScreen from './SearchScreen';
import CustomerBookingsScreen from './CustomerBookingsScreen';
import CustomerMessageScreen from './CustomerMessageScreen';
import ProfileScreen from './ProfileScreen';

const ClientHomeScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [activeTabParams, setActiveTabParams] = useState(null);
  const [visitedTabs, setVisitedTabs] = useState({ Home: true });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleNavigate = (tabId, params = null) => {
    setActiveTab(tabId);
    setActiveTabParams(params);
    setVisitedTabs(prev => ({ ...prev, [tabId]: true }));
  };

  useEffect(() => {
    const backAction = () => {
      if (!navigation.isFocused()) {
        return false;
      }
      if (activeTab !== 'Home') {
        handleNavigate('Home', null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [activeTab, navigation]);

  useEffect(() => {
    if (route.params?.activeTab) {
      handleNavigate(route.params.activeTab);
      navigation.setParams({ activeTab: null });
    }
  }, [route.params?.activeTab, navigation]);

  const tabs = [
    { id: 'Home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { id: 'Search', label: 'Search', activeIcon: 'search', inactiveIcon: 'search-outline' },
    { id: 'Bookings', label: 'Bookings', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
    { id: 'Chat', label: 'Chat', activeIcon: 'chatbubble-ellipses', inactiveIcon: 'chatbubble-ellipses-outline' },
    { id: 'Profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          <View style={{ flex: 1, display: activeTab === 'Home' ? 'flex' : 'none' }}>
            <ClientDashboardScreen navigation={navigation} onNavigate={handleNavigate} />
          </View>
          {visitedTabs.Search && (
            <View style={{ flex: 1, display: activeTab === 'Search' ? 'flex' : 'none' }}>
              <SearchScreen navigation={navigation} isTab={true} route={{ params: activeTabParams }} />
            </View>
          )}
          {visitedTabs.Bookings && (
            <View style={{ flex: 1, display: activeTab === 'Bookings' ? 'flex' : 'none' }}>
              <CustomerBookingsScreen navigation={navigation} isTab={true} />
            </View>
          )}
          {visitedTabs.Chat && (
            <View style={{ flex: 1, display: activeTab === 'Chat' ? 'flex' : 'none' }}>
              <CustomerMessageScreen navigation={navigation} isTab={true} activeTab={activeTab} />
            </View>
          )}
          {visitedTabs.Profile && (
            <View style={{ flex: 1, display: activeTab === 'Profile' ? 'flex' : 'none' }}>
              <ProfileScreen navigation={navigation} isTab={true} />
            </View>
          )}
        </View>

        {/* Bottom Tab Bar */}
        {!isKeyboardVisible && (
          <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8, height: 56 + (insets.bottom || 8) }]}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabItem}
                  onPress={() => handleNavigate(tab.id, null)}
                >
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.inactiveIcon}
                    size={22}
                    color={isActive ? '#FF4F87' : '#999'}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isActive ? '#FF4F87' : '#999' }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ClientHomeScreen;

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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === 'ios' ? 65 : 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    elevation: 10,
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
  },
});

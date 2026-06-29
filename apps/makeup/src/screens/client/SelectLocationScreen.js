import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Geolocation from '@react-native-community/geolocation';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOCATIONIQ_KEY = 'pk.a74ba553bc5de1a0d26527268257f8d4';

const SelectLocationScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find nearby artists.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleCurrentLocation = async () => {
    setLoadingGPS(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      alert('Location permission denied.');
      setLoadingGPS(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.state || '';
            if (city) {
              setLoadingGPS(false);
              navigation.navigate('ArtistsListByLocation', { location: city });
            } else {
              alert('Could not determine city name from current location.');
            }
          } else {
            alert('Location details not found.');
          }
        } catch (error) {
          console.error(error);
          alert('Failed to resolve current location city.');
        } finally {
          setLoadingGPS(false);
        }
      },
      (error) => {
        console.error(error);
        alert('Failed to get GPS location. Make sure location service is enabled.');
        setLoadingGPS(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchSuggestions = async (text) => {
    setSearchText(text);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        const parsed = data
          .map((item) => {
            const addr = item.address;
            if (!addr) return null;
            const city = addr.city || addr.town || addr.village || '';
            const state = addr.state || '';
            const country = addr.country || '';
            if (!city) return null;
            return {
              display: `${city}, ${state ? state + ', ' : ''}${country}`,
              city,
            };
          })
          .filter((item) => item !== null);

        const unique = [];
        const seen = new Set();
        for (const item of parsed) {
          if (!seen.has(item.city.toLowerCase())) {
            seen.add(item.city.toLowerCase());
            unique.push(item);
          }
        }
        setSuggestions(unique);
      }
    } catch (err) {
      console.warn('LocationIQ search error:', err?.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchText(item.display);
    setSuggestions([]);
    navigation.navigate('ArtistsListByLocation', { location: item.city });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Booking Location</Text>
      </View>

      <View style={styles.content}>
        {/* GPS Button */}
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleCurrentLocation}
          disabled={loadingGPS}
        >
          {loadingGPS ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.gpsButtonText}>Choose Current Location</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Input */}
        <Text style={styles.inputLabel}>Search Manual Location</Text>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter city name..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={fetchSuggestions}
          />
          {loadingSuggestions && (
            <ActivityIndicator color="#FF4F87" size="small" style={styles.loadingIndicator} />
          )}
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.city}-${index}`}
            style={styles.suggestionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{item.display}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default SelectLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  gpsButton: {
    backgroundColor: '#FF4F87',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    maxHeight: 250,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
});

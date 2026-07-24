import React, { useState, useEffect } from 'react';
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
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Geolocation from '@react-native-community/geolocation';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedAddresses, saveAddresses, deleteSavedAddress } from '../../utils/addressStorage';

const LOCATIONIQ_KEY = 'pk.a74ba553bc5de1a0d26527268257f8d4';

const SelectLocationScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressName, setNewAddressName] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCitySuggestions, setLoadingCitySuggestions] = useState(false);
  const [newAddressPinCode, setNewAddressPinCode] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newAddressPhone, setNewAddressPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(true);
  const [currentAddressString, setCurrentAddressString] = useState('');
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const addresses = await getSavedAddresses();
      setSavedAddresses(addresses);
    } catch (err) {
      console.warn('Failed to load saved addresses:', err);
    }
  };

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
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.state || '';
            const displayAddress = data.display_name || 
              `${addr.road || ''}, ${addr.suburb || ''}, ${city}, ${addr.postcode || ''}, India`;
            
            setCurrentAddressString(displayAddress);

            if (city) {
              setLoadingGPS(false);
              setTimeout(async () => {
                try {
                  await AsyncStorage.setItem('detectedCity', city);
                  await AsyncStorage.setItem('detectedLocationName', city);
                } catch (err) {
                  console.warn(err);
                }
                if (route.params?.fromDashboard) {
                  navigation.goBack();
                } else {
                  navigation.navigate('ArtistsListByLocation', { location: city });
                }
              }, 1200);
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

  const fetchCitySuggestions = async (text) => {
    setNewAddressCity(text);
    if (text.trim().length < 3) {
      setCitySuggestions([]);
      return;
    }
    setLoadingCitySuggestions(true);
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
        setCitySuggestions(unique);
      }
    } catch (err) {
      console.warn('City autocomplete error:', err?.message);
    } finally {
      setLoadingCitySuggestions(false);
    }
  };

  const handleSelectCitySuggestion = (item) => {
    setNewAddressCity(item.city);
    setCitySuggestions([]);
  };

  const handleSelectSuggestion = async (item) => {
    setSearchText(item.display);
    setSuggestions([]);
    try {
      await AsyncStorage.setItem('detectedCity', item.city);
      await AsyncStorage.setItem('detectedLocationName', item.city);
    } catch (err) {
      console.warn(err);
    }
    if (route.params?.fromDashboard) {
      navigation.goBack();
    } else {
      navigation.navigate('ArtistsListByLocation', { location: item.city });
    }
  };




  const handleCloseModal = () => {
    setNewAddressName('');
    setNewAddressCity('');
    setNewAddressPinCode('');
    setNewAddressLine('');
    setNewAddressPhone('');
    setCitySuggestions([]);
    setEditingAddressId(null);
    setShowAddAddressModal(false);
  };

  const handleEditAddress = (address) => {
    setEditingAddressId(address.id);
    setNewAddressName(address.name || '');
    setNewAddressPhone(address.phone || '');
    setNewAddressLabel(address.label || 'Home');
    setNewAddressCity(address.city || '');
    setNewAddressPinCode(address.pinCode || '');
    // If rawLine is not present, parse address line before the city comma
    let rawAddressLine = address.rawLine;
    if (!rawAddressLine && address.addressLine) {
      const idx = address.addressLine.indexOf(',' + (address.city || ''));
      if (idx !== -1) {
        rawAddressLine = address.addressLine.substring(0, idx);
      } else {
        rawAddressLine = address.addressLine;
      }
    }
    setNewAddressLine(rawAddressLine || '');
    setShowAddAddressModal(true);
  };

  const handleDeleteAddress = (address) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await deleteSavedAddress(address.id);
              setSavedAddresses(updated);
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', 'Failed to delete address.');
            }
          },
        },
      ]
    );
  };

  const handleAddAddress = async () => {
    if (!newAddressName.trim()) {
      Alert.alert('Required Field', 'Please enter recipient name.');
      return;
    }
    if (!newAddressCity.trim()) {
      Alert.alert('Required Field', 'Please search and select a city.');
      return;
    }
    if (!newAddressPinCode.trim() || newAddressPinCode.length !== 6 || isNaN(newAddressPinCode)) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN Code.');
      return;
    }
    if (!newAddressLine.trim()) {
      Alert.alert('Required Field', 'Please enter detailed address.');
      return;
    }
    if (!newAddressPhone.trim() || newAddressPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setSavingAddress(true);

      // Validate PIN Code matches selected City via LocationIQ
      let pinValid = false;
      try {
        const response = await fetch(
          `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(newAddressPinCode + ', India')}&format=json`
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const place = data[0];
          const displayName = (place.display_name || '').toLowerCase();
          const cityLower = newAddressCity.toLowerCase();
          if (displayName.includes(cityLower)) {
            pinValid = true;
          }
        }
      } catch (err) {
        console.warn('PIN Code validation API error:', err);
        // Fallback for network issues: skip strict check but log warning
        pinValid = true;
      }

      if (!pinValid) {
        Alert.alert(
          'Invalid PIN Code',
          `The PIN Code ${newAddressPinCode} does not belong to the selected city: ${newAddressCity}.`
        );
        setSavingAddress(false);
        return;
      }

      // Combine detailed address, city, and pin code
      const fullAddressLine = `${newAddressLine.trim()}, ${newAddressCity.trim()} - ${newAddressPinCode.trim()}`;

      let updated;
      if (editingAddressId) {
        // Edit existing address
        updated = savedAddresses.map((item) => {
          if (item.id === editingAddressId) {
            return {
              ...item,
              label: newAddressLabel,
              name: newAddressName.trim(),
              city: newAddressCity.trim(),
              pinCode: newAddressPinCode.trim(),
              rawLine: newAddressLine.trim(),
              addressLine: fullAddressLine,
              phone: newAddressPhone.trim(),
              iconBg: newAddressLabel === 'Home' ? '#E6FFED' : '#FFFBE6',
              iconColor: newAddressLabel === 'Home' ? '#389E0D' : '#D46B08',
            };
          }
          return item;
        });
      } else {
        // Add new address
        const newAddressObj = {
          id: `address-${Date.now()}`,
          label: newAddressLabel,
          name: newAddressName.trim(),
          city: newAddressCity.trim(),
          pinCode: newAddressPinCode.trim(),
          rawLine: newAddressLine.trim(),
          addressLine: fullAddressLine,
          phone: newAddressPhone.trim(),
          iconBg: newAddressLabel === 'Home' ? '#E6FFED' : '#FFFBE6',
          iconColor: newAddressLabel === 'Home' ? '#389E0D' : '#D46B08',
        };
        updated = [newAddressObj, ...savedAddresses];
      }

      await saveAddresses(updated);
      setSavedAddresses(updated);
      
      // Clear inputs
      setNewAddressName('');
      setNewAddressCity('');
      setNewAddressPinCode('');
      setNewAddressLine('');
      setNewAddressPhone('');
      setCitySuggestions([]);
      setEditingAddressId(null);
      setShowAddAddressModal(false);
      
      Alert.alert('Success', editingAddressId ? 'Address updated successfully.' : 'New address added successfully.');
    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSelectSavedAddress = async (address) => {
    let city = address.city;
    if (!city) {
      const addrText = address.addressLine.toLowerCase();
      city = 'Pune';
      const cities = ['pune', 'mumbai', 'delhi', 'bangalore', 'kolkata', 'chennai', 'hyderabad'];
      for (const c of cities) {
        if (addrText.includes(c)) {
          city = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }
    }

    try {
      await AsyncStorage.setItem('detectedCity', city);
      await AsyncStorage.setItem('detectedLocationName', city);
    } catch (err) {
      console.warn(err);
    }
    if (route.params?.fromDashboard) {
      navigation.goBack();
    } else {
      navigation.navigate('ArtistsListByLocation', { location: city });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select your location</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for city name"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={fetchSuggestions}
          />
          {loadingSuggestions && (
            <ActivityIndicator color="#FF4F87" size="small" style={styles.loadingIndicator} />
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Suggestion list overlays the content when active */}
        {suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.city}-${index}`}
            style={styles.suggestionsList}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Ionicons name="location-outline" size={18} color="#666" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{item.city}</Text>
                  <Text style={styles.suggestionSubtitle}>{item.display}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Actions Container Card */}
            <View style={styles.actionsCard}>
              {/* Use current location */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleCurrentLocation}
                disabled={loadingGPS}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FFEBF0' }]}>
                  <Ionicons name="locate" size={20} color="#FF4F87" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionTitle, { color: '#FF4F87' }]}>Use current location</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={2}>
                    {loadingGPS
                      ? 'Locating your current address...'
                      : currentAddressString || 'Tap to detect and resolve current location'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Add new address */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setShowAddAddressModal(true)}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#FFEBF0' }]}>
                  <Ionicons name="add" size={20} color="#FF4F87" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={[styles.actionTitle, { color: '#FF4F87' }]}>Add new address</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

             
              
            </View>


            {/* Saved Addresses Header */}
            <Text style={styles.savedHeader}>Your saved addresses</Text>

            {/* Saved Addresses List */}
            {savedAddresses.map((address) => {
              const isHome = address.label === 'Home';
              return (
                <TouchableOpacity
                  key={address.id}
                  style={styles.addressCard}
                  onPress={() => handleSelectSavedAddress(address)}
                >
                  <View style={styles.addressRow}>
                    {/* Left Icon Container */}
                    <View style={{ position: 'relative' }}>
                      <View
                        style={[
                          styles.addressIconBg,
                          { backgroundColor: address.iconBg || '#F5F5F5' },
                        ]}
                      >
                        <Ionicons
                          name={isHome ? 'home-outline' : 'briefcase-outline'}
                          size={22}
                          color={address.iconColor || '#666'}
                        />
                      </View>
                      {/* Here badge */}
                      {address.isHere && (
                        <View style={styles.hereBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#FF4F87" />
                        </View>
                      )}
                    </View>

                    {/* Middle Info Column */}
                    <View style={styles.addressInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.addressLabel}>{address.label}</Text>
                        {address.isHere && (
                          <Text style={styles.youreHereText}>You're here</Text>
                        )}
                        {address.distance && (
                          <Text style={styles.distanceBadge}>{address.distance}</Text>
                        )}
                      </View>
                      <Text style={styles.addressName}>{address.name}</Text>
                      <Text style={styles.addressDetails} numberOfLines={3}>
                        {address.addressLine}
                      </Text>
                      {address.phone && (
                        <Text style={styles.addressPhone}>Phone number: {address.phone}</Text>
                      )}
                    </View>

                    {/* Right Action Buttons */}
                    <View style={styles.addressRightActions}>
                      <TouchableOpacity
                        style={styles.addressActionBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={20} color="#FF4F87" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addressActionBtn, { marginTop: 16 }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Pinned actions row (only show for the active/first one matching screenshot design) */}
                  {address.isHere && (
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity style={styles.miniActionButton}>
                        <Ionicons name="ellipsis-horizontal" size={16} color="#FF4F87" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Name field */}
              <Text style={styles.modalLabel}>Recipient Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter Your Name"
                placeholderTextColor="#999"
                value={newAddressName}
                onChangeText={setNewAddressName}
              />

              {/* Label selector */}
              <Text style={styles.modalLabel}>Address Type</Text>
              <View style={styles.labelSelectorRow}>
                {['Home', 'Work', 'Other'].map((lbl) => (
                  <TouchableOpacity
                    key={lbl}
                    style={[
                      styles.labelSelectorBtn,
                      newAddressLabel === lbl && styles.labelSelectorBtnActive,
                    ]}
                    onPress={() => setNewAddressLabel(lbl)}
                  >
                    <Text
                      style={[
                        styles.labelSelectorText,
                        newAddressLabel === lbl && styles.labelSelectorTextActive,
                      ]}
                    >
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* City Input */}
              <Text style={styles.modalLabel}>City</Text>
              <View style={{ position: 'relative', zIndex: 999 }}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Search and select city (e.g. Pune)"
                  placeholderTextColor="#999"
                  value={newAddressCity}
                  onChangeText={fetchCitySuggestions}
                />
                {loadingCitySuggestions && (
                  <ActivityIndicator
                    size="small"
                    color="#FF4F87"
                    style={{ position: 'absolute', right: 12, top: 14 }}
                  />
                )}
                {citySuggestions.length > 0 && (
                  <View style={styles.citySuggestionsContainer}>
                    {citySuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.citySuggestionItem}
                        onPress={() => handleSelectCitySuggestion(item)}
                      >
                        <Ionicons name="location-sharp" size={14} color="#666" style={{ marginRight: 6 }} />
                        <Text style={styles.citySuggestionText}>{item.display}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* PIN Code Input */}
              <Text style={styles.modalLabel}>PIN Code</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter 6-digit PIN code"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={newAddressPinCode}
                onChangeText={(val) => setNewAddressPinCode(val.replace(/[^0-9]/g, ''))}
                maxLength={6}
              />

              {/* Address Line field */}
              <Text style={styles.modalLabel}>Detailed Address</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Flat/House No., Building, Street, Landmark, City..."
                placeholderTextColor="#999"
                value={newAddressLine}
                onChangeText={setNewAddressLine}
                multiline={true}
                numberOfLines={3}
              />

              {/* Phone Number field */}
              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={newAddressPhone}
                onChangeText={setNewAddressPhone}
                maxLength={10}
              />

              {/* Save trigger buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  onPress={handleAddAddress}
                  disabled={savingAddress}
                >
                  {savingAddress ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.modalBtnTextSave}>Save Address</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SelectLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Blinkit light grey background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  savedHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  hereBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  addressInfo: {
    flex: 1,
    marginRight: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  youreHereText: {
    fontSize: 11,
    color: '#FF4F87',
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: '#FFEBF0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceBadge: {
    fontSize: 10,
    color: '#D0255A',
    fontWeight: '600',
    marginLeft: 8,
    backgroundColor: '#FFF2F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFD3DE',
  },
  addressName: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 2,
  },
  addressDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  addressPhone: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  miniActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF2F5',
    borderWidth: 1,
    borderColor: '#FFD3DE',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  shareBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  shareBannerIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shareBannerText: {
    fontSize: 12,
    color: '#A31F48',
    fontWeight: '600',
    flex: 1,
  },
  suggestionsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  labelSelectorRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  labelSelectorBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
  },
  labelSelectorBtnActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFEBF0',
  },
  labelSelectorText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  labelSelectorTextActive: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  citySuggestionsContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 150,
    zIndex: 9999,
  },
  citySuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  citySuggestionText: {
    fontSize: 13,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalBtnCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalBtnSave: {
    backgroundColor: '#FF4F87',
  },
  modalBtnTextCancel: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnTextSave: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  addressRightActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  addressActionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
});

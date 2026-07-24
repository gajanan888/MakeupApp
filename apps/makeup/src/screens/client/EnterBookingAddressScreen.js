import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedAddresses, addSavedAddress } from '../../utils/addressStorage';
import ScreenHeader from '../../components/ScreenHeader';

const LOCATIONIQ_KEY = 'pk.a74ba553bc5de1a0d26527268257f8d4';

const EnterBookingAddressScreen = ({ navigation, route }) => {
  const { artist } = route.params;
  const artistCity = artist.profile?.location || 'Pune';

  const scrollRef = useRef(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressName, setAddressName] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingCitySuggestions, setLoadingCitySuggestions] = useState(false);
  const [addressPinCode, setAddressPinCode] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const keyboardHeight = useState(new Animated.Value(0))[0];
  const [currentKbHeight, setCurrentKbHeight] = useState(0);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const addresses = await getSavedAddresses();
        setSavedAddresses(addresses);
      } catch (err) {
        console.warn('Failed to load saved addresses:', err);
      }
    };
    loadSaved();
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow',
      (event) => {
        const kh = event.endCoordinates.height;
        setCurrentKbHeight(kh);
        Animated.timing(keyboardHeight, {
          toValue: kh,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide',
      () => {
        setCurrentKbHeight(0);
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const fetchCitySuggestions = async (text) => {
    setAddressCity(text);
    setErrorMessage('');
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
    setAddressCity(item.city);
    setCitySuggestions([]);
    setErrorMessage('');
  };

  const handleSelectSavedAddress = async (address) => {
    setErrorMessage('');
    let city = address.city;
    if (!city && address.addressLine) {
      const addrText = address.addressLine.toLowerCase();
      const cities = ['pune', 'mumbai', 'delhi', 'bangalore', 'kolkata', 'chennai', 'hyderabad'];
      for (const c of cities) {
        if (addrText.includes(c)) {
          city = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }
    }
    if (!city) city = 'Pune';

    if (city.toLowerCase().trim() !== artistCity.toLowerCase().trim()) {
      const msg = `Artist is far from your location. ${artist.name} is located in ${artistCity}, but this address is in ${city}.`;
      setErrorMessage(msg);
      Alert.alert('Unavailable', 'Artist is far from your location');
      return;
    }

    navigation.replace('BookAppointment', {
      artist,
      prefilledAddress: address.addressLine,
    });
  };

  const handleProceed = async () => {
    if (!addressName.trim()) {
      Alert.alert('Required Field', 'Please enter recipient name.');
      return;
    }
    if (!addressCity.trim()) {
      Alert.alert('Required Field', 'Please search and select a city.');
      return;
    }
    if (!addressPinCode.trim() || addressPinCode.length !== 6 || isNaN(addressPinCode)) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN Code.');
      return;
    }
    if (!addressLine.trim()) {
      Alert.alert('Required Field', 'Please enter detailed address.');
      return;
    }
    if (!addressPhone.trim() || addressPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      // Validate PIN Code matches selected City via LocationIQ
      let pinValid = false;
      try {
        const response = await fetch(
          `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(addressPinCode + ', India')}&format=json`
        );
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const place = data[0];
          const displayName = (place.display_name || '').toLowerCase();
          const cityLower = addressCity.toLowerCase();
          if (displayName.includes(cityLower)) {
            pinValid = true;
          }
        }
      } catch (err) {
        console.warn('PIN Code validation API error:', err);
        pinValid = true; // network fallback
      }

      if (!pinValid) {
        Alert.alert(
          'Invalid PIN Code',
          `The PIN Code ${addressPinCode} does not belong to the selected city: ${addressCity}.`
        );
        setSaving(false);
        return;
      }

      // Check if selected address city matches the artist's city
      if (addressCity.toLowerCase().trim() !== artistCity.toLowerCase().trim()) {
        const msg = `Artist is far from your location. ${artist.name} is located in ${artistCity}, but your booking address is in ${addressCity}.`;
        setErrorMessage(msg);
        Alert.alert('Unavailable', 'Artist is far from your location');
        setSaving(false);
        return;
      }

      // Save new address to AsyncStorage saved list
      const fullAddressLine = `${addressLine.trim()}, ${addressCity.trim()} - ${addressPinCode.trim()}`;
      const newAddressObj = {
        id: `address-${Date.now()}`,
        label: addressLabel,
        name: addressName.trim(),
        city: addressCity.trim(),
        pinCode: addressPinCode.trim(),
        rawLine: addressLine.trim(),
        addressLine: fullAddressLine,
        phone: addressPhone.trim(),
        iconBg: addressLabel === 'Home' ? '#E6FFED' : '#FFFBE6',
        iconColor: addressLabel === 'Home' ? '#389E0D' : '#D46B08',
      };

      const updated = await addSavedAddress(newAddressObj);
      setSavedAddresses(updated);

      // Continue with booking flow
      navigation.replace('BookAppointment', {
        artist,
        prefilledAddress: fullAddressLine,
      });

    } catch (error) {
      console.warn(error);
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Enter Booking Address"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: currentKbHeight + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Artist Summary Card */}
          <View style={styles.artistSummaryCard}>
            <Ionicons name="sparkles" size={20} color="#FF4F87" />
            <View style={styles.artistSummaryTextCol}>
              <Text style={styles.artistSummaryTitle}>Booking with {artist.name}</Text>
              <Text style={styles.artistSummarySubtitle}>
                Artist Location: <Text style={{ fontWeight: '700', color: '#FF4F87' }}>{artistCity}</Text>
              </Text>
            </View>
          </View>

          {/* Choose from Saved Addresses */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedSectionTitle}>Choose from Saved Addresses</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.savedCarousel}
              >
                {savedAddresses.map((address) => {
                  const isHome = address.label === 'Home';
                  const isWork = address.label === 'Work';
                  let iconName = 'location-outline';
                  if (isHome) iconName = 'home-outline';
                  else if (isWork) iconName = 'briefcase-outline';

                  return (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.savedAddressCard}
                      onPress={() => handleSelectSavedAddress(address)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.savedIconBg, { backgroundColor: isHome ? '#E6FFED' : '#FFFBE6' }]}>
                        <Ionicons
                          name={iconName}
                          size={18}
                          color={isHome ? '#389E0D' : '#D46B08'}
                        />
                      </View>
                      <View style={styles.savedTextCol}>
                        <Text style={styles.savedLabel}>{address.label}</Text>
                        <Text style={styles.savedCity} numberOfLines={1}>
                          {address.city || 'Pune'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Recipient Name */}
          <Text style={styles.label}>Recipient Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Name"
            placeholderTextColor="#999"
            value={addressName}
            onChangeText={setAddressName}
          />

          {/* Address Type */}
          <Text style={styles.label}>Address Type</Text>
          <View style={styles.labelSelectorRow}>
            {['Home', 'Work', 'Other'].map((lbl) => (
              <TouchableOpacity
                key={lbl}
                style={[
                  styles.labelSelectorBtn,
                  addressLabel === lbl && styles.labelSelectorBtnActive,
                ]}
                onPress={() => setAddressLabel(lbl)}
              >
                <Text
                  style={[
                    styles.labelSelectorText,
                    addressLabel === lbl && styles.labelSelectorTextActive,
                  ]}
                >
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* City Selection */}
          <Text style={styles.label}>City</Text>
          <View style={{ position: 'relative', zIndex: 999 }}>
            <TextInput
              style={styles.input}
              placeholder="Search and select city (e.g. Pune)"
              placeholderTextColor="#999"
              value={addressCity}
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
                    <Ionicons name="location-outline" size={16} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.citySuggestionText}>{item.display}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* PIN Code */}
          <Text style={styles.label}>PIN Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit PIN Code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={addressPinCode}
            onChangeText={setAddressPinCode}
            maxLength={6}
            onFocus={scrollToBottom}
          />

          {/* Detailed Address */}
          <Text style={styles.label}>Detailed Address</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Flat/House No., Building, Street, Landmark, City..."
            placeholderTextColor="#999"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline={true}
            numberOfLines={3}
            onFocus={scrollToBottom}
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={addressPhone}
            onChangeText={setAddressPhone}
            maxLength={10}
            onFocus={scrollToBottom}
          />
        </ScrollView>

        {/* Static Bottom Footer */}
        <Animated.View
          style={[
            styles.bottomFooter,
            {
              transform: [
                {
                  translateY: Animated.multiply(
                    keyboardHeight,
                    -1
                  ),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleProceed}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Validate and Proceed</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EnterBookingAddressScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  artistSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderColor: '#FFB6C1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  artistSummaryTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  artistSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  artistSummarySubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEA',
    borderColor: '#FFC1C0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 14,
    color: '#1F2937',
  },
  labelSelectorRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  labelSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  labelSelectorBtnActive: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FF4F87',
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
  bottomFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  submitBtn: {
    backgroundColor: '#FF4F87',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  savedSection: {
    marginBottom: 20,
  },
  savedSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  savedCarousel: {
    paddingRight: 20,
    gap: 12,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 140,
    maxWidth: 180,
  },
  savedIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  savedTextCol: {
    flex: 1,
  },
  savedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  savedCity: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
});

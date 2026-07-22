import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../../components/ScreenHeader';

const BookAppointmentScreen = ({ navigation, route }) => {
  const { artist } = route.params;

  // Fallback services if artist has no custom services
  const defaultServices = [
    { name: 'Bridal Makeup', price: '₹2,500' },
    { name: 'Engagement Makeup', price: '₹1,800' },
    { name: 'Party Makeup', price: '₹1,500' },
    { name: 'Photoshoot Makeup', price: '₹2,000' },
    { name: 'Airbrush Makeup', price: '₹2,200' },
  ];

  // Map backend services to screen items
  const services =
    artist.services && artist.services.length > 0
      ? artist.services.map(s => ({
          name: s.name || s.specialization || 'Makeup Service',
          price: s.price ? `₹${s.price}` : s.priceRange || '₹2,000',
        }))
      : defaultServices;

  // Pre-select service based on search category parameter
  const initialCategory = route.params?.selectedCategory || '';
  const matchingService = services.find(s =>
    s.name.toLowerCase().includes(initialCategory.toLowerCase())
  );

  // Per-service count of persons: { [serviceName]: count }
  const [serviceCounts, setServiceCounts] = useState(() => {
    const init = {};
    if (matchingService) {
      init[matchingService.name] = 1;
    } else if (services.length > 0) {
      init[services[0].name] = 1;
    }
    return init;
  });

  const updateServiceCount = (serviceName, delta) => {
    setServiceCounts(prev => {
      const current = prev[serviceName] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [serviceName]: next };
    });
  };

  const [selectedLocation, setSelectedLocation] = useState(route.params?.prefilledAddress ? 'home' : '');
  const [clientAddress, setClientAddress] = useState(route.params?.prefilledAddress || '');
  const [savedAddresses, setSavedAddresses] = useState([]);

  const artistCity = artist.profile?.location || 'Pune';

  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
  };

  const selectedServiceItems = services
    .map(s => {
      const count = serviceCounts[s.name] || 0;
      const unitPrice = parseAmount(s.price);
      return {
        ...s,
        count,
        unitPrice,
        totalPrice: unitPrice * count,
      };
    })
    .filter(s => s.count > 0);

  const totalPeopleCount = selectedServiceItems.reduce((sum, item) => sum + item.count, 0);
  const totalServiceAmount = selectedServiceItems.reduce((sum, item) => sum + item.totalPrice, 0);

  useEffect(() => {
    AsyncStorage.getItem('client_saved_addresses')
      .then(stored => {
        if (stored) {
          setSavedAddresses(JSON.parse(stored));
        }
      })
      .catch(err => console.warn('Failed to load saved addresses:', err));
  }, []);

  const validateAddressCity = (addressText, originalAddressObj = null) => {
    let city = originalAddressObj?.city;
    if (!city && addressText) {
      const addrText = addressText.toLowerCase();
      const cities = ['pune', 'mumbai', 'delhi', 'bangalore', 'kolkata', 'chennai', 'hyderabad', artistCity.toLowerCase()];
      for (const c of cities) {
        if (addrText.includes(c)) {
          city = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }
    }
    if (!city) {
      if (addressText && addressText.toLowerCase().includes(artistCity.toLowerCase())) {
        city = artistCity;
      }
    }
    return city;
  };

  const handleSelectQuickAddress = (addr) => {
    const city = validateAddressCity(addr.addressLine, addr);
    if (!city || city.toLowerCase().trim() !== artistCity.toLowerCase().trim()) {
      Alert.alert(
        'Unavailable',
        `Artist is far from your location. ${artist.name} is located in ${artistCity}, but this address is in ${city || 'another city'}.`
      );
      return;
    }
    setClientAddress(addr.addressLine);
  };

  const handleNext = () => {
    if (selectedServiceItems.length === 0) {
      Alert.alert('Required', 'Please select at least one service and specify the number of persons.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Required', 'Please select a service location.');
      return;
    }

    if (selectedLocation === 'home') {
      if (!clientAddress.trim()) {
        Alert.alert('Required', 'Please enter your address for the home service.');
        return;
      }

      const matchedSaved = savedAddresses.find(a => a.addressLine.trim() === clientAddress.trim());
      const detectedCity = validateAddressCity(clientAddress, matchedSaved);

      if (!detectedCity || detectedCity.toLowerCase().trim() !== artistCity.toLowerCase().trim()) {
        Alert.alert(
          'Unavailable',
          `Artist is far from your location. ${artist.name} is located in ${artistCity}.`
        );
        return;
      }
    }

    const serviceNames = selectedServiceItems
      .map(s => `${s.name}${s.count > 1 ? ` (x${s.count})` : ''}`)
      .join(', ');

    const serviceObj = {
      name: serviceNames,
      price: totalServiceAmount,
      peopleCount: totalPeopleCount,
      items: selectedServiceItems,
    };

    const locationData = {
      type: selectedLocation,
      address: selectedLocation === 'home' 
        ? clientAddress.trim() 
        : (artist.profile?.parlourAddress || 'At Artist Studio'),
    };

    if (route.params?.selectedDate && route.params?.selectedTime) {
      const parsedDate = new Date(route.params.selectedDate);
      const dateStr = parsedDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      navigation.navigate('AddOns', {
        artist,
        selectedService: serviceObj,
        selectedLocation: locationData,
        selectedDate: route.params.selectedDate,
        selectedTime: route.params.selectedTime,
        dateStr,
      });
      return;
    }

    navigation.navigate('SelectDateTime', {
      artist,
      selectedService: serviceObj,
      selectedLocation: locationData,
    });
  };

  const getPriceRange = () => {
    if (artist.services && artist.services.length > 0) {
      const prices = artist.services
        .map(s => {
          const val = s.price || s.priceRange || '';
          return parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
        })
        .filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₹${min.toLocaleString('en-IN')}` : `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
      }
    }
    return '₹1,500';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Book Your Appointment"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Artist Profile Info Segment */}
        <View style={styles.artistRow}>
          {artist.profile?.profileImage || artist.image ? (
            <Image
              source={{ uri: artist.profile?.profileImage || artist.image }}
              style={styles.artistImage}
            />
          ) : (
            <View style={[styles.artistImage, styles.artistImagePlaceholder]}>
              <Ionicons name="person" size={32} color="#FF4F87" />
            </View>
          )}
          <View style={styles.artistMeta}>
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.artistSpeciality}>
              {artist.speciality ||
                artist.specializations?.[0]?.name ||
                'Bridal Specialist'}
            </Text>
            <Text style={styles.artistPrice}>{getPriceRange()}</Text>
          </View>
        </View>

        {/* Services Segment */}
        <Text style={styles.sectionTitle}>Select Service & Number of Persons</Text>
        <View style={styles.optionsList}>
          {services.map(service => {
            const count = serviceCounts[service.name] || 0;
            const isSelected = count > 0;
            const unitPrice = parseAmount(service.price);

            return (
              <View
                key={service.name}
                style={[styles.serviceOptionCard, isSelected && styles.serviceOptionCardActive]}
              >
                <View style={styles.serviceMainRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                      {service.name}
                    </Text>
                    <Text style={styles.unitPriceText}>
                      ₹{unitPrice.toLocaleString('en-IN')} / person
                    </Text>
                  </View>

                  {/* Per-service Stepper Counter */}
                  <View style={styles.stepperWrapper}>
                    <TouchableOpacity
                      style={[styles.stepperButton, count === 0 && styles.stepperButtonDisabled]}
                      onPress={() => updateServiceCount(service.name, -1)}
                      disabled={count === 0}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={16} color={count === 0 ? '#CCC' : '#FF4F87'} />
                    </TouchableOpacity>

                    <View style={styles.stepperCountBadge}>
                      <Text style={[styles.stepperCountText, count > 0 && { color: '#FF4F87' }]}>
                        {count}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateServiceCount(service.name, 1)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={16} color="#FF4F87" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Individual Service Subtotal */}
                {count > 0 && (
                  <View style={styles.serviceSubtotalRow}>
                    <Text style={styles.serviceSubtotalLabel}>
                      {count} {count === 1 ? 'person' : 'people'} selected
                    </Text>
                    <Text style={styles.serviceSubtotalPrice}>
                      Subtotal: ₹{(unitPrice * count).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Selected Services Summary Card */}
        {selectedServiceItems.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Ionicons name="cart-outline" size={18} color="#FF4F87" style={{ marginRight: 6 }} />
              <Text style={styles.summaryCardTitle}>Selected Services Summary</Text>
            </View>
            {selectedServiceItems.map((item, idx) => (
              <View key={idx} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {item.name} <Text style={{ color: '#FF4F87', fontWeight: '700' }}>(×{item.count})</Text>
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₹{item.totalPrice.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
            <View style={styles.summaryTotalDivider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>
                Total Amount ({totalPeopleCount} {totalPeopleCount === 1 ? 'person' : 'people'})
              </Text>
              <Text style={styles.summaryTotalPrice}>
                ₹{totalServiceAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* Locations Segment */}
        <Text style={styles.sectionTitle}>Location</Text>

        {/* At Artist's Parlour Box */}
        {(() => {
          const hasParlour = !!(artist.profile?.parlourName || artist.profile?.parlourAddress);
          const parlourName = artist.profile?.parlourName || `${artist.name}'s Studio`;
          const parlourAddress = artist.profile?.parlourAddress || artist.profile?.location || null;

          return (
            <TouchableOpacity
              style={[
                styles.locationCard,
                selectedLocation === 'studio' && styles.locationCardActive,
                !hasParlour && styles.locationCardDisabled,
              ]}
              onPress={() => hasParlour && setSelectedLocation('studio')}
              activeOpacity={hasParlour ? 0.8 : 1}
              disabled={!hasParlour}
            >
              <View
                style={[
                  styles.customRadio,
                  selectedLocation === 'studio' && styles.customRadioActive,
                  !hasParlour && styles.customRadioDisabled,
                ]}
              >
                {selectedLocation === 'studio' && hasParlour && (
                  <View style={styles.customRadioInner} />
                )}
              </View>
              <View style={styles.locationTextCol}>
                <View style={styles.locationLabelRow}>
                  <Ionicons
                    name="storefront-outline"
                    size={14}
                    color={!hasParlour ? '#CCC' : selectedLocation === 'studio' ? '#FF4F87' : '#888'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.locationHeading,
                      selectedLocation === 'studio' && hasParlour && styles.locationHeadingActive,
                      !hasParlour && styles.locationHeadingDisabled,
                    ]}
                  >
                    At Artist's Parlour
                  </Text>
                  {!hasParlour && (
                    <View style={styles.noParlourBadge}>
                      <Text style={styles.noParlourBadgeText}>Not Available</Text>
                    </View>
                  )}
                </View>
                {hasParlour ? (
                  <>
                    <Text style={styles.parlourNameText}>{parlourName}</Text>
                    {parlourAddress && (
                      <Text style={styles.addressText}>{parlourAddress}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noParlourSubtext}>
                    This artist hasn't registered a parlour location yet.
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* At Your Location Box */}
        <TouchableOpacity
          style={[
            styles.locationCard,
            selectedLocation === 'home' && styles.locationCardActive,
          ]}
          onPress={() => setSelectedLocation('home')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.customRadio,
              selectedLocation === 'home' && styles.customRadioActive,
            ]}
          >
            {selectedLocation === 'home' && (
              <View style={styles.customRadioInner} />
            )}
          </View>
          <View style={styles.locationTextCol}>
            <Text
              style={[
                styles.locationHeading,
                selectedLocation === 'home' && styles.locationHeadingActive,
              ]}
            >
              At Your Location (Home Service)
            </Text>
          </View>
        </TouchableOpacity>

        {selectedLocation === 'home' && (
          <View style={styles.addressInputContainer}>
            <Text style={styles.addressInputLabel}>Select Booking Address</Text>

            {clientAddress ? (
              <View style={styles.selectedAddressDetailCard}>
                <Ionicons name="location" size={16} color="#FF4F87" style={{ marginRight: 6 }} />
                <Text style={styles.selectedAddressDetailText}>{clientAddress}</Text>
              </View>
            ) : (
              <View style={styles.selectedAddressDetailCard}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF4F87" style={{ marginRight: 6 }} />
                <Text style={[styles.selectedAddressDetailText, { fontStyle: 'italic', color: '#666' }]}>
                  No address selected. Tap a saved address below or add a new one.
                </Text>
              </View>
            )}
            
            {savedAddresses.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.quickSelectLabel}>Quick select from saved addresses:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {savedAddresses.map(addr => {
                    const isSelected = clientAddress === addr.addressLine;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.quickAddressChip,
                          isSelected && styles.quickAddressChipActive
                        ]}
                        onPress={() => handleSelectQuickAddress(addr)}
                      >
                        <Ionicons 
                          name={addr.label === 'Home' ? 'home-outline' : 'briefcase-outline'} 
                          size={14} 
                          color={isSelected ? '#FFF' : '#FF4F87'} 
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[
                          styles.quickAddressChipText,
                          isSelected && styles.quickAddressChipTextActive
                        ]}>
                          {addr.label} ({addr.name})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <Text style={[styles.quickSelectLabel, { marginBottom: 12, fontStyle: 'italic' }]}>
                You have no saved addresses. Please add an address to continue.
              </Text>
            )}

            <TouchableOpacity
              style={styles.addNewAddressBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EnterBookingAddress', { artist })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FF4F87" />
              <Text style={styles.addNewAddressBtnText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next Trigger Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BookAppointmentScreen;

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
    paddingBottom: 40,
  },
  serviceOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  serviceOptionCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF9FB',
  },
  serviceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitPriceText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  serviceSubtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5E6ED',
  },
  serviceSubtotalLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  serviceSubtotalPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F87',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E4EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryItemName: {
    fontSize: 13,
    color: '#444',
    flex: 1,
    marginRight: 8,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
  summaryTotalDivider: {
    height: 1,
    backgroundColor: '#F3ECF0',
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  summaryTotalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF4F87',
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperButtonDisabled: {
    backgroundColor: '#F7F7F7',
  },
  stepperCountBadge: {
    paddingHorizontal: 12,
  },
  stepperCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  artistImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#FFE6EF',
  },
  artistImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistMeta: {
    marginLeft: 16,
    flex: 1,
  },
  artistName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  artistSpeciality: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  artistPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginTop: 10,
    marginBottom: 16,
  },
  optionsList: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  leftOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customRadioActive: {
    borderColor: '#FF4F87',
  },
  customRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4F87',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#111',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  priceTextActive: {
    color: '#FF4F87',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  locationCardActive: {
    borderColor: '#FF4F87',
    shadowOpacity: 0.04,
  },
  locationTextCol: {
    flex: 1,
    marginLeft: 4,
  },
  locationHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationHeadingActive: {
    color: '#FF4F87',
  },
  addressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  parlourNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  locationCardDisabled: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E8E8E8',
    opacity: 0.75,
  },
  customRadioDisabled: {
    borderColor: '#DDD',
    backgroundColor: '#F2F2F2',
  },
  locationHeadingDisabled: {
    color: '#AAA',
  },
  noParlourBadge: {
    marginLeft: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFCCD5',
  },
  noParlourBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E05070',
  },
  noParlourSubtext: {
    fontSize: 12,
    color: '#BBB',
    marginTop: 4,
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: '#FF4F87',
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addressInputContainer: {
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 18,
    padding: 12,
  },
  addressInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F87',
    marginBottom: 6,
  },
  selectedAddressDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F8',
    borderColor: '#FFE0EC',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  selectedAddressDetailText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  addNewAddressBtnText: {
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '700',
    marginLeft: 6,
  },
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 6,
  },
  quickAddressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFCCD9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickAddressChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  quickAddressChipText: {
    fontSize: 12,
    color: '#FF4F87',
    fontWeight: '600',
  },
  quickAddressChipTextActive: {
    color: '#FFF',
  },
});

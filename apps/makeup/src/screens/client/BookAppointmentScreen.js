import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../api/client';
import { getSavedAddresses } from '../../utils/addressStorage';
import { isLocationMatch, getCleanCityName } from '../../utils/locationHelper';
import ScreenHeader from '../../components/ScreenHeader';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';

const BookAppointmentScreen = ({ navigation, route }) => {
  const { artist, selectedDate, selectedTime } = route.params;
  
  // Provide a graceful fallback if someone navigated here without a selectedPackage
  const fallbackPackage = {
    id: 'custom_booking',
    name: route.params.selectedCategory || route.params.selectedService?.name || 'Custom Booking',
    price: route.params.selectedService?.price || artist?.services?.[0]?.price || 3000,
    duration: '2 - 3 hrs',
    packageLevel: 'Service',
  };

  const [activePackage, setActivePackage] = useState(route.params.selectedPackage || fallbackPackage);
  const [packages, setPackages] = useState(route.params.selectedPackage ? [route.params.selectedPackage] : []);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [peopleCount, setPeopleCount] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(route.params?.prefilledAddress ? 'home' : '');
  const [clientAddress, setClientAddress] = useState(route.params?.prefilledAddress || '');
  const [savedAddresses, setSavedAddresses] = useState([]);

  const artistCity = getCleanCityName(artist.profile?.location) || artist.profile?.location || 'Pune';

  useEffect(() => {
    getSavedAddresses()
      .then(addresses => setSavedAddresses(addresses))
      .catch(err => console.warn('Failed to load saved addresses:', err));
  }, []);

  useEffect(() => {
    if (!route.params.selectedPackage) {
      const fetchPackages = async () => {
        try {
          setLoadingPackages(true);
          const response = await api.get(`/api/packages/artist/${artist.id}`);
          if (response.data && response.data.length > 0) {
            setPackages(response.data);
            setActivePackage(response.data[0]); // Auto-select first package
          }
        } catch (err) {
          console.warn('Failed to fetch packages:', err);
        } finally {
          setLoadingPackages(false);
        }
      };
      fetchPackages();
    }
  }, [artist.id, route.params.selectedPackage]);

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
      city = addressText || artistCity;
    }
    return city;
  };

  const handleSelectQuickAddress = (addr) => {
    const city = validateAddressCity(addr.addressLine, addr);
    if (artist.profile?.location && !isLocationMatch(city, artist.profile.location)) {
      Alert.alert(
        'Unavailable',
        `Artist is located in ${artistCity}, but this address is in ${city || 'another city'}.`
      );
      return;
    }
    setClientAddress(addr.addressLine);
  };

  const handleNext = () => {
    if (peopleCount < 1) {
      Alert.alert('Required', 'Please select at least 1 person.');
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

      if (artist.profile?.location && !isLocationMatch(detectedCity, artist.profile.location)) {
        Alert.alert(
          'Unavailable',
          `Artist is located in ${artistCity}, but your address is outside their service location.`
        );
        return;
      }
    }

    const unitPrice = activePackage.price;
    const totalAmount = unitPrice * peopleCount;

    const serviceObj = {
      name: `${activePackage.name}${peopleCount > 1 ? ` (x${peopleCount})` : ''}`,
      price: totalAmount,
      peopleCount: peopleCount,
      items: [{
        name: activePackage.name,
        price: `₹${unitPrice}`,
        count: peopleCount,
        unitPrice: unitPrice,
        totalPrice: totalAmount,
        type: 'package',
        packageId: activePackage.id !== 'custom_booking' ? activePackage.id : undefined
      }],
    };

    const locationData = {
      type: selectedLocation,
      address: selectedLocation === 'home' 
        ? clientAddress.trim() 
        : (artist.profile?.parlourAddress || 'At Artist Studio'),
    };

    const parsedDate = new Date(selectedDate);
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
      selectedDate: selectedDate,
      selectedTime: selectedTime,
      dateStr,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Complete Booking"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Booking Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="calendar-outline" size={20} color="#FF4F87" style={{ marginRight: 10 }} />
          <Text style={styles.infoBannerText}>
            Booking for <Text style={{ fontWeight: 'bold' }}>{new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text> at <Text style={{ fontWeight: 'bold' }}>{selectedTime}</Text>
          </Text>
        </View>

        {/* Artist Profile Info Segment */}
        <View style={styles.artistRow}>
          <Image
            source={{ uri: getUniqueProfileImage(artist) }}
            style={styles.artistImage}
          />
          <View style={styles.artistMeta}>
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.artistSpeciality}>
              {artist.speciality ||
                artist.specializations?.[0]?.name ||
                'Makeup Artist'}
            </Text>
          </View>
        </View>

        {/* Selected Package Segment */}
        {!route.params.selectedPackage && packages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select a Package</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, activePackage.id === pkg.id && styles.packageCardActive]}
                  onPress={() => setActivePackage(pkg)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.packageName, activePackage.id === pkg.id && { color: '#FF4F87' }]}>{pkg.name}</Text>
                  <Text style={[styles.packagePrice, activePackage.id === pkg.id && { color: '#FF4F87' }]}>₹{pkg.price.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        
        <Text style={styles.sectionTitle}>Selected Package</Text>
        <View style={styles.serviceOptionCardActive}>
          <View style={styles.serviceMainRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 }}>
                  <Text style={{ fontSize: 10, color: '#9333EA', fontWeight: 'bold' }}>{activePackage.packageLevel || 'Package'}</Text>
                </View>
                <Text style={styles.optionTextActive} numberOfLines={1}>
                  {activePackage.name}
                </Text>
              </View>
              <Text style={styles.unitPriceText}>
                ₹{activePackage.price.toLocaleString('en-IN')} / person
              </Text>
              <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>⏱ {activePackage.duration}</Text>
            </View>

            <View style={styles.stepperWrapper}>
              <TouchableOpacity
                style={[styles.stepperButton, peopleCount === 1 && styles.stepperButtonDisabled]}
                onPress={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                disabled={peopleCount === 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color={peopleCount === 1 ? '#CCC' : '#FF4F87'} />
              </TouchableOpacity>

              <View style={styles.stepperCountBadge}>
                <Text style={[styles.stepperCountText, { color: '#FF4F87' }]}>
                  {peopleCount}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setPeopleCount(peopleCount + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#FF4F87" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.serviceSubtotalRow}>
            <Text style={styles.serviceSubtotalLabel}>
              {peopleCount} {peopleCount === 1 ? 'person' : 'people'} selected
            </Text>
            <Text style={styles.serviceSubtotalPrice}>
              Subtotal: ₹{(activePackage.price * peopleCount).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#333',
  },
  serviceOptionCardActive: {
    backgroundColor: '#FFF9FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF4F87',
  },
  serviceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextActive: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4F87',
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
  artistMeta: {
    marginLeft: 14,
    flex: 1,
  },
  artistName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 0.2,
  },
  artistSpeciality: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  locationCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF9FB',
  },
  locationCardDisabled: {
    backgroundColor: '#F9F9F9',
    borderColor: '#EFEFEF',
  },
  customRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  customRadioActive: {
    borderColor: '#FF4F87',
  },
  customRadioDisabled: {
    borderColor: '#E2E2E2',
    backgroundColor: '#F0F0F0',
  },
  customRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4F87',
  },
  locationTextCol: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  locationHeadingActive: {
    color: '#FF4F87',
  },
  locationHeadingDisabled: {
    color: '#AAA',
  },
  noParlourBadge: {
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  noParlourBadgeText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  parlourNameText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginTop: 6,
  },
  addressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    lineHeight: 18,
  },
  noParlourSubtext: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 6,
  },
  addressInputContainer: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD6E5',
  },
  addressInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  selectedAddressDetailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedAddressDetailText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  quickSelectLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  quickAddressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  quickAddressChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  quickAddressChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  quickAddressChipTextActive: {
    color: '#FFF',
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF4F87',
    borderStyle: 'dashed',
    backgroundColor: '#FFF9FB',
  },
  addNewAddressBtnText: {
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '700',
    marginLeft: 6,
  },
  nextButton: {
    backgroundColor: '#FF4F87',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default BookAppointmentScreen;

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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../api/client';
import { getSavedAddresses } from '../../utils/addressStorage';
import { isLocationMatch, getCleanCityName } from '../../utils/locationHelper';
import ScreenHeader from '../../components/ScreenHeader';
import { getUniqueProfileImage } from '../../utils/artistImageHelper';

const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  const num = parseInt(priceStr.toString().replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

const BookAppointmentScreen = ({ navigation, route }) => {
  const { artist, selectedDate, selectedTime } = route.params || {};

  const rawServices = artist?.services?.length > 0
    ? artist.services
    : (artist?.specializations?.length > 0 ? artist.specializations : []);

  const normalizedServices = (rawServices || []).map((s, idx) => {
    if (typeof s === 'string') {
      return {
        id: s,
        specialization: s,
        priceRange: '5000',
        duration: '1.5 hrs',
        hasPremium: true,
        premiumPriceRange: '8500',
      };
    }
    const baseP = parsePrice(s.priceRange || s.price || '5000');
    const dummyPremP = String(Math.round(baseP * 1.6));
    const offersPremium = s.hasPremium !== undefined ? !!s.hasPremium : true; // Default to true for easy testing!
    return {
      id: s.id || s.specialization || s.name || `svc_${idx}`,
      specialization: s.specialization || s.name || 'Service',
      priceRange: s.priceRange || s.price || '5000',
      duration: s.duration || '1.5 hrs',
      hasPremium: offersPremium,
      premiumPriceRange: s.premiumPriceRange || s.premiumPrice || dummyPremP,
    };
  });

  if (normalizedServices.length === 0) {
    normalizedServices.push(
      { id: 'bridal', specialization: 'Bridal Makeup', priceRange: '10000', duration: '2.5 hrs', hasPremium: true, premiumPriceRange: '18000' },
      { id: 'party', specialization: 'Party Makeup', priceRange: '3500', duration: '1.5 hrs', hasPremium: true, premiumPriceRange: '6000' },
      { id: 'hd', specialization: 'HD Makeup', priceRange: '6000', duration: '2 hrs', hasPremium: true, premiumPriceRange: '10000' }
    );
  }

  const [services] = useState(normalizedServices);
  const [selectedServicesMap, setSelectedServicesMap] = useState({});
  const [selectedTierMap, setSelectedTierMap] = useState({});

  const getServiceTier = (serviceId) => selectedTierMap[serviceId] || 'Basic';

  const getServiceUnitPrice = (service) => {
    const serviceId = service.id || service.specialization;
    const tier = getServiceTier(serviceId);
    if (tier === 'Premium' && service.hasPremium) {
      return parsePrice(service.premiumPriceRange || service.premiumPrice || service.priceRange || service.price);
    }
    return parsePrice(service.priceRange || service.price);
  };

  const [selectedLocation, setSelectedLocation] = useState(route.params?.prefilledAddress ? 'home' : '');
  const [clientAddress, setClientAddress] = useState(route.params?.prefilledAddress || '');
  const [savedAddresses, setSavedAddresses] = useState([]);

  const artistCity = getCleanCityName(artist?.profile?.location) || artist?.profile?.location || 'Pune';

  useEffect(() => {
    getSavedAddresses()
      .then(addresses => setSavedAddresses(addresses))
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
      city = addressText || artistCity;
    }
    return city;
  };

  const handleSelectQuickAddress = (addr) => {
    const city = validateAddressCity(addr.addressLine, addr);
    if (artist?.profile?.location && !isLocationMatch(city, artist.profile.location)) {
      Alert.alert(
        'Unavailable',
        `Artist is located in ${artistCity}, but this address is in ${city || 'another city'}.`
      );
      return;
    }
    setClientAddress(addr.addressLine);
  };

  const incrementPackage = (key) => {
    setSelectedServicesMap(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  const decrementPackage = (key) => {
    setSelectedServicesMap(prev => {
      const val = prev[key] || 0;
      if (val <= 1) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: val - 1
      };
    });
  };

  const handleNext = () => {
    let subtotal = 0;
    let totalPeopleCount = 0;
    const items = [];

    services.forEach(s => {
      const serviceId = s.id || s.specialization;
      const basicKey = `${serviceId}_basic`;
      const countBasic = selectedServicesMap[basicKey] || 0;

      if (countBasic > 0) {
        const unitP = parsePrice(s.priceRange || s.price || 0);
        const totP = unitP * countBasic;
        subtotal += totP;
        totalPeopleCount += countBasic;
        items.push({
          name: `${s.specialization || s.name || 'Service'} (Basic Package)`,
          serviceNameOnly: s.specialization || s.name || 'Service',
          tier: 'Basic',
          price: `₹${unitP}`,
          count: countBasic,
          unitPrice: unitP,
          totalPrice: totP,
          type: 'service',
          serviceId: s.id
        });
      }

      if (s.hasPremium) {
        const premiumKey = `${serviceId}_premium`;
        const countPremium = selectedServicesMap[premiumKey] || 0;

        if (countPremium > 0) {
          const unitP = parsePrice(s.premiumPriceRange || s.premiumPrice || 0);
          const totP = unitP * countPremium;
          subtotal += totP;
          totalPeopleCount += countPremium;
          items.push({
            name: `${s.specialization || s.name || 'Service'} (Premium Package)`,
            serviceNameOnly: s.specialization || s.name || 'Service',
            tier: 'Premium',
            price: `₹${unitP}`,
            count: countPremium,
            unitPrice: unitP,
            totalPrice: totP,
            type: 'service',
            serviceId: s.id
          });
        }
      }
    });

    if (items.length === 0) {
      Alert.alert('Required', 'Please select at least one service.');
      return;
    }

    const finalServiceObj = {
      name: items.map(i => `${i.name}${i.count > 1 ? ` (x${i.count})` : ''}`).join(' + '),
      price: subtotal,
      peopleCount: totalPeopleCount || 1,
      items: items,
    };


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
      selectedService: finalServiceObj,
      selectedLocation: locationData,
      selectedDate: selectedDate,
      selectedTime: selectedTime,
      dateStr,
    });
  };

  const dateObj = new Date(selectedDate);

  const isValidDate = selectedDate && !isNaN(dateObj.getTime());


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
            {isValidDate ? (
              <>Booking for <Text style={{ fontWeight: 'bold' }}>{dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text> at <Text style={{ fontWeight: 'bold' }}>{selectedTime}</Text></>
            ) : (
              <Text style={{ fontStyle: 'italic', color: '#666' }}>Please select a date and time.</Text>
            )}
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

        {/* Services Selection Header */}
        <View>
          <Text style={styles.sectionTitle}>Select Services & Number of Clients</Text>


            <View style={styles.servicesListContainer}>
              {services.map((service, index) => {
                const serviceId = service.id || service.specialization || index.toString();
                const basicKey = `${serviceId}_basic`;
                const premiumKey = `${serviceId}_premium`;
                const countBasic = selectedServicesMap[basicKey] || 0;
                const countPremium = selectedServicesMap[premiumKey] || 0;

                const basicPriceNum = parsePrice(service.priceRange || service.price);
                const premPriceNum = parsePrice(service.premiumPriceRange || service.premiumPrice);

                return (
                  <View key={serviceId} style={styles.serviceItemCard}>
                    {/* Service Header: Name & Duration */}
                    <View style={styles.serviceCardHeader}>
                      <Text style={styles.serviceTitleText}>
                        {service.specialization || service.name}
                      </Text>
                      <Text style={styles.serviceDurationBadge}>
                        ⏱ {service.duration || '1.5 hrs'}
                      </Text>
                    </View>

                    {/* BASIC PACKAGE COUNTER ROW */}
                    <View style={styles.packageRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.packageTierTitle}>Basic Package</Text>
                        <Text style={styles.packagePriceSubtext}>
                          ₹{basicPriceNum.toLocaleString('en-IN')} / person
                        </Text>
                      </View>

                      <View style={styles.stepperWrapper}>
                        <TouchableOpacity
                          style={[styles.stepperButton, countBasic === 0 && styles.stepperButtonDisabled]}
                          onPress={() => decrementPackage(basicKey)}
                          disabled={countBasic === 0}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={16} color={countBasic === 0 ? '#CCC' : '#FF4F87'} />
                        </TouchableOpacity>

                        <View style={styles.stepperCountBadge}>
                          <Text style={[styles.stepperCountText, countBasic > 0 ? { color: '#FF4F87' } : { color: '#CCC' }]}>
                            {countBasic}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => incrementPackage(basicKey)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={16} color="#FF4F87" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* PREMIUM PACKAGE COUNTER ROW (IF OFFERED) */}
                    {!!service.hasPremium && (
                      <View style={[styles.packageRow, styles.packageRowPremium]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.packageTierTitle, { color: '#7E22CE' }]}>⭐ Premium Package</Text>
                          <Text style={[styles.packagePriceSubtext, { color: '#6B21A8' }]}>
                            ₹{premPriceNum.toLocaleString('en-IN')} / person
                          </Text>
                        </View>

                        <View style={styles.stepperWrapper}>
                          <TouchableOpacity
                            style={[styles.stepperButton, countPremium === 0 && styles.stepperButtonDisabled]}
                            onPress={() => decrementPackage(premiumKey)}
                            disabled={countPremium === 0}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={16} color={countPremium === 0 ? '#CCC' : '#8A2BE2'} />
                          </TouchableOpacity>

                          <View style={[styles.stepperCountBadge, countPremium > 0 && { backgroundColor: '#F3E8FF' }]}>
                            <Text style={[styles.stepperCountText, countPremium > 0 ? { color: '#8A2BE2' } : { color: '#CCC' }]}>
                              {countPremium}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.stepperButton, { borderColor: '#D8B4FE' }]}
                            onPress={() => incrementPackage(premiumKey)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={16} color="#8A2BE2" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Subtotal row for services */}
              {(() => {
                let subtotal = 0;
                let totalCount = 0;
                services.forEach(s => {
                  const serviceId = s.id || s.specialization;
                  const countBasic = selectedServicesMap[`${serviceId}_basic`] || 0;
                  if (countBasic > 0) {
                    subtotal += countBasic * parsePrice(s.priceRange || s.price);
                    totalCount += countBasic;
                  }

                  if (s.hasPremium) {
                    const countPremium = selectedServicesMap[`${serviceId}_premium`] || 0;
                    if (countPremium > 0) {
                      subtotal += countPremium * parsePrice(s.premiumPriceRange || s.premiumPrice);
                      totalCount += countPremium;
                    }
                  }
                });
                return totalCount > 0 ? (
                  <View style={styles.serviceOptionCardActive}>
                     <Text style={styles.sectionTitleInner}>Selected Services Summary</Text>
                     <View style={styles.serviceSubtotalRow}>
                       <Text style={styles.serviceSubtotalLabel}>
                         {totalCount} {totalCount === 1 ? 'client' : 'clients'} selected
                       </Text>
                       <Text style={styles.serviceSubtotalPrice}>
                         Subtotal: ₹{subtotal.toLocaleString('en-IN')}
                       </Text>
                     </View>
                  </View>
                ) : null;
              })()}
            </View>
          </View>


        {/* Locations Segment */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Location</Text>

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
  modeToggleContainer: {
    marginBottom: 16,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 4,
    marginTop: 8,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  modeToggleTextActive: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  serviceOptionCardActive: {
    backgroundColor: '#FFF9FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF4F87',
  },
  servicesListContainer: {
    marginBottom: 20,
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 140,
    maxWidth: 200,
  },
  packageCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF0F5',
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 13,
    color: '#777',
  },
  sectionTitleInner: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  packageDescriptionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
  },
  serviceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
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
    fontSize: 14,
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
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  serviceDurationBadge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  packageRowPremium: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  packageTierTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  packagePriceSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default BookAppointmentScreen;

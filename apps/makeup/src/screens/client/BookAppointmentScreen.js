import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
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

  const [selectedService, setSelectedService] = useState(matchingService ? matchingService.name : '');
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleNext = () => {
    if (!selectedService) {
      Alert.alert('Required', 'Please select a service.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Required', 'Please select a service location.');
      return;
    }

    const serviceObj = services.find(s => s.name === selectedService) || {
      name: selectedService,
      price: '₹2,000',
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
        selectedLocation,
        selectedDate: route.params.selectedDate,
        selectedTime: route.params.selectedTime,
        dateStr,
      });
      return;
    }

    navigation.navigate('SelectDateTime', {
      artist,
      selectedService: serviceObj,
      selectedLocation,
    });
  };

  const getPriceRange = () => {
    if (artist.services && artist.services.length > 0) {
      const prices = artist.services
        .map(s => parseFloat(s.price) || 0)
        .filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
      }
    }
    return artist.profile?.priceRange || '₹1,500 - ₹3,000';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Book Your Appointment"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        <Text style={styles.sectionTitle}>Select Service</Text>
        <View style={styles.optionsList}>
          {services.map(service => {
            const isSelected = selectedService === service.name;
            return (
              <TouchableOpacity
                key={service.name}
                style={styles.optionRow}
                onPress={() => setSelectedService(service.name)}
                activeOpacity={0.7}
              >
                <View style={styles.leftOptionRow}>
                  {/* Custom Radio Button */}
                  <View
                    style={[
                      styles.customRadio,
                      isSelected && styles.customRadioActive,
                    ]}
                  >
                    {isSelected && <View style={styles.customRadioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextActive,
                    ]}
                  >
                    {service.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.priceText,
                    isSelected && styles.priceTextActive,
                  ]}
                >
                  {service.price}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Locations Segment */}
        <Text style={styles.sectionTitle}>Location</Text>

        {/* At Artist Studio Box */}
        <TouchableOpacity
          style={[
            styles.locationCard,
            selectedLocation === 'studio' && styles.locationCardActive,
          ]}
          onPress={() => setSelectedLocation('studio')}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.customRadio,
              selectedLocation === 'studio' && styles.customRadioActive,
            ]}
          >
            {selectedLocation === 'studio' && (
              <View style={styles.customRadioInner} />
            )}
          </View>
          <View style={styles.locationTextCol}>
            <Text
              style={[
                styles.locationHeading,
                selectedLocation === 'studio' && styles.locationHeadingActive,
              ]}
            >
              At Artist Studio
            </Text>
            <Text style={styles.addressText}>123 Beauty Street, Pune</Text>
          </View>
        </TouchableOpacity>

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
              At Your Location
            </Text>
          </View>
        </TouchableOpacity>

        {/* Next Trigger Button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookAppointmentScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
});

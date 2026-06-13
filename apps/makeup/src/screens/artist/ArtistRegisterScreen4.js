// PricingServicesScreen.js

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';

const ArtistRegisterScreen4 = ({ navigation, route }) => {
  const { data, setServices } = useArtistRegistration();
  
  const getInitialServices = () => {
    const specs = data.specializations || [];
    
    // If services already exist, map/merge them to preserve details
    if (data.services && data.services.length > 0) {
      if (specs.length > 0) {
        const existingMap = {};
        data.services.forEach(s => {
          if (s.specialization) {
            existingMap[s.specialization.toLowerCase()] = s;
          }
        });
        
        return specs.map((spec, idx) => {
          const key = spec.toLowerCase();
          if (existingMap[key]) {
            const { timeRange, ...rest } = existingMap[key];
            return {
              ...rest,
              specialization: spec,
            };
          }
          return {
            id: Date.now() + idx,
            specialization: spec,
            duration: '',
            priceRange: '',
          };
        });
      }
      return data.services.map(({ timeRange, ...rest }) => rest);
    }
    
    // If no existing services but we have step 3 specializations
    if (specs.length > 0) {
      return specs.map((spec, idx) => ({
        id: Date.now() + idx,
        specialization: spec,
        duration: '',
        priceRange: '',
      }));
    }
    
    // Fallback default
    return [
      {
        id: Date.now(),
        specialization: '',
        duration: '',
        priceRange: '',
      },
    ];
  };

  const [services, setServicesState] = useState(getInitialServices());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ADD NEW SERVICE
  const addService = () => {
    const newService = {
      id: Date.now(),
      specialization: '',
      duration: '',
      priceRange: '',
    };

    setServicesState([...services, newService]);
  };

  // UPDATE INPUTS
  const updateService = (id, field, value) => {
    const updated = services.map(service => {
      if (service.id === id) {
        return {
          ...service,
          [field]: value,
        };
      }

      return service;
    });

    setServicesState(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        >
          {/* HEADER BOX */}
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              <Text style={styles.pinkText}>Good</Text> Pricing {'\n'}
              <Text style={styles.pinkText}>Large</Text> Profits
            </Text>
          </View>

          {/* SERVICES */}
          {services.map((service, index) => (
            <View key={service.id} style={styles.serviceContainer}>
              {/* LABEL */}
              <Text style={styles.label}>Specialization</Text>

              {/* SPECIALIZATION */}
              <TextInput
                placeholder="Bridal Makeup"
                placeholderTextColor="#C7AAA0"
                value={service.specialization}
                onChangeText={text =>
                  updateService(service.id, 'specialization', text)
                }
                editable={!(data.specializations || []).includes(service.specialization)}
                style={[
                  styles.input,
                  (data.specializations || []).includes(service.specialization) && {
                    backgroundColor: '#EAEAEA',
                    color: '#666',
                  },
                ]}
              />

              {/* DURATION */}
              <TextInput
                placeholder="Duration of service (e.g. 1-2 hours or 30-45 mins)"
                placeholderTextColor="#C7AAA0"
                value={service.duration}
                onChangeText={text =>
                  updateService(service.id, 'duration', text)
                }
                style={styles.input}
              />
              <Text style={styles.helperText}>Must be a time range (e.g., '1-2 hours' or '30-45 mins')</Text>

              {/* PRICE RANGE */}
              <TextInput
                placeholder="Service Price or Price Range (e.g., 1500 or 1000-2000)"
                placeholderTextColor="#C7AAA0"
                value={service.priceRange}
                onChangeText={text =>
                  updateService(service.id, 'priceRange', text)
                }
                keyboardType="default"
                style={styles.input}
              />
            </View>
          ))}

          {/* ADD SERVICE BUTTON */}
          <TouchableOpacity
            style={styles.addServiceButton}
            onPress={addService}
          >
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={20} color="#B7796C" />
            </View>

            <Text style={styles.addServiceText}>Add a Service</Text>
          </TouchableOpacity>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={async () => {
              const DURATION_RANGE_REGEX = /^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?\s*(min|mins|minute|minutes|hr|hrs|hour|hours)$/i;
              
              // Validate inputs
              for (let i = 0; i < services.length; i++) {
                const s = services[i];
                const specName = s.specialization || `Service ${i + 1}`;
                
                if (!s.specialization.trim()) {
                  Alert.alert('Validation Error', `Specialization name cannot be empty for service ${i + 1}`);
                  return;
                }
                
                if (!s.duration.trim()) {
                  Alert.alert('Validation Error', `Duration is required for ${specName}`);
                  return;
                }
                
                if (!DURATION_RANGE_REGEX.test(s.duration.trim())) {
                  Alert.alert('Validation Error', `Duration for ${specName} must be a range (e.g. '1-2 hours' or '30-45 mins')`);
                  return;
                }
                
                if (!s.priceRange.trim()) {
                  Alert.alert('Validation Error', `Price is required for ${specName}`);
                  return;
                }
                
                const priceTrimmed = s.priceRange.trim();
                const isSinglePrice = /^\d+$/.test(priceTrimmed);
                const isPriceRange = /^\d+\s*-\s*\d+$/.test(priceTrimmed);
                
                if (!isSinglePrice && !isPriceRange) {
                  Alert.alert('Validation Error', `Price for ${specName} must be a valid number or range (e.g. '1500' or '1000-2000')`);
                  return;
                }
                
                if (isSinglePrice) {
                  const priceVal = parseInt(priceTrimmed, 10);
                  if (priceVal <= 0) {
                    Alert.alert('Validation Error', `Price for ${specName} must be greater than 0`);
                    return;
                  }
                } else if (isPriceRange) {
                  const parts = priceTrimmed.split('-').map(p => parseInt(p.trim(), 10));
                  if (parts[0] <= 0 || parts[1] <= 0) {
                    Alert.alert('Validation Error', `Prices in range for ${specName} must be greater than 0`);
                    return;
                  }
                  if (parts[0] >= parts[1]) {
                    Alert.alert('Validation Error', `Minimum price must be less than maximum price for ${specName}`);
                    return;
                  }
                }
              }

              try {
                setIsSubmitting(true);
                await updateArtistProfile({ services });
                setServices(services);
                
                if (route?.params?.fromPending) {
                  navigation.navigate('ArtistRegistrationPending');
                } else {
                  navigation.navigate('ArtistRegister5');
                }
              } catch (error) {
                console.error('Save step 4 error:', error);
                const msg = error?.response?.data?.message || error?.message || 'Failed to save services';
                Alert.alert('Error', msg);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Let’s Make-up Profile</Text>

                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ArtistRegisterScreen4;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },

  // HEADER

  headerCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 30,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },

  headerText: {
    fontSize: 24,
    color: '#111',
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '700',
  },

  pinkText: {
    color: '#FF4F8F',
  },

  // SERVICE CONTAINER

  serviceContainer: {
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 26,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    marginBottom: 28,
  },

  label: {
    position: 'absolute',
    top: -11,
    left: 20,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    color: '#FF4F8F',
    fontSize: 13,
    fontWeight: '700',
    zIndex: 10,
  },

  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    color: '#111',
    fontSize: 15,
    marginBottom: 14,
  },

  helperText: {
    color: '#B7796C',
    fontSize: 12,
    marginLeft: 18,
    marginTop: -8,
    marginBottom: 14,
  },

  // ADD BUTTON

  addServiceButton: {
    height: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 24,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  plusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  addServiceText: {
    color: '#B7796C',
    fontSize: 18,
    fontWeight: '500',
  },

  // MAIN BUTTON

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 38,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
});

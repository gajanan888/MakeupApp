// PricingServicesScreen.js

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

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

  const durationOptions = [
    '15 mins',
    '30 mins',
    '45 mins',
    '1 hour',
    '1.5 hours',
    '2 hours',
    '2.5 hours',
    '3 hours',
    '3.5 hours',
    '4 hours',
    '4.5 hours',
    '5 hours',
    '6 hours',
    '7 hours',
    '8 hours',
  ];

  const [services, setServicesState] = useState(getInitialServices());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
              {/* SPECIALIZATION */}
              <View style={styles.inputGroup}>
                <View style={[styles.labelRow, { top: -10 }]}>
                  <Text style={styles.fieldLabel}>Specialization</Text>
                </View>
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
              </View>

              {/* DURATION */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Duration</Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Duration Info', 'Select maximum time required')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#FF4F8F" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setActiveServiceId(service.id);
                    setDurationPickerVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View pointerEvents="none">
                    <TextInput
                      placeholder="Select duration..."
                      placeholderTextColor="#C7AAA0"
                      value={service.duration}
                      style={styles.input}
                      editable={false}
                    />
                  </View>
                </TouchableOpacity>
                <Text style={styles.suggestionText}>Select maximum time required</Text>
              </View>

              {/* PRICE */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Price</Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Price Info', 'Select maximum price for the service')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color="#FF4F8F" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="e.g. 1500"
                  placeholderTextColor="#C7AAA0"
                  value={service.priceRange}
                  onChangeText={text =>
                    updateService(service.id, 'priceRange', text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={styles.suggestionText}>Select maximum price for the service</Text>
              </View>
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
              const DURATION_REGEX = /^\d+(\.\d+)?\s*(min|mins|minute|minutes|hr|hrs|hour|hours)$/i;
              
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
                
                if (!DURATION_REGEX.test(s.duration.trim())) {
                  Alert.alert('Validation Error', `Duration for ${specName} must be a valid time value (e.g. '2 hours' or '45 mins')`);
                  return;
                }
                
                if (!s.priceRange.trim()) {
                  Alert.alert('Validation Error', `Price is required for ${specName}`);
                  return;
                }
                
                const priceTrimmed = s.priceRange.trim();
                const isSinglePrice = /^\d+$/.test(priceTrimmed);
                
                if (!isSinglePrice) {
                  Alert.alert('Validation Error', `Price for ${specName} must be a valid number (e.g. '1500')`);
                  return;
                }
                
                const priceVal = parseInt(priceTrimmed, 10);
                if (priceVal <= 0) {
                  Alert.alert('Validation Error', `Price for ${specName} must be greater than 0`);
                  return;
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

      {/* DURATION PICKER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={durationPickerVisible}
        onRequestClose={() => setDurationPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDurationPickerVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Select Duration</Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {durationOptions.map((opt) => {
                const currentService = services.find(s => s.id === activeServiceId);
                const isSelected = currentService?.duration === opt;

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.sheetButton,
                      isSelected && styles.sheetButtonSelected
                    ]}
                    onPress={() => {
                      if (activeServiceId) {
                        updateService(activeServiceId, 'duration', opt);
                      }
                      setDurationPickerVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.sheetButtonText,
                      isSelected && styles.sheetButtonTextSelected
                    ]}>
                      {opt}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FF4F8F" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setDurationPickerVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    paddingTop: 14,
    paddingBottom: 18,
    marginBottom: 28,
  },

  inputGroup: {
    position: 'relative',
    marginTop: 18,
  },

  labelRow: {
    position: 'absolute',
    top: -10,
    left: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fieldLabel: {
    color: '#FF4F8F',
    fontSize: 13,
    fontWeight: '700',
  },

  suggestionText: {
    color: '#8A7D77',
    fontSize: 12,
    marginLeft: 18,
    marginTop: -8,
    marginBottom: 8,
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

  // MODAL BOTTOM SHEET

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 25,
    textAlign: 'center',
  },

  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  sheetButtonSelected: {
    backgroundColor: '#FFE4ED',
    borderRadius: 14,
  },

  sheetButtonText: {
    fontSize: 18,
    color: '#111',
  },

  sheetButtonTextSelected: {
    color: '#FF4F8F',
    fontWeight: '700',
  },

  cancelButton: {
    marginTop: 20,
    backgroundColor: '#FFE4ED',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },

  cancelText: {
    color: '#FF4F8F',
    fontSize: 18,
    fontWeight: '700',
  },
});

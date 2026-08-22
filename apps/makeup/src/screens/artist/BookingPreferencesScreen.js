import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';

const advanceNoticeOptions = ['24 Hours', '48 Hours', '1 Week', '2 Weeks', '1 Month'];
const trialOptions = ['Paid Trial', 'Free Trial', 'No Trial'];
const cancellationOptions = ['Strict (No Refund)', 'Moderate (Partial Refund)', 'Flexible (Full Refund)', 'Custom'];
const travelChargeTypes = ['Per KM', 'Fixed Cost', 'Not Applicable'];

const BookingPreferencesScreen = ({ navigation, route }) => {
  const { data, setBookingPolicy, setProfileInfo } = useArtistRegistration();

  const [advanceNotice, setAdvanceNotice] = useState(data.bookingPolicy?.advanceNotice || '');
  const [trialType, setTrialType] = useState(data.bookingPolicy?.trialType || '');
  const [trialPrice, setTrialPrice] = useState(data.bookingPolicy?.trialPrice || '');
  
  const [requiresAdvance, setRequiresAdvance] = useState(data.bookingPolicy?.requiresAdvance || false);
  const [advanceType, setAdvanceType] = useState(data.bookingPolicy?.advanceType || 'Percentage');
  const [advanceValue, setAdvanceValue] = useState(data.bookingPolicy?.advanceValue || '');
  
  const [cancellationPolicy, setCancellationPolicy] = useState(data.bookingPolicy?.cancellationPolicy || '');
  const [cancellationPolicyCustom, setCancellationPolicyCustom] = useState(data.bookingPolicy?.cancellationPolicyCustom || '');
  
  const [travelChargesType, setTravelChargesType] = useState(data.profile?.travelChargesType || '');
  const [travelChargeAmount, setTravelChargeAmount] = useState(data.profile?.travelChargeAmount || '');
  const [travelArea, setTravelArea] = useState(data.profile?.travelArea || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [options, setOptions] = useState([]);

  const openModal = (type) => {
    setModalType(type);
    if (type === 'advanceNotice') setOptions(advanceNoticeOptions);
    else if (type === 'trialType') setOptions(trialOptions);
    else if (type === 'cancellationPolicy') setOptions(cancellationOptions);
    else if (type === 'travelChargesType') setOptions(travelChargeTypes);
    setModalVisible(true);
  };

  const handleSelect = (val) => {
    if (modalType === 'advanceNotice') setAdvanceNotice(val);
    else if (modalType === 'trialType') setTrialType(val);
    else if (modalType === 'cancellationPolicy') setCancellationPolicy(val);
    else if (modalType === 'travelChargesType') setTravelChargesType(val);
    setModalVisible(false);
  };

  const isHomeService = data.profile?.homeService === 'Yes, I travel to client' || data.profile?.homeService === 'Both Studio and Home Service';

  const handleNext = async () => {
    if (requiresAdvance && !advanceValue) {
      Alert.alert('Validation Error', 'Please specify the advance booking deposit amount/percentage.');
      return;
    }
    
    if (trialType === 'Paid Trial' && !trialPrice) {
      Alert.alert('Validation Error', 'Please specify the trial price.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const policyPayload = {
        advanceNotice,
        trialType,
        trialPrice: (trialType === 'Paid Trial' && trialPrice) ? parseFloat(trialPrice) : null,
        requiresAdvance,
        advanceType,
        advanceValue: (requiresAdvance && advanceValue) ? parseFloat(advanceValue) : null,
        cancellationPolicy,
        cancellationPolicyCustom: cancellationPolicy === 'Custom' ? cancellationPolicyCustom : '',
      };
      
      const profileUpdates = {
        travelChargesType: isHomeService ? travelChargesType : '',
        travelChargeAmount: (isHomeService && travelChargeAmount) ? parseFloat(travelChargeAmount) : null,
        travelArea: isHomeService ? travelArea : '',
      };

      await updateArtistProfile({ bookingPolicy: policyPayload, profile: profileUpdates });
      setBookingPolicy(policyPayload);
      setProfileInfo(profileUpdates);
      
      if (route?.params?.fromPending) {
        navigation.navigate('ArtistRegistrationPending');
      } else {
        navigation.navigate('SocialLinksScreen', route.params);
      }
    } catch (error) {
      console.error('Save booking preferences error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save booking preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              Your <Text style={styles.pinkText}>Booking Rules</Text>{'\n'}
              Your Peace of Mind
            </Text>
          </View>

          {/* ADVANCE NOTICE */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Minimum Advance Notice for Booking</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => openModal('advanceNotice')}>
              <Text style={advanceNotice ? styles.inputText : styles.placeholder}>
                {advanceNotice || 'Select Notice Period'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {/* TRIAL MAKEUP */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Do you offer Trial Makeup?</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => openModal('trialType')}>
              <Text style={trialType ? styles.inputText : styles.placeholder}>
                {trialType || 'Select Trial Type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FF4F8F" />
            </TouchableOpacity>
          </View>
          
          {trialType === 'Paid Trial' && (
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Trial Price</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1500"
                keyboardType="numeric"
                value={trialPrice}
                onChangeText={setTrialPrice}
              />
            </View>
          )}

          {/* ADVANCE DEPOSIT */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Advance Deposit Required to Book?</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, requiresAdvance && styles.toggleBtnActive]}
                onPress={() => setRequiresAdvance(true)}
              >
                <Text style={[styles.toggleBtnText, requiresAdvance && styles.toggleBtnTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !requiresAdvance && styles.toggleBtnActive]}
                onPress={() => setRequiresAdvance(false)}
              >
                <Text style={[styles.toggleBtnText, !requiresAdvance && styles.toggleBtnTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          {requiresAdvance && (
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Deposit Amount</Text>
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.typeBtn, advanceType === 'Percentage' && styles.typeBtnActive]}
                  onPress={() => setAdvanceType('Percentage')}
                >
                  <Text style={[styles.typeBtnText, advanceType === 'Percentage' && styles.typeBtnTextActive]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, advanceType === 'Fixed' && styles.typeBtnActive]}
                  onPress={() => setAdvanceType('Fixed')}
                >
                  <Text style={[styles.typeBtnText, advanceType === 'Fixed' && styles.typeBtnTextActive]}>₹</Text>
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, marginLeft: 10 }]}
                  placeholder={advanceType === 'Percentage' ? "e.g. 50" : "e.g. 2000"}
                  keyboardType="numeric"
                  value={advanceValue}
                  onChangeText={setAdvanceValue}
                />
              </View>
            </View>
          )}

          {/* CANCELLATION POLICY */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Cancellation Policy</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => openModal('cancellationPolicy')}>
              <Text style={cancellationPolicy ? styles.inputText : styles.placeholder}>
                {cancellationPolicy || 'Select Policy'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FF4F8F" />
            </TouchableOpacity>
          </View>
          
          {cancellationPolicy === 'Custom' && (
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Custom Policy Details</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                multiline
                placeholder="Enter your cancellation rules"
                value={cancellationPolicyCustom}
                onChangeText={setCancellationPolicyCustom}
              />
            </View>
          )}

          {/* TRAVEL INFO (Only if Home Service) */}
          {isHomeService && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Travel & Outstation Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Travel / Outstation Charges</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => openModal('travelChargesType')}>
                  <Text style={travelChargesType ? styles.inputText : styles.placeholder}>
                    {travelChargesType || 'How do you charge for travel?'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              {(travelChargesType === 'Per KM' || travelChargesType === 'Fixed Cost') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Charge Amount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={travelChargesType === 'Per KM' ? "e.g. 10 per km" : "e.g. 500"}
                    keyboardType="numeric"
                    value={travelChargeAmount}
                    onChangeText={setTravelChargeAmount}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Max Travel Area Coverage (KM or City)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50 KMs or 'All over Pune'"
                  value={travelArea}
                  onChangeText={setTravelArea}
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.button, isSubmitting && { opacity: 0.7 }]} onPress={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={22} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Select Option</Text>
            {options.map((opt, idx) => (
              <TouchableOpacity key={idx} style={styles.sheetOption} onPress={() => handleSelect(opt)}>
                <Text style={styles.sheetOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default BookingPreferencesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerCard: {
    backgroundColor: '#FFE4ED', borderRadius: 30, paddingVertical: 28, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20,
  },
  headerText: { fontSize: 24, color: '#111', textAlign: 'center', lineHeight: 36, fontWeight: '700' },
  pinkText: { color: '#FF4F8F' },
  inputGroup: { marginBottom: 16 },
  fieldLabel: { color: '#FF4F8F', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 6 },
  input: { height: 56, borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 18, backgroundColor: '#FFF', paddingHorizontal: 18, color: '#111', fontSize: 15 },
  dropdown: { height: 56, borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 18, backgroundColor: '#FFF', paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputText: { color: '#111', fontSize: 15 },
  placeholder: { color: '#C7AAA0', fontSize: 15 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, height: 50, borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  toggleBtnActive: { backgroundColor: '#FF4F8F', borderColor: '#FF4F8F' },
  toggleBtnText: { color: '#C58B9C', fontWeight: '600', fontSize: 15 },
  toggleBtnTextActive: { color: '#FFF' },
  row: { flexDirection: 'row', alignItems: 'center' },
  typeBtn: { width: 56, height: 56, borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  typeBtnActive: { backgroundColor: '#FF4F8F', borderColor: '#FF4F8F' },
  typeBtnText: { color: '#C58B9C', fontWeight: '700', fontSize: 18 },
  typeBtnTextActive: { color: '#FFF' },
  sectionContainer: { marginTop: 10, padding: 20, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1.5, borderColor: '#FFD1E1', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 16 },
  button: { height: 64, backgroundColor: '#FF4F8F', borderRadius: 32, marginTop: 24, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  buttonText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 20, textAlign: 'center' },
  sheetOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F1F1' },
  sheetOptionText: { fontSize: 16, color: '#111', textAlign: 'center' },
  cancelBtn: { marginTop: 16, paddingVertical: 16, backgroundColor: '#FFE4ED', borderRadius: 18, alignItems: 'center' },
  cancelBtnText: { color: '#FF4F8F', fontSize: 16, fontWeight: '700' },
});

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';

const ARTIST_TYPES = [
  { id: 'freelancer', label: 'Individual / Freelancer', icon: 'person-outline' },
  { id: 'studio', label: 'Makeup Studio', icon: 'business-outline' },
  { id: 'salon', label: 'Salon', icon: 'cut-outline' },
  { id: 'team', label: 'Agency / Team', icon: 'people-outline' },
];

const ArtistTypeScreen = ({ navigation, route }) => {
  const { data, setArtistTypeInfo } = useArtistRegistration();
  
  const [selectedType, setSelectedType] = useState(data.artistTypeInfo?.artistType || '');
  const [businessName, setBusinessName] = useState(data.artistTypeInfo?.businessName || '');
  const [ownerName, setOwnerName] = useState(data.artistTypeInfo?.ownerName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your artist type.');
      return;
    }
    
    if (selectedType !== 'freelancer') {
      if (!businessName.trim()) {
        Alert.alert('Input Required', 'Please enter your Business Name.');
        return;
      }
      if (!ownerName.trim()) {
        Alert.alert('Input Required', 'Please enter the Owner Name.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        artistType: selectedType,
        businessName: selectedType === 'freelancer' ? '' : businessName.trim(),
        ownerName: selectedType === 'freelancer' ? '' : ownerName.trim(),
      };
      
      await updateArtistProfile(payload);
      setArtistTypeInfo(payload);
      
      if (route?.params?.fromPending) {
        navigation.navigate('ArtistRegistrationPending');
      } else {
        navigation.navigate('ArtistRegister2', route.params);
      }
    } catch (error) {
      console.error('Save step type error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to save artist type';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
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
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              What <Text style={styles.pinkText}>type</Text> of{'\n'}
              Artist are you?
            </Text>
          </View>

          <View style={styles.typeContainer}>
            {ARTIST_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={28} 
                    color={isSelected ? '#FFF' : '#FF4F8F'} 
                  />
                  <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                    {type.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={16} color="#FF4F8F" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedType && selectedType !== 'freelancer' && (
            <View style={styles.additionalFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Business / Studio Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Business Name"
                  placeholderTextColor="#C7AAA0"
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Owner Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Owner Name"
                  placeholderTextColor="#C7AAA0"
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
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
    </SafeAreaView>
  );
};

export default ArtistTypeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 30,
    paddingVertical: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: { fontSize: 24, color: '#111', textAlign: 'center', lineHeight: 36, fontWeight: '700' },
  pinkText: { color: '#FF4F8F' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  typeCardSelected: { backgroundColor: '#FF4F8F', borderColor: '#FF4F8F' },
  typeLabel: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#111', textAlign: 'center' },
  typeLabelSelected: { color: '#FFF' },
  checkBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12, padding: 2, borderWidth: 1, borderColor: '#FF4F8F' },
  additionalFields: { marginTop: 10, padding: 20, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1.5, borderColor: '#FFD1E1' },
  inputGroup: { marginBottom: 16 },
  fieldLabel: { color: '#FF4F8F', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  input: { height: 56, borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 16, backgroundColor: '#FAFAFA', paddingHorizontal: 16, color: '#111', fontSize: 15 },
  button: { height: 64, backgroundColor: '#FF4F8F', borderRadius: 32, marginTop: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  buttonText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
});

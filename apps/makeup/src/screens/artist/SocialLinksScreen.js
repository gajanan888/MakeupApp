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

const SocialLinksScreen = ({ navigation, route }) => {
  const { data, setSocialLinks } = useArtistRegistration();

  const [instagram, setInstagram] = useState(data.socialLinks?.instagram || '');
  const [facebook, setFacebook] = useState(data.socialLinks?.facebook || '');
  const [youtube, setYoutube] = useState(data.socialLinks?.youtube || '');
  const [website, setWebsite] = useState(data.socialLinks?.website || '');
  const [whatsapp, setWhatsapp] = useState(data.socialLinks?.whatsapp || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        youtube: youtube.trim(),
        website: website.trim(),
        whatsapp: whatsapp.trim(),
      };
      
      await updateArtistProfile({ socialLinks: payload });
      setSocialLinks(payload);
      
      if (route?.params?.fromPending) {
        navigation.navigate('ArtistRegistrationPending');
      } else {
        navigation.navigate('ArtistRegister6', route.params); // Go to payment info
      }
    } catch (error) {
      console.error('Save social links error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save social links');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (route?.params?.fromPending) {
      navigation.navigate('ArtistRegistrationPending');
    } else {
      navigation.navigate('ArtistRegister6', route.params); // Go to payment info
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>Optional Step</Text>
            </View>
            <Text style={styles.headerText}>
              Connect Your{'\n'}
              <Text style={styles.pinkText}>Social Profiles</Text>
            </Text>
            <Text style={styles.subHeaderText}>
              Add your social media handles to build trust, or skip and add them anytime later.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Instagram URL (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="logo-instagram" size={20} color="#FF4F8F" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. instagram.com/username"
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Facebook URL (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="logo-facebook" size={20} color="#FF4F8F" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. facebook.com/username"
                value={facebook}
                onChangeText={setFacebook}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>YouTube URL (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="logo-youtube" size={20} color="#FF4F8F" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. youtube.com/c/channel"
                value={youtube}
                onChangeText={setYoutube}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Website (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="globe-outline" size={20} color="#FF4F8F" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. yourwebsite.com"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Business WhatsApp Number (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="logo-whatsapp" size={20} color="#FF4F8F" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                value={whatsapp}
                onChangeText={setWhatsapp}
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.button, isSubmitting && { opacity: 0.7 }]} onPress={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Save & Continue</Text>
                <Ionicons name="arrow-forward" size={22} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={isSubmitting}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SocialLinksScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F7F7' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerCard: {
    backgroundColor: '#FFE4ED', borderRadius: 30, paddingVertical: 24, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 24,
  },
  optionalBadge: {
    backgroundColor: '#FF4F8F20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FF4F8F40',
  },
  optionalBadgeText: { color: '#FF4F8F', fontSize: 12, fontWeight: '700' },
  headerText: { fontSize: 24, color: '#111', textAlign: 'center', lineHeight: 34, fontWeight: '700' },
  subHeaderText: { fontSize: 13, color: '#6F625D', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  pinkText: { color: '#FF4F8F' },
  inputGroup: { marginBottom: 18 },
  fieldLabel: { color: '#FF4F8F', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD1E1', borderRadius: 18, backgroundColor: '#FFF', paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 56, color: '#111', fontSize: 15 },
  button: { height: 60, backgroundColor: '#FF4F8F', borderRadius: 30, marginTop: 24, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  skipButton: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  skipButtonText: { color: '#6F625D', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  Modal,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { getArtistProfile, updateArtistProfile } from '../../api/auth';

const ArtistProfileScreen = ({ onBack }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  // Profile States
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    bio: '',
    businessName: '',
    businessHours: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Notification States
  const [notifications, setNotifications] = useState({
    push: true,
    reminders: true,
    promo: false,
  });

  // Modal Visibility States
  const [activeModal, setActiveModal] = useState(null); // 'edit_profile' | 'business' | 'documents' | 'bank' | 'notifications' | 'password' | 'help' | null

  // Edit Forms States
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const [editBizName, setEditBizName] = useState('');
  const [editBizHours, setEditBizHours] = useState('');

  const [editBankName, setEditBankName] = useState('');
  const [editAccountNo, setEditAccountNo] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getArtistProfile();
      if (data) {
        const mappedProfile = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.profile?.location || 'Location not set',
          experience: data.profile?.experience || 'Experience not set',
          bio: data.profile?.bio || '',
          businessName: data.profile?.businessName || data.name || '',
          businessHours: data.profile?.businessHours || '09:00 AM - 08:00 PM',
          bankName: data.payment?.bankName || '',
          accountNumber: data.payment?.accountNumber || '',
          ifscCode: data.payment?.ifscCode || '',
          profileImage: data.profile?.profileImage || '',
        };
        setProfile(mappedProfile);

        // Update edit states so they match the loaded data
        setEditName(mappedProfile.name);
        setEditEmail(mappedProfile.email);
        setEditPhone(mappedProfile.phone);
        setEditLocation(mappedProfile.location);
        setEditBizName(mappedProfile.businessName);
        setEditBizHours(mappedProfile.businessHours);
        setEditBankName(mappedProfile.bankName);
        setEditAccountNo(mappedProfile.accountNumber);
        setEditIfsc(mappedProfile.ifscCode);
      }
    } catch (error) {
      console.error('Failed to load profile', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Save profile changes
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    try {
      await updateArtistProfile({
        name: editName,
        email: editEmail,
        phone: editPhone,
        profile: {
          location: editLocation,
        }
      });
      Alert.alert('Success', 'Profile updated successfully.');
      setActiveModal(null);
      await loadProfile();
    } catch (error) {
      console.error('Failed to save profile details', error);
      Alert.alert('Error', error.message || 'Failed to save profile details.');
    }
  };

  // Handle Save business details
  const handleSaveBusiness = async () => {
    try {
      await updateArtistProfile({
        profile: {
          businessName: editBizName,
          businessHours: editBizHours,
        }
      });
      Alert.alert('Success', 'Business information updated.');
      setActiveModal(null);
      await loadProfile();
    } catch (error) {
      console.error('Failed to save business details', error);
      Alert.alert('Error', error.message || 'Failed to save business details.');
    }
  };

  // Handle Save bank details
  const handleSaveBank = async () => {
    const bankUpdatePayload = {};
    if (editBankName.trim()) {
      bankUpdatePayload.bankName = editBankName;
    }
    if (editAccountNo.trim() && !editAccountNo.includes('*')) {
      bankUpdatePayload.accountNumber = editAccountNo;
    }
    if (editIfsc.trim() && !editIfsc.includes('*')) {
      bankUpdatePayload.ifscCode = editIfsc;
    }

    try {
      await updateArtistProfile({
        payment: bankUpdatePayload
      });
      Alert.alert('Success', 'Bank details updated.');
      setActiveModal(null);
      await loadProfile();
    } catch (error) {
      console.error('Failed to save bank details', error);
      Alert.alert('Error', error.message || 'Failed to save bank details.');
    }
  };

  // Handle Update Password
  const handleUpdatePassword = () => {
    if (!currPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveModal(null);
    Alert.alert('Success', 'Password changed successfully.');
  };

  // Handle Logout action
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            navigation.navigate('ArtistLogin');
          }
        }
      ]
    );
  };

  // Sub-Modal Content Renderer
  const renderModalContent = () => {
    switch (activeModal) {
      case 'edit_profile':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Edit Profile Info</Text>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={editLocation}
              onChangeText={setEditLocation}
            />

            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSaveProfile}>
              <Text style={styles.modalSubmitText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        );

      case 'business':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Business Information</Text>
            
            <Text style={styles.inputLabel}>Studio / Business Name</Text>
            <TextInput
              style={styles.textInput}
              value={editBizName}
              onChangeText={setEditBizName}
            />

            <Text style={styles.inputLabel}>Business Hours</Text>
            <TextInput
              style={styles.textInput}
              value={editBizHours}
              onChangeText={setEditBizHours}
            />

            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSaveBusiness}>
              <Text style={styles.modalSubmitText}>Save Details</Text>
            </TouchableOpacity>
          </View>
        );

      case 'documents':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Verified Documents</Text>

            <View style={styles.docRow}>
              <Ionicons name="document-text" size={24} color="#FF4F8F" />
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Aadhaar Card</Text>
                <Text style={styles.docVerifiedStatus}>Verified on Jan 12, 2024</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#389E0D" />
            </View>

            <View style={styles.docRow}>
              <Ionicons name="ribbon" size={24} color="#FF4F8F" />
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Professional Makeup Certification</Text>
                <Text style={styles.docVerifiedStatus}>Verified on Jan 15, 2024</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#389E0D" />
            </View>

            <TouchableOpacity style={styles.docUploadButton} onPress={() => Alert.alert('Upload', 'Upload Document flow started.')}>
              <Ionicons name="cloud-upload-outline" size={20} color="#FF4F8F" style={{ marginRight: 8 }} />
              <Text style={styles.docUploadText}>Upload New Document</Text>
            </TouchableOpacity>
          </View>
        );

      case 'bank':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Bank Details</Text>
            
            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.textInput}
              value={editBankName}
              onChangeText={setEditBankName}
            />

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.textInput}
              value={editAccountNo}
              onChangeText={setEditAccountNo}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.textInput}
              value={editIfsc}
              onChangeText={setEditIfsc}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleSaveBank}>
              <Text style={styles.modalSubmitText}>Save Bank Details</Text>
            </TouchableOpacity>
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Notification Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchTitle}>Push Notifications</Text>
                <Text style={styles.switchDesc}>Receive instant sound updates for actions</Text>
              </View>
              <Switch
                value={notifications.push}
                onValueChange={(val) => setNotifications(prev => ({ ...prev, push: val }))}
                trackColor={{ false: '#F5F5F5', true: '#FFE4ED' }}
                thumbColor={notifications.push ? '#FF4F8F' : '#E8E8E8'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchTitle}>Booking Reminders</Text>
                <Text style={styles.switchDesc}>Reminders about upcoming appointments</Text>
              </View>
              <Switch
                value={notifications.reminders}
                onValueChange={(val) => setNotifications(prev => ({ ...prev, reminders: val }))}
                trackColor={{ false: '#F5F5F5', true: '#FFE4ED' }}
                thumbColor={notifications.reminders ? '#FF4F8F' : '#E8E8E8'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchTitle}>Promotional Emails</Text>
                <Text style={styles.switchDesc}>Get deals and new feature announcements</Text>
              </View>
              <Switch
                value={notifications.promo}
                onValueChange={(val) => setNotifications(prev => ({ ...prev, promo: val }))}
                trackColor={{ false: '#F5F5F5', true: '#FFE4ED' }}
                thumbColor={notifications.promo ? '#FF4F8F' : '#E8E8E8'}
              />
            </View>

            <TouchableOpacity style={styles.modalSubmitButton} onPress={() => { setActiveModal(null); Alert.alert('Success', 'Notification preferences saved.'); }}>
              <Text style={styles.modalSubmitText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        );

      case 'password':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Change Password</Text>
            
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={currPassword}
              onChangeText={setCurrPassword}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.textInput}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.modalSubmitButton} onPress={handleUpdatePassword}>
              <Text style={styles.modalSubmitText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        );

      case 'help':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Help & Support</Text>

            <Text style={styles.helpText}>
              For any queries or account assistance, please contact our support team. We're active 24/7.
            </Text>

            <TouchableOpacity style={styles.supportButton} onPress={() => Alert.alert('Email support', 'Compose email to support@glamapp.com')}>
              <Ionicons name="mail" size={20} color="#FF4F8F" style={{ marginRight: 10 }} />
              <Text style={styles.supportBtnText}>support@glamapp.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportButton} onPress={() => Alert.alert('Call support', 'Dial +91 1800 123 4567')}>
              <Ionicons name="call" size={20} color="#FF4F8F" style={{ marginRight: 10 }} />
              <Text style={styles.supportBtnText}>+91 1800 123 4567</Text>
            </TouchableOpacity>

            <Text style={[styles.helpText, { marginTop: 15, fontWeight: '700' }]}>Frequently Asked Questions</Text>
            <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do payouts work?</Text>
                <Text style={styles.faqAnswer}>Payouts are credited directly to your bank account weekly every Wednesday.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I edit my services list?</Text>
                <Text style={styles.faqAnswer}>Yes, you can edit services, categories, and pricing from the home dashboard quick links.</Text>
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCFCFC' }}>
        <ActivityIndicator size="large" color="#FF4F8F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile & Settings</Text>

        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
            style={styles.avatar}
          />
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{profile.name}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#1890FF" style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFC53D" />
              <Text style={styles.ratingText}> 4.8 (128)</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#8A7D77" />
              <Text style={styles.locationText}> {profile.location}</Text>
            </View>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{profile.experience || '0 Yrs'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* MENU OPTIONS LIST */}
        <View style={styles.optionsList}>
          {/* Edit Profile */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('edit_profile')}>
            <View style={styles.optionLeft}>
              <Ionicons name="pencil-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Business Info */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('business')}>
            <View style={styles.optionLeft}>
              <Ionicons name="briefcase-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Business Information</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Documents */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('documents')}>
            <View style={styles.optionLeft}>
              <Ionicons name="document-text-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Documents</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Bank Details */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('bank')}>
            <View style={styles.optionLeft}>
              <Ionicons name="card-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Bank Details</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('notifications')}>
            <View style={styles.optionLeft}>
              <Ionicons name="notifications-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('password')}>
            <View style={styles.optionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('help')}>
            <View style={styles.optionLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#555" />
              <Text style={styles.optionLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#8A7D77" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.optionRow} onPress={handleLogout}>
            <View style={styles.optionLeft}>
              <Ionicons name="log-out-outline" size={20} color="#FF4F8F" />
              <Text style={[styles.optionLabel, styles.logoutLabelText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={16} color="#FF4F8F" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* DYNAMIC SETTINGS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={activeModal !== null}
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Close Button Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {renderModalContent()}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ArtistProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 10,
    height: Platform.OS === 'ios' ? 60 : 60 + (StatusBar.currentHeight || 0),
    backgroundColor: '#FCFCFC',
  },

  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4ED',
  },

  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF851B',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationText: {
    fontSize: 13,
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  statColumn: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  statLabel: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F3ECF0',
    alignSelf: 'center',
  },

  optionsList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EFF2',
  },

  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'serif',
    marginLeft: 14,
  },

  logoutLabelText: {
    color: '#FF4F8F',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
    paddingBottom: 12,
  },

  modalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7D77',
    fontFamily: 'serif',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  modalSubTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 20,
  },

  modalBody: {
    paddingBottom: 20,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
    marginBottom: 6,
    marginTop: 10,
  },

  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#FFE4ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    backgroundColor: '#FCFCFC',
    marginBottom: 10,
  },

  modalSubmitButton: {
    backgroundColor: '#FF4F8F',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
  },

  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#F3ECF0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  docInfo: {
    flex: 1,
    marginLeft: 14,
  },

  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  docVerifiedStatus: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },

  docUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FF4F8F',
    backgroundColor: '#FFF9FB',
    borderRadius: 12,
    height: 50,
    marginTop: 10,
  },

  docUploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EFF2',
  },

  switchLabelContainer: {
    flex: 1,
    paddingRight: 16,
  },

  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  switchDesc: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },

  helpText: {
    fontSize: 14,
    color: '#8A7D77',
    fontFamily: 'serif',
    lineHeight: 20,
    marginBottom: 16,
  },

  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9FB',
    borderWidth: 1,
    borderColor: '#FFE4ED',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  supportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },

  faqItem: {
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#F3ECF0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  faqAnswer: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 4,
  },
});
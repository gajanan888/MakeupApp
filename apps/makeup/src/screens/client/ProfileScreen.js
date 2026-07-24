import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
import { getCustomerProfile, updateCustomerProfile } from '../../api/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { getSavedAddresses, deleteSavedAddress } from '../../utils/addressStorage';

const FAQs = [
  {
    question: 'How do I cancel a booking?',
    answer: 'Navigate to the Bookings tab, select your upcoming booking, and tap "Request Cancellation". If the booking is accepted or in progress, cancellation policies might apply.',
  },
  {
    question: 'Can I contact artists before booking?',
    answer: 'Yes! You can browse makeup artists in the Search tab, visit their profiles, and start a chat conversation to discuss specifications and reference images.',
  },
  {
    question: 'How does the AI Recommendation Wizard work?',
    answer: 'The wizard asks about your skin type, preferred event styles, and budget constraints to calculate compatibility percentages and matches you with top-suited makeup artists.',
  },
  {
    question: 'Are payments secure?',
    answer: 'Absolutely. All invoices and transactions are securely processed via industry-standard banking modules, ensuring your financial information is fully encrypted.',
  },
];

const ProfileScreen = ({ navigation, isTab = false }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal Visibility States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  // Notification Toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  // FAQ Accordion State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getCustomerProfile();
      if (data) {
        setProfile(data);
        setEditName(data.name || '');
        setEditEmail(data.email || '');
        setEditPhone(data.phone || '');
      }
    } catch (error) {
      console.warn('Failed to load customer profile:', error);
      if (!silent) Alert.alert('Error', 'Could not load your profile details.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const addrs = await getSavedAddresses();
      setSavedAddresses(addrs);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadSavedAddresses();

    const interval = setInterval(() => {
      fetchProfile(true);
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (addressModalVisible) {
      loadSavedAddresses();
    }
  }, [addressModalVisible]);

  const handleDeleteAddress = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await deleteSavedAddress(id);
            setSavedAddresses(updated);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (editPhone.trim().replace(/\D/g, '').length < 10) {
      Alert.alert('Validation Error', 'Phone number must be at least 10 digits.');
      return;
    }

    try {
      setUpdating(true);
      const updated = await updateCustomerProfile({
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim(),
      });
      if (updated) {
        setProfile(updated);
        await AsyncStorage.setItem('customerName', updated.name);
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (error) {
      Alert.alert('Update Failed', error?.message || 'Could not update profile details.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        
        try {
          setUploadingImage(true);
          const uploadedUrl = await uploadFile(selectedAsset);
          
          if (uploadedUrl) {
             const updated = await updateCustomerProfile({
               profileImage: uploadedUrl,
             });
             
             if (updated) {
               setProfile(updated);
             }
          }
        } catch (error) {
           console.warn('Upload failed', error);
           Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
        } finally {
           setUploadingImage(false);
        }
      }
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('customerName');
              await AsyncStorage.removeItem('customerEmail');
              await AsyncStorage.removeItem('customerId');
              await AsyncStorage.removeItem('userRole');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (err) {
              console.warn('Logout failed:', err);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderOptionRow = (iconName, titleText, onPressAction) => {
    return (
      <TouchableOpacity style={styles.optionRow} onPress={onPressAction} activeOpacity={0.7}>
        <View style={styles.leftOptionSide}>
          <Ionicons name={iconName} size={22} color="#444" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>{titleText}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isTab && { paddingTop: 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        {isTab ? (
          <View style={{ width: 40 }} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF4F87" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Details Box */}
          <View style={styles.userCard}>
            <TouchableOpacity onPress={handleSelectImage} disabled={uploadingImage}>
              {uploadingImage ? (
                 <View style={[styles.avatarCircle, { backgroundColor: '#F0F0F0' }]}>
                   <ActivityIndicator size="small" color="#FF4F87" />
                 </View>
              ) : profile?.profileImage ? (
                <View>
                  <Image source={{ uri: profile.profileImage }} style={styles.avatarImage} />
                  <View style={styles.editIconBadge}>
                    <Ionicons name="camera" size={12} color="#FFF" />
                  </View>
                </View>
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{getInitials(profile?.name)}</Text>
                  <View style={styles.editIconBadge}>
                    <Ionicons name="camera" size={12} color="#FFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.userName}>{profile?.name || 'Emma Williams'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'emma.williams@gmail.com'}</Text>
          </View>

          {/* Settings Options List */}
          <View style={styles.optionsContainer}>
            {renderOptionRow('person-outline', 'Edit Profile', () => setEditModalVisible(true))}
            {renderOptionRow('location-outline', 'My Addresses', () => setAddressModalVisible(true))}
            {renderOptionRow('card-outline', 'Payment Methods', () => setPaymentModalVisible(true))}
            {renderOptionRow('notifications-outline', 'Notifications', () => setNotifModalVisible(true))}
            {renderOptionRow('help-circle-outline', 'Help & Support', () => setFaqModalVisible(true))}
            {renderOptionRow('information-circle-outline', 'About Us', () => setAboutModalVisible(true))}
          </View>

          {/* Logout Trigger */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                placeholderTextColor="#999"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter email"
                placeholderTextColor="#999"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* My Addresses Modal */}
      <Modal visible={addressModalVisible} animationType="slide" transparent onRequestClose={() => setAddressModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>My Addresses</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {savedAddresses.length > 0 ? (
                savedAddresses.map((addr) => (
                  <View key={addr.id} style={styles.addressCardItem}>
                    <View style={styles.addressCardHeader}>
                      <View style={[styles.addressBadge, { backgroundColor: addr.iconBg || '#E6FFED' }]}>
                        <Ionicons name={addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'location'} size={14} color={addr.iconColor || '#389E0D'} />
                        <Text style={[styles.addressBadgeText, { color: addr.iconColor || '#389E0D' }]}>{addr.label || 'Saved'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                    {addr.name ? <Text style={styles.addressNameText}>{addr.name}</Text> : null}
                    <Text style={styles.addressLineText}>{addr.addressLine || addr.address}</Text>
                    {addr.phone ? <Text style={styles.addressPhoneText}>Contact: {addr.phone}</Text> : null}
                  </View>
                ))
              ) : (
                <View style={styles.modalContentBody}>
                  <Ionicons name="location-outline" size={48} color="#FF4F87" style={{ alignSelf: 'center', marginBottom: 12 }} />
                  <Text style={styles.placeholderModalText}>Address list is empty. You can set address requirements while booking makeup services.</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() => {
                  setAddressModalVisible(false);
                  navigation.navigate('SelectLocation');
                }}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addAddressBtnText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Payment Methods</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentBody}>
              <Ionicons name="card-outline" size={48} color="#FF4F87" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.placeholderModalText}>No cards or billing profiles linked yet. Transactions are securely managed on invoicing checks.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notifModalVisible} animationType="slide" transparent onRequestClose={() => setNotifModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentBody}>
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefHeading}>Push Notifications</Text>
                  <Text style={styles.prefSubheading}>Receive alerts about booking status updates</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPushEnabled(!pushEnabled)}
                  style={[styles.toggleTrack, pushEnabled && styles.toggleTrackActive]}
                >
                  <View style={[styles.toggleThumb, pushEnabled && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
              <View style={styles.prefRow}>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefHeading}>Newsletter & Promos</Text>
                  <Text style={styles.prefSubheading}>Get makeup discount alerts and deals</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEmailEnabled(!emailEnabled)}
                  style={[styles.toggleTrack, emailEnabled && styles.toggleTrackActive]}
                >
                  <View style={[styles.toggleThumb, emailEnabled && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support FAQ Modal */}
      <Modal visible={faqModalVisible} animationType="slide" transparent onRequestClose={() => setFaqModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>Help & Support</Text>
              <TouchableOpacity onPress={() => setFaqModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {FAQs.map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <View key={index} style={styles.faqCard}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#666"
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.faqBody}>
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Us Modal */}
      <Modal visible={aboutModalVisible} animationType="slide" transparent onRequestClose={() => setAboutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>About Us</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContentBody}>
              <Ionicons name="sparkles" size={42} color="#FF4F87" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={[styles.placeholderModalText, { fontWeight: '700', color: '#111' }]}>MakeupApp v1.0.0</Text>
              <Text style={styles.placeholderModalText}>Bringing premium, AI-driven makeup matchings and booking connections directly to your device.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {!isTab && <BottomNavigation navigation={navigation} activeTab="Profile" />}
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FCFCFC',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FCFCFC',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE6EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF4F87',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    backgroundColor: '#FF4F87',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCFCFC',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  userEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  optionsContainer: {
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  leftOptionSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 14,
    color: '#333',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#FF4F87',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Modals and Forms */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  modalContentBody: {
    paddingVertical: 20,
  },
  placeholderModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    paddingBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#FF4F87',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Notification styling */
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  prefTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  prefHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  prefSubheading: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#FF4F87',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 1,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },

  /* FAQ Accordion */
  faqCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222',
    flex: 1,
    marginRight: 12,
  },
  faqBody: {
    paddingBottom: 14,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  /* Address Card Styles */
  addressCardItem: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEF2',
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  addressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  addressLineText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 4,
  },
  addressPhoneText: {
    fontSize: 12,
    color: '#777',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4F87',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  addAddressBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

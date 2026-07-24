import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getArtistProfile, updateArtistProfile, getArtistDashboard, changeArtistPassword } from '../../api/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';

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
    parlourName: '',
    parlourAddress: '',
    portfolio: [],
  });

  const [stats, setStats] = useState({
    bookingsCount: 0,
    rating: 4.8,
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
  const [editParlourName, setEditParlourName] = useState('');
  const [editParlourAddress, setEditParlourAddress] = useState('');

  const [editBankName, setEditBankName] = useState('');
  const [editAccountNo, setEditAccountNo] = useState('');
  const [editIfsc, setEditIfsc] = useState('');

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Portfolio Grid & Details States
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostTag, setNewPostTag] = useState('Bridal');
  const [newPostImages, setNewPostImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingPostIndex, setEditingPostIndex] = useState(null);
  const [editPostDesc, setEditPostDesc] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [modalWidth, setModalWidth] = useState(340);
  const [fullImageUri, setFullImageUri] = useState(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [adjustingImageIndex, setAdjustingImageIndex] = useState(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropTranslateX, setCropTranslateX] = useState(0);
  const [cropTranslateY, setCropTranslateY] = useState(0);

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
          parlourName: data.profile?.parlourName || '',
          parlourAddress: data.profile?.parlourAddress || '',
          portfolio: data.portfolio || [],
        };
        setProfile(mappedProfile);

        // Update edit states so they match the loaded data
        setEditName(mappedProfile.name);
        setEditEmail(mappedProfile.email);
        setEditPhone(mappedProfile.phone);
        setEditLocation(mappedProfile.location);
        setEditBizName(mappedProfile.businessName);
        setEditBizHours(mappedProfile.businessHours);
        setEditParlourName(mappedProfile.parlourName);
        setEditParlourAddress(mappedProfile.parlourAddress);
        setEditBankName(mappedProfile.bankName);
        setEditAccountNo(mappedProfile.accountNumber);
        setEditIfsc(mappedProfile.ifscCode);
      }

      try {
        const dashboardData = await getArtistDashboard();
        if (dashboardData && dashboardData.stats) {
          setStats({
            bookingsCount: dashboardData.stats.totalBookings || 0,
            rating: dashboardData.stats.rating || 4.8,
          });
        }
      } catch (dashError) {
        console.warn('Failed to load dashboard stats in profile:', dashError);
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
    if (editParlourName.trim() && !editParlourAddress.trim()) {
      Alert.alert('Error', 'Please enter the parlour address if you specify a parlour name.');
      return;
    }
    if (editParlourAddress.trim() && !editParlourName.trim()) {
      Alert.alert('Error', 'Please enter the parlour name if you specify a parlour address.');
      return;
    }
    try {
      await updateArtistProfile({
        profile: {
          businessName: editBizName,
          businessHours: editBizHours,
          parlourName: editParlourName.trim() || null,
          parlourAddress: editParlourAddress.trim() || null,
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

  // Handle Upload Work Portfolio Image
  const handleUploadWork = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.didCancel || response.errorCode) return;
      if (!response.assets || response.assets.length === 0) return;

      const asset = response.assets[0];
      try {
        setLoading(true);
        const imageUrl = await uploadFile({
          uri: asset.uri,
          name: asset.fileName || 'portfolio_work.jpg',
          type: asset.type || 'image/jpeg',
        });

        const currentPortfolio = profile.portfolio || [];
        const updatedPortfolio = [
          ...currentPortfolio,
          {
            afterImageUrl: imageUrl,
            tag: 'Makeup Work',
            description: 'My portfolio upload',
          },
        ];

        await updateArtistProfile({
          portfolio: updatedPortfolio,
        });

        Alert.alert('Success', 'Image uploaded to portfolio.');
        await loadProfile();
      } catch (err) {
        console.warn('Portfolio upload error:', err);
        Alert.alert('Error', err.message || 'Failed to upload portfolio image.');
      } finally {
        setLoading(false);
      }
    });
  };

  // Handle Update Password
  const handleUpdatePassword = async () => {
    if (!currPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    try {
      await changeArtistPassword(currPassword, newPassword);
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
      Alert.alert('Success', 'Password changed successfully.');
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to change password.');
    }
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
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userRole');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (err) {
              console.warn('Logout failed:', err);
            }
          }
        }
      ]
    );
  };

  const handleSelectPostImages = () => {
    const currentCount = newPostImages.length;
    if (currentCount >= 10) {
      Alert.alert('Limit Reached', 'You can post a maximum of 10 photos at once.');
      return;
    }

    const remainingLimit = 10 - currentCount;

    launchImageLibrary({ mediaType: 'photo', selectionLimit: remainingLimit, quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (!response.assets || response.assets.length === 0) return;

      const selectedAssets = response.assets.slice(0, remainingLimit);

      setNewPostImages(prev => [
        ...prev,
        ...selectedAssets.map(asset => ({
          uri: asset.uri,
          fileName: asset.fileName || 'work_image.jpg',
          type: asset.type || 'image/jpeg',
          scale: 1.0,
          translateX: 0,
          translateY: 0,
        }))
      ]);
    });
  };

  const startAdjustingImage = (index) => {
    const img = newPostImages[index];
    setAdjustingImageIndex(index);
    setCropScale(img.scale || 1.0);
    setCropTranslateX(img.translateX || 0);
    setCropTranslateY(img.translateY || 0);
    setActiveModal('adjust_image');
  };

  const saveImageAdjustments = () => {
    if (adjustingImageIndex === null) return;
    setNewPostImages(prev => prev.map((img, idx) => {
      if (idx === adjustingImageIndex) {
        return {
          ...img,
          scale: cropScale,
          translateX: cropTranslateX,
          translateY: cropTranslateY,
        };
      }
      return img;
    }));
    setActiveModal('add_post');
  };

  const handleCreatePost = async () => {
    if (newPostImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image.');
      return;
    }

    if (newPostImages.length > 10) {
      Alert.alert('Limit Exceeded', 'You can post a maximum of 10 photos at once.');
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = newPostImages.map(img => 
        uploadFile({
          uri: img.uri,
          name: img.fileName,
          type: img.type,
        })
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      const newPostItem = {
        images: uploadedUrls.map((url, index) => {
          const img = newPostImages[index];
          return {
            url,
            scale: img.scale || 1.0,
            translateX: img.translateX || 0,
            translateY: img.translateY || 0,
          };
        }),
        description: newPostDesc,
        tag: newPostTag.trim() || 'Makeup Work',
      };

      const updatedPortfolio = [...(profile.portfolio || []), newPostItem];

      await updateArtistProfile({
        portfolio: updatedPortfolio,
      });

      Alert.alert('Success', 'Portfolio post added successfully!');
      setNewPostDesc('');
      setNewPostTag('Bridal');
      setNewPostImages([]);
      setActiveModal(null);
      await loadProfile();
    } catch (err) {
      console.warn('Post creation error:', err);
      Alert.alert('Error', err.message || 'Failed to create portfolio post.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEditCaption = async () => {
    if (editingPostIndex === null || !selectedPost) return;

    try {
      setLoading(true);
      const updatedPortfolio = (profile.portfolio || []).map((item, idx) => {
        if (idx === editingPostIndex) {
          return { ...item, description: editPostDesc };
        }
        return item;
      });

      await updateArtistProfile({
        portfolio: updatedPortfolio,
      });

      Alert.alert('Success', 'Caption updated successfully!');
      setEditingPostIndex(null);
      setActiveModal(null);
      await loadProfile();
    } catch (err) {
      console.warn('Caption edit error:', err);
      Alert.alert('Error', err.message || 'Failed to update caption.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (idxToDelete) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedPortfolio = (profile.portfolio || []).filter((_, idx) => idx !== idxToDelete);

              await updateArtistProfile({
                portfolio: updatedPortfolio,
              });

              Alert.alert('Success', 'Post deleted successfully!');
              setActiveModal(null);
              await loadProfile();
            } catch (err) {
              console.warn('Delete post error:', err);
              Alert.alert('Error', err.message || 'Failed to delete post.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    if (slideSize > 0) {
      const index = Math.round(offset / slideSize);
      setActiveSlideIndex(index);
    }
  };

  const handlePostMenuPress = () => {
    setShowPostOptions(true);
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

            <Text style={styles.inputLabel}>Parlour Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={editParlourName}
              onChangeText={setEditParlourName}
              placeholder="e.g. Blossom Beauty Parlour"
              placeholderTextColor="#B7A9A1"
            />

            <Text style={styles.inputLabel}>Parlour Address (Optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              value={editParlourAddress}
              onChangeText={setEditParlourAddress}
              placeholder="Full address of your parlour..."
              placeholderTextColor="#B7A9A1"
              multiline
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

      case 'portfolio':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>My Work Portfolio</Text>

            {profile.portfolio && profile.portfolio.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginBottom: 20 }}
              >
                {profile.portfolio.map((item, index) => (
                  <View key={index} style={{ marginRight: 12, alignItems: 'center' }}>
                    <Image
                      source={{ uri: item.afterImageUrl || item.afterImage }}
                      style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#FFE4ED' }}
                    />
                    <Text style={{ fontSize: 11, color: '#8A7D77', marginTop: 6, fontFamily: 'serif' }}>
                      {item.tag || 'Makeup Work'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Ionicons name="images-outline" size={48} color="#E0D8DB" />
                <Text style={{ fontSize: 13, color: '#8A7D77', marginTop: 8, fontFamily: 'serif' }}>
                  No photos uploaded to your portfolio yet.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.docUploadButton} onPress={handleUploadWork}>
              <Ionicons name="cloud-upload-outline" size={20} color="#FF4F8F" style={{ marginRight: 8 }} />
              <Text style={styles.docUploadText}>Upload Work Photo</Text>
            </TouchableOpacity>
          </View>
        );

      case 'settings':
        return (
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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

            {/* Portfolio */}
            <TouchableOpacity style={styles.optionRow} onPress={() => setActiveModal('portfolio')}>
              <View style={styles.optionLeft}>
                <Ionicons name="images-outline" size={20} color="#555" />
                <Text style={styles.optionLabel}>My Work Portfolio</Text>
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
            <TouchableOpacity style={styles.optionRow} onPress={() => { setActiveModal(null); handleLogout(); }}>
              <View style={styles.optionLeft}>
                <Ionicons name="log-out-outline" size={20} color="#FF4F8F" />
                <Text style={[styles.optionLabel, styles.logoutLabelText]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color="#FF4F8F" />
            </TouchableOpacity>
          </ScrollView>
        );

      case 'add_post':
        const commonMakeupTags = ['Bridal', 'Party Makeup', 'HD Makeup', 'Airbrush', 'Engagement', 'Reception', 'Haldi', 'Sangeet', 'Editorial', 'Natural Look', 'Glam Makeup', 'SFX'];
        
        return (
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubTitle}>Create New Post</Text>
            
            {/* Makeup Type Tag Selection */}
            <Text style={styles.inputLabel}>Makeup Type / Specialization Tag</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, flexDirection: 'row' }}>
              {commonMakeupTags.map((tag, tIdx) => {
                const isSelected = newPostTag === tag;
                return (
                  <TouchableOpacity
                    key={tIdx}
                    style={{
                      backgroundColor: isSelected ? '#FF4F8F' : '#FFF0F4',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? '#FF4F8F' : '#FFE4ED',
                    }}
                    onPress={() => setNewPostTag(tag)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#FFF' : '#FF4F8F' }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.textInput}
              value={newPostTag}
              onChangeText={setNewPostTag}
              placeholder="Or type custom makeup type..."
              placeholderTextColor="#B7A9A1"
            />

            <Text style={styles.inputLabel}>Caption / Description</Text>
            <TextInput
              style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
              value={newPostDesc}
              onChangeText={setNewPostDesc}
              placeholder="Write a caption for your work..."
              placeholderTextColor="#B7A9A1"
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.inputLabel}>Select Photos</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: newPostImages.length >= 10 ? '#FF4F8F' : '#777' }}>
                {newPostImages.length} / 10 photos
              </Text>
            </View>
            
            {newPostImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, paddingVertical: 4 }}>
                {newPostImages.map((img, idx) => (
                  <View key={idx} style={{ marginRight: 10, position: 'relative' }}>
                    <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    
                    {/* Crop / Adjust Image Button */}
                    <TouchableOpacity 
                      style={styles.adjustImageBtn} 
                      onPress={() => startAdjustingImage(idx)}
                    >
                      <Ionicons name="crop-outline" size={14} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.removeImageBadge} 
                      onPress={() => setNewPostImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF4F8F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            <TouchableOpacity 
              style={[styles.docUploadButton, newPostImages.length >= 10 && { backgroundColor: '#F5F5F5', borderColor: '#DDD' }]} 
              onPress={handleSelectPostImages}
              disabled={newPostImages.length >= 10}
            >
              <Ionicons name="images-outline" size={20} color={newPostImages.length >= 10 ? '#AAA' : '#FF4F8F'} style={{ marginRight: 8 }} />
              <Text style={[styles.docUploadText, newPostImages.length >= 10 && { color: '#AAA' }]}>
                {newPostImages.length >= 10 ? 'Photo Limit Reached (10/10)' : 'Select Images (Max 10)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalSubmitButton, (uploading || newPostImages.length === 0) && { backgroundColor: '#E8E8E8' }]} 
              onPress={handleCreatePost}
              disabled={uploading || newPostImages.length === 0}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalSubmitText}>Post to Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        );

      case 'adjust_image':
        if (adjustingImageIndex === null) return null;
        const adjustingImg = newPostImages[adjustingImageIndex];
        
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalSubTitle}>Adjust / Crop Photo</Text>
            <Text style={styles.inputLabel}>Position your photo inside the frame</Text>

            {/* Square Preview Container */}
            <View style={{ alignSelf: 'center', marginVertical: 20, width: 280, height: 280, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFE4ED', borderWidth: 2, borderColor: '#FF4F8F' }}>
              <Image
                source={{ uri: adjustingImg.uri }}
                style={{
                  width: '100%',
                  height: '100%',
                  transform: [
                    { scale: cropScale },
                    { translateX: cropTranslateX },
                    { translateY: cropTranslateY }
                  ]
                }}
                resizeMode="cover"
              />
              {/* Overlay Grid lines for Instagram feel */}
              <View style={styles.cropGridOverlay}>
                <View style={[styles.cropGridRow, { top: '33.3%' }]} />
                <View style={[styles.cropGridRow, { top: '66.6%' }]} />
                <View style={[styles.cropGridCol, { left: '33.3%' }]} />
                <View style={[styles.cropGridCol, { left: '66.6%' }]} />
              </View>
            </View>

            {/* Adjust Controls */}
            <Text style={styles.inputLabel}>Adjustments</Text>
            
            {/* Zoom Controls */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Zoom</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropScale(prev => Math.max(1, prev - 0.1))}
              >
                <Ionicons name="remove" size={20} color="#FF4F8F" />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{Math.round(cropScale * 100)}%</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropScale(prev => Math.min(3, prev + 0.1))}
              >
                <Ionicons name="add" size={20} color="#FF4F8F" />
              </TouchableOpacity>
            </View>

            {/* Pan Vertical Controls */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Move Up/Down</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropTranslateY(prev => prev - 10)}
              >
                <Ionicons name="arrow-up" size={20} color="#FF4F8F" />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{cropTranslateY}px</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropTranslateY(prev => prev + 10)}
              >
                <Ionicons name="arrow-down" size={20} color="#FF4F8F" />
              </TouchableOpacity>
            </View>

            {/* Pan Horizontal Controls */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Move Left/Right</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropTranslateX(prev => prev - 10)}
              >
                <Ionicons name="arrow-back" size={20} color="#FF4F8F" />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{cropTranslateX}px</Text>
              <TouchableOpacity 
                style={styles.controlBtn} 
                onPress={() => setCropTranslateX(prev => prev + 10)}
              >
                <Ionicons name="arrow-forward" size={20} color="#FF4F8F" />
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity 
                style={[styles.modalSubmitButton, { flex: 1, marginRight: 10, backgroundColor: '#E8E8E8' }]} 
                onPress={() => setActiveModal('add_post')}
              >
                <Text style={[styles.modalSubmitText, { color: '#555' }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSubmitButton, { flex: 2 }]} 
                onPress={saveImageAdjustments}
              >
                <Text style={styles.modalSubmitText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'post_detail':
        if (!selectedPost) return null;
        const postImages = selectedPost.images && selectedPost.images.length > 0
          ? selectedPost.images
          : [selectedPost.afterImageUrl || selectedPost.beforeImageUrl];
        
        return (
          <View style={styles.modalBody}>
            {/* INSTAGRAM POST HEADER */}
            <View style={styles.instaPostHeader}>
              <Image 
                source={{ uri: profile.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }} 
                style={styles.instaAvatar} 
              />
              <View style={styles.instaHeaderInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.instaUsername}>{profile.name}</Text>
                  <Ionicons name="checkmark-circle" size={14} color="#1890FF" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.instaLocation}>{profile.location || 'Pune'}</Text>
              </View>
              <TouchableOpacity style={styles.instaMenuBtn} onPress={handlePostMenuPress}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {/* INSTAGRAM PHOTO CAROUSEL */}
            <View 
              style={styles.instaImageContainer}
              onLayout={(e) => setModalWidth(e.nativeEvent.layout.width)}
            >
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ width: '100%', height: 350 }}
              >
                {postImages.map((imgItem, idx) => {
                  const isObject = typeof imgItem === 'object' && imgItem !== null;
                  const imgUrl = isObject ? imgItem.url : imgItem;
                  const scale = isObject ? (imgItem.scale || 1) : 1;
                  const translateX = isObject ? (imgItem.translateX || 0) : 0;
                  const translateY = isObject ? (imgItem.translateY || 0) : 0;

                  return (
                    <TouchableOpacity 
                      key={idx} 
                      activeOpacity={0.9} 
                      onPress={() => setFullImageUri(imgUrl)}
                      style={{ width: modalWidth, height: 350, overflow: 'hidden' }}
                    >
                      <Image 
                        source={{ uri: imgUrl }} 
                        style={[
                          styles.instaPostImage,
                          {
                            transform: [
                              { scale },
                              { translateX },
                              { translateY }
                            ]
                          }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {postImages.length > 1 && (
                <View style={styles.instaCarouselBadge}>
                  <Text style={styles.instaCarouselBadgeText}>
                    {activeSlideIndex + 1}/{postImages.length}
                  </Text>
                </View>
              )}
            </View>

            {/* CAROUSEL DOTS INDICATOR */}
            {postImages.length > 1 && (
              <View style={styles.instaDotsContainer}>
                {postImages.map((_, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.instaDot, 
                      activeSlideIndex === idx ? styles.instaDotActive : styles.instaDotInactive
                    ]} 
                  />
                ))}
              </View>
            )}

            {/* INSTAGRAM CAPTION & DETAILS */}
            <View style={[styles.instaCaptionContainer, { marginTop: postImages.length > 1 ? 4 : 16 }]}>
              {editingPostIndex !== null ? (
                <View>
                  <TextInput
                    style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                    value={editPostDesc}
                    onChangeText={setEditPostDesc}
                    multiline
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                    <TouchableOpacity 
                      style={[styles.inlineEditBtn, { marginRight: 10, backgroundColor: '#F5F5F5' }]}
                      onPress={() => setEditingPostIndex(null)}
                    >
                      <Text style={{ color: '#555', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.inlineEditBtn, { backgroundColor: '#FF4F8F' }]}
                      onPress={handleSaveEditCaption}
                    >
                      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  {selectedPost.tag ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ backgroundColor: '#FFE4ED', borderWidth: 1, borderColor: '#FFD1E1', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="pricetag" size={12} color="#FF4F8F" style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF4F8F' }}>
                          {selectedPost.tag}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  <Text style={styles.instaCaptionText}>
                    <Text style={styles.instaCaptionUsername}>{profile.name} </Text>
                    {selectedPost.description || 'No description provided.'}
                  </Text>
                </View>
              )}
            </View>
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
        
        <Text style={styles.headerTitle}>Profile</Text>

        <TouchableOpacity style={styles.headerButton} onPress={() => setActiveModal('settings')}>
          <Ionicons name="settings-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profile.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
            style={styles.avatar}
          />
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{profile.name}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#1890FF" style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFC53D" />
              <Text style={styles.ratingText}> {stats.rating} ({stats.bookingsCount})</Text>
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
            <Text style={styles.statValue}>{stats.bookingsCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{profile.experience || '0 Yrs'}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* INSTAGRAM PORTFOLIO GRID */}
        <View style={styles.gridContainer}>
          <View style={styles.gridTabs}>
            <TouchableOpacity style={styles.gridTabActive}>
              <Ionicons name="grid-outline" size={20} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* ADD POST BUTTON */}
            <TouchableOpacity style={styles.gridItemContainer} onPress={() => setActiveModal('add_post')}>
              <View style={styles.addPostItem}>
                <Ionicons name="add" size={32} color="#FF4F8F" />
                <Text style={styles.addPostLabel}>Add Work</Text>
              </View>
            </TouchableOpacity>

            {/* PORTFOLIO POSTS */}
            {profile.portfolio && profile.portfolio.map((item, index) => {
              const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
              const isObject = typeof firstImage === 'object' && firstImage !== null;
              const imgUrl = isObject 
                ? firstImage.url 
                : (firstImage || item.afterImageUrl || item.beforeImageUrl || 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=200&q=80');
              const scale = isObject ? (firstImage.scale || 1) : 1;
              const translateX = isObject ? (firstImage.translateX || 0) : 0;
              const translateY = isObject ? (firstImage.translateY || 0) : 0;
              const isMultiImage = item.images && item.images.length > 1;

              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.gridItemContainer} 
                  onPress={() => {
                    setSelectedPost({ ...item, index });
                    setActiveSlideIndex(0);
                    setActiveModal('post_detail');
                  }}
                >
                  <View style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
                    <Image 
                      source={{ uri: imgUrl }} 
                      style={[
                        styles.gridImage, 
                        {
                          transform: [
                            { scale },
                            { translateX },
                            { translateY }
                          ]
                        }
                      ]} 
                    />
                  </View>
                  {isMultiImage && (
                    <View style={styles.carouselBadge}>
                      <Ionicons name="copy" size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
          style={[
            styles.modalOverlay,
            activeModal === 'post_detail' && { backgroundColor: '#FFF', justifyContent: 'flex-start' }
          ]}
        >
          <View style={[
            styles.modalContent,
            activeModal === 'post_detail' && { 
              height: '100%', 
              borderTopLeftRadius: 0, 
              borderTopRightRadius: 0, 
              paddingHorizontal: 16,
              paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 20)
            }
          ]}>
            {/* Close Button Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {activeModal !== 'settings' && (
                  <TouchableOpacity 
                    onPress={() => {
                      if (activeModal === 'post_detail' || activeModal === 'add_post' || activeModal === 'adjust_image') {
                        setActiveModal(null);
                      } else {
                        setActiveModal('settings');
                      }
                    }} 
                    style={{ marginRight: 10 }}
                  >
                    <Ionicons name="arrow-back-outline" size={22} color="#111" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  {activeModal === 'settings' ? 'Settings' : (activeModal?.replace('_', ' ') || '')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {renderModalContent()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* POST OPTIONS BOTTOM SHEET */}
      <Modal
        visible={showPostOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPostOptions(false)}
      >
        <TouchableOpacity 
          style={styles.bottomSheetOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPostOptions(false)}
        >
          <View style={styles.bottomSheetContainer}>
            {/* Handle bar */}
            <View style={styles.bottomSheetHandle} />
            
            <Text style={styles.bottomSheetTitle}>Post Settings</Text>

            <TouchableOpacity 
              style={styles.bottomSheetOption} 
              onPress={() => {
                setShowPostOptions(false);
                setEditingPostIndex(selectedPost.index);
                setEditPostDesc(selectedPost.description || '');
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FF4F8F" style={{ marginRight: 12 }} />
              <Text style={[styles.bottomSheetOptionText, { color: '#FF4F8F' }]}>Edit Caption</Text>
            </TouchableOpacity>

            <View style={styles.bottomSheetDivider} />

            <TouchableOpacity 
              style={styles.bottomSheetOption} 
              onPress={() => {
                setShowPostOptions(false);
                handleDeletePost(selectedPost.index);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4D4F" style={{ marginRight: 12 }} />
              <Text style={[styles.bottomSheetOptionText, { color: '#FF4D4F' }]}>Delete Post</Text>
            </TouchableOpacity>

            <View style={styles.bottomSheetDivider} />

            <TouchableOpacity 
              style={[styles.bottomSheetOption, { justifyContent: 'center', marginTop: 8 }]} 
              onPress={() => setShowPostOptions(false)}
            >
              <Text style={[styles.bottomSheetOptionText, { color: '#8A7D77', fontWeight: '500' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULL SCREEN IMAGE VIEWER */}
      <Modal
        visible={fullImageUri !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageUri(null)}
      >
        <View style={styles.fullImageModalContainer}>
          <TouchableOpacity 
            style={styles.fullImageCloseBtn} 
            onPress={() => setFullImageUri(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: fullImageUri }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
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
    maxHeight: '90%',
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

  // Instagram Portfolio Grid styles
  gridContainer: {
    marginTop: 8,
  },
  gridTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
    marginBottom: 16,
  },
  gridTabActive: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#FF4F8F',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItemContainer: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FFE4ED',
  },
  carouselBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 3,
  },
  addPostItem: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FF4F8F',
    borderRadius: 8,
    backgroundColor: '#FFF9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPostLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F8F',
    marginTop: 4,
    fontFamily: 'serif',
  },
  removeImageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  carouselIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postDescriptionText: {
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    lineHeight: 20,
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#F3ECF0',
    borderRadius: 12,
    padding: 12,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    width: '48%',
  },
  postActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  inlineEditBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  
  // Instagram Post Card styles
  instaPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EFF2',
    marginBottom: 12,
  },
  instaAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4ED',
  },
  instaHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  instaUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  instaLocation: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 1,
  },
  instaMenuBtn: {
    padding: 6,
  },
  instaImageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    backgroundColor: '#FFF9FB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  instaPostImage: {
    width: '100%',
    height: '100%',
  },
  instaCarouselBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  instaCarouselBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  instaDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  instaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  instaDotActive: {
    backgroundColor: '#FF4F8F',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  instaDotInactive: {
    backgroundColor: '#E0D8DB',
  },
  instaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 8,
  },
  instaActionIcon: {
    paddingRight: 16,
  },
  instaLikesText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 6,
  },
  instaCaptionContainer: {
    marginBottom: 16,
  },
  instaCaptionText: {
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    lineHeight: 18,
  },
  instaCaptionUsername: {
    fontWeight: '700',
  },

  // Full-screen image viewer styles
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },

  // Custom Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0D8DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  bottomSheetOptionText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: '#F6EFF2',
  },

  // Crop Scissor/Adjust Thumbnail Badge
  adjustImageBtn: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Virtual Crop Grid lines
  cropGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-around',
    alignItems: 'stretch',
  },
  cropGridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cropGridCol: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Slider adjustments row
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#F3ECF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  controlLabel: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
});
// IMPORTANT FIXES DONE:
//
// 1. SafeArea + StatusBar overlap fixed
// 2. Added many makeup specialization options
// 3. "Others" now opens custom input
// 4. Icons visibility fixed
// 5. Better responsive spacing
// 6. Better chip system
// 7. Better selected specialization UI

// INSTALL ICONS IF NOT INSTALLED:
//
// npm install react-native-vector-icons
//
// Then:
//
// npx react-native-asset

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StatusBar,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from '@react-native-vector-icons/ionicons';
import { pick, isCancel, types, keepLocalCopy } from '@react-native-documents/picker';
import { uploadFile } from '../../api/files';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';
import { updateArtistProfile } from '../../api/auth';

const SPECIALIZATIONS = [
  'Bridal',
  'Party Makeup',
  'HD Makeup',
  'Fashion Makeup',
  'Editorial',
  'Airbrush',
  'Engagement',
  'Reception',
  'Haldi',
  'Sangeet',
  'Photoshoot',
  'Celebrity',
  'Matte Makeup',
  'Glam Makeup',
  'Natural Look',
  'Traditional',
  'Runway',
  'Others',
];

const MAX_CERTIFICATE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CERTIFICATE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ArtistRegisterScreen3 = ({ navigation, route }) => {
  const { data, setSpecializations, setCertificates, setProfileInfo } = useArtistRegistration();
  const [selectedSpecializations, setSelectedSpecializations] = useState(
    data.specializations || [],
  );
  
  const [trainingMethod, setTrainingMethod] = useState(data.profile.trainingMethod || '');
  const [trainingDetails, setTrainingDetails] = useState(data.profile.trainingDetails || '');
  const [notableWork, setNotableWork] = useState(data.profile.notableWork || '');
  const [brandQuery, setBrandQuery] = useState('');
  const [brandsUsed, setBrandsUsed] = useState(data.profile.brandsUsed || []);
  const [productsUsed, setProductsUsed] = useState(data.profile.productsUsed || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  
  const trainingOptions = ['Self-Taught', 'Certified (Short Course)', 'Diploma / Degree'];

  const [showOtherInput, setShowOtherInput] = useState(false);

  const [otherSpecialization, setOtherSpecialization] = useState('');

  const toggleSpecialization = item => {
    if (item === 'Others') {
      setShowOtherInput(true);
      return;
    }

    if (selectedSpecializations.includes(item)) {
      setSelectedSpecializations(
        selectedSpecializations.filter(i => i !== item),
      );
    } else {
      setSelectedSpecializations([...selectedSpecializations, item]);
    }
  };

  const addOtherSpecialization = () => {
    if (
      otherSpecialization.trim() &&
      !selectedSpecializations.includes(otherSpecialization)
    ) {
      setSelectedSpecializations([
        ...selectedSpecializations,
        otherSpecialization,
      ]);

      setOtherSpecialization('');
      setShowOtherInput(false);
    }
  };

  const removeSpecialization = item => {
    setSelectedSpecializations(selectedSpecializations.filter(i => i !== item));
  };

  const [certificates, setCertificatesState] = useState(
    data.certificates && data.certificates.length > 0
      ? data.certificates
      : [
          {
            id: Date.now(),
            file: null,
            certificateNumber: '',
            instituteName: '',
            error: '',
          },
        ],
  );

  const displayName = data.basic.name || 'Artist';

  const addCertificateItem = () => {
    setCertificatesState(prev => [
      ...prev,
      {
        id: Date.now() + prev.length,
        file: null,
        certificateNumber: '',
        instituteName: '',
        error: '',
      },
    ]);
  };

  const updateCertificateField = (index, field, value) => {
    setCertificatesState(prev =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const setCertificateError = (index, message) => {
    setCertificatesState(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              error: message,
            }
          : item,
      ),
    );
  };

  const pickCertificate = async index => {
    try {
      const [result] = await pick({
        type: [
          types.pdf,
          types.doc,
          types.docx,
        ],
      });

      const mimeType = (result.type || '').toLowerCase();
      const fileSize = Number(result.size || 0);

      if (mimeType && !ALLOWED_CERTIFICATE_TYPES.has(mimeType)) {
        setCertificateError(
          index,
          'Only PDF, DOC, or DOCX certificate files are allowed.',
        );
        Alert.alert(
          'Invalid file type',
          'Please select a PDF, DOC, or DOCX certificate file.',
        );
        return;
      }

      if (fileSize > MAX_CERTIFICATE_SIZE) {
        setCertificateError(index, 'File must be under 5MB.');
        Alert.alert('File too large', 'Please select a file under 5MB.');
        return;
      }

      // upload to backend -> cloudinary
      try {
        setCertificateError(index, '');
        
        const safeName = (result.name || `file_${Date.now()}`).replace(/[^\x00-\x7F]/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_');

        // keep local copy to get a file path
        const [localCopy] = await keepLocalCopy({
          files: [{ uri: result.uri, fileName: safeName }],
          destination: 'cachesDirectory',
        });
        
        const localUri = localCopy.status === 'success' ? localCopy.localUri : result.uri;

        const fileObj = {
          uri: localUri,
          name: safeName,
          type: (result.type || 'application/octet-stream').replace(/[^\x00-\x7F]/g, ''),
        };

        const url = await uploadFile(fileObj);

        setCertificatesState(prev =>
          prev.map((item, idx) =>
            idx === index
              ? {
                  ...item,
                  file: {
                    name: result.name || 'Certificate',
                    url: url || localUri,
                    size: result.size || 0,
                    type: result.type || 'application/octet-stream',
                  },
                  error: '',
                }
              : item,
          ),
        );
      } catch (err) {
        console.warn('Certificate upload failed', err);
        setCertificateError(
          index,
          err.message || 'Unable to upload file right now.',
        );
        Alert.alert('Upload failed', err.message || 'Unable to upload file');
      }
    } catch (err) {
      if (isCancel(err)) {
        return;
      }
      console.warn('Certificate pick error:', err);
      Alert.alert(
        'File selection error',
        err.message || 'Unable to choose a file.',
      );
    }
  };

  const removeCertificate = index => {
    setCertificatesState(prev => prev.filter((_, idx) => idx !== index));
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
          {/* PROFILE IMAGE (use uploaded profile image from previous screen) */}
          <View style={styles.imageSection}>
            <Image
              source={{
                uri:
                  data?.profile?.profileImage ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
              }}
              style={styles.profileImage}
            />
          </View>

          {/* TITLE */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Hey {displayName}
              {'\n'}
              Let’s Make you a Professional
            </Text>
          </View>

          {/* SPECIALIZATION */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialization</Text>

            <View style={styles.selectedBox}>
              {selectedSpecializations.length === 0 ? (
                <Text style={styles.placeholder}>
                  Select your Specializations from below
                </Text>
              ) : (
                <View style={styles.selectedContainer}>
                  {selectedSpecializations.map((item, index) => (
                    <View key={index} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{item}</Text>

                      <TouchableOpacity
                        onPress={() => removeSpecialization(item)}
                      >
                        <Ionicons name="close" size={16} color="#FF4F8F" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* OTHER INPUT */}
          {showOtherInput && (
            <View style={styles.otherInputContainer}>
              <TextInput
                value={otherSpecialization}
                onChangeText={setOtherSpecialization}
                placeholder="Enter your specialization"
                placeholderTextColor="#C7AAA0"
                style={styles.otherInput}
              />

              <TouchableOpacity
                style={styles.addOtherButton}
                onPress={addOtherSpecialization}
              >
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* SPECIALIZATION OPTIONS */}
          <View style={styles.optionContainer}>
            {SPECIALIZATIONS.map((item, index) => {
              const isSelected = selectedSpecializations.includes(item);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOptionButton,
                  ]}
                  onPress={() => toggleSpecialization(item)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark' : 'add'}
                    size={15}
                    color={isSelected ? '#FFF' : '#FF4F8F'}
                  />

                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CERTIFICATES */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Certificates</Text>

            {certificates.map((cert, index) => (
              <View key={cert.id} style={styles.certificateCard}>
                <View style={styles.certificateHeader}>
                  <Text style={styles.certificateTitle}>
                    Certificate {index + 1}
                  </Text>
                  {certificates.length > 1 ? (
                    <TouchableOpacity onPress={() => removeCertificate(index)}>
                      <Ionicons name="close" size={18} color="#FF4F8F" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => pickCertificate(index)}
                >
                  <View>
                    <Text style={styles.placeholder}>
                      {cert.file?.name || 'Pick certificate file'}
                    </Text>
                    <Text style={styles.fileHelperText}>
                      PDF or any file under 5MB
                    </Text>
                  </View>

                  <Ionicons name="add" size={20} color="#FF4F8F" />
                </TouchableOpacity>

                {cert.error ? (
                  <Text style={styles.errorText}>{cert.error}</Text>
                ) : null}

                <TextInput
                  placeholder="Certificate Number"
                  placeholderTextColor="#C7AAA0"
                  value={cert.certificateNumber}
                  onChangeText={text =>
                    updateCertificateField(index, 'certificateNumber', text)
                  }
                  style={styles.input}
                />

                <TextInput
                  placeholder="Institute Name"
                  placeholderTextColor="#C7AAA0"
                  value={cert.instituteName}
                  onChangeText={text =>
                    updateCertificateField(index, 'instituteName', text)
                  }
                  style={styles.input}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.addMoreButton}
              onPress={addCertificateItem}
            >
              <Text style={styles.addMoreText}>Add More Certificates</Text>
            </TouchableOpacity>
          </View>

          {/* TRAINING */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Training Background</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                Keyboard.dismiss();
                setOptionModalVisible(true);
              }}
            >
              <Text style={trainingMethod ? styles.dropdownText : styles.placeholder}>
                {trainingMethod || 'Select your training method'}
              </Text>
              <Ionicons name="chevron-down" size={22} color="#FF4F8F" />
            </TouchableOpacity>

            {(trainingMethod === 'Certified (Short Course)' || trainingMethod === 'Diploma / Degree') && (
              <TextInput
                placeholder="Name of Academy / Mentor"
                placeholderTextColor="#C7AAA0"
                value={trainingDetails}
                onChangeText={setTrainingDetails}
                style={[styles.input, { marginTop: 15 }]}
              />
            )}
          </View>
          
          {/* NOTABLE WORK */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notable Work / Celebrity Clients</Text>
            <TextInput
              placeholder="e.g. Worked with XYZ celebrity, featured in ABC magazine..."
              placeholderTextColor="#C7AAA0"
              multiline
              value={notableWork}
              onChangeText={setNotableWork}
              style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 18 }]}
            />
          </View>

          {/* PRODUCTS USED */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>What products do you use?</Text>
            <TextInput
              placeholder="e.g. Kryolan, MAC, Huda Beauty, etc."
              placeholderTextColor="#C7AAA0"
              multiline
              value={productsUsed}
              onChangeText={setProductsUsed}
              style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 18 }]}
            />
          </View>

          {/* BRANDS USED (CHIPS) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Premium Brands Used</Text>

            <View style={styles.inputWithLoader}> 
              <TextInput
                placeholder="Type brand name and press space/enter"
                placeholderTextColor="#C7AAA0"
                value={brandQuery}
                onChangeText={(val) => {
                  if (val.endsWith(' ') || val.endsWith(',')) {
                    const brand = val.replace(/[, ]/g, '').trim();
                    if (brand && !brandsUsed.includes(brand)) {
                      setBrandsUsed([...brandsUsed, brand]);
                    }
                    setBrandQuery('');
                  } else {
                    setBrandQuery(val);
                  }
                }}
                onSubmitEditing={() => {
                  const brand = brandQuery.trim();
                  if (brand && !brandsUsed.includes(brand)) {
                    setBrandsUsed([...brandsUsed, brand]);
                  }
                  setBrandQuery('');
                }}
                style={styles.input}
              />
            </View>
            
            {brandsUsed.length > 0 && (
              <View style={styles.chipsContainer}>
                {brandsUsed.map((brand, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{brand}</Text>
                    <TouchableOpacity
                      onPress={() => setBrandsUsed(brandsUsed.filter(item => item !== brand))}
                      style={styles.chipRemoveButton}
                    >
                      <Ionicons name="close" size={16} color="#FF4F8F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={async () => {
              try {
                setIsSubmitting(true);
                const certPayload = certificates.map(cert => ({
                  fileName: cert?.file?.name || cert?.fileName,
                  fileUrl: cert?.file?.url || cert?.fileUrl,
                  fileSize: cert?.file?.size || cert?.fileSize,
                  fileType: cert?.file?.type || cert?.fileType,
                  certificateNumber: cert?.certificateNumber,
                  instituteName: cert?.instituteName,
                }));
                
                const profilePayload = {
                  trainingMethod,
                  trainingDetails,
                  notableWork,
                  brandsUsed,
                  productsUsed,
                };
                
                const payload = {
                  specializations: selectedSpecializations,
                  certificates: certPayload,
                  profile: profilePayload,
                };
                
                await updateArtistProfile(payload);
                setSpecializations(selectedSpecializations);
                setCertificates(certificates);
                setProfileInfo(profilePayload);
                
                if (route?.params?.fromPending) {
                  navigation.navigate('ArtistRegistrationPending');
                } else {
                  navigation.navigate('ArtistRegister4');
                }
              } catch (error) {
                console.error('Save step 3 error:', error);
                const msg = error?.response?.data?.message || error?.message || 'Failed to save specializations';
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
      
      {/* DROPDOWN MODAL FOR TRAINING METHOD */}
      {optionModalVisible && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setOptionModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Training Background</Text>
            {trainingOptions.map(item => (
              <TouchableOpacity
                key={item}
                style={styles.sheetButton}
                onPress={() => {
                  setTrainingMethod(item);
                  setOptionModalVisible(false);
                  if (item === 'Self-Taught') {
                    setTrainingDetails('');
                  }
                }}
              >
                <Text style={styles.sheetButtonText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setOptionModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default ArtistRegisterScreen3;

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

  imageSection: {
    alignItems: 'center',
    marginTop: 20,
  },

  profileImage: {
    width: 115,
    height: 115,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FFD1E1',
  },

  titleContainer: {
    marginTop: 22,
    backgroundColor: '#FFE4ED',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    color: '#111',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
  },

  inputGroup: {
    marginTop: 30,
  },

  label: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    marginLeft: 18,
    marginBottom: -10,
    zIndex: 10,
    color: '#FF4F8F',
    fontSize: 14,
    fontWeight: '700',
  },

  selectedBox: {
    minHeight: 70,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  placeholder: {
    color: '#C7AAA0',
    fontSize: 15,
  },

  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  selectedChipText: {
    color: '#FF4F8F',
    marginRight: 6,
    fontSize: 14,
    fontWeight: '600',
  },

  otherInputContainer: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'center',
  },

  otherInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    color: '#111',
    fontSize: 15,
  },

  addOtherButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FF4F8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  certificateCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 26,
    padding: 18,
    marginTop: 18,
  },

  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  certificateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 14,
  },

  selectedOptionButton: {
    backgroundColor: '#FF4F8F',
  },

  optionText: {
    marginLeft: 6,
    color: '#C58B9C',
    fontSize: 14,
    fontWeight: '600',
  },

  selectedOptionText: {
    color: '#FFF',
  },

  uploadBox: {
    height: 64,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fileHelperText: {
    color: '#C7AAA0',
    fontSize: 12,
    marginTop: 6,
  },

  fileList: {
    marginTop: 16,
  },

  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F4',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },

  fileName: {
    color: '#111',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },

  addMoreButton: {
    height: 54,
    borderWidth: 1.5,
    borderColor: '#FF4F8F',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#FFF',
  },

  addMoreText: {
    color: '#FF4F8F',
    fontSize: 16,
    fontWeight: '700',
  },

  errorText: {
    color: '#D32F2F',
    marginTop: 8,
    fontSize: 13,
  },

  input: {
    height: 60,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    marginTop: 18,
    color: '#111',
    fontSize: 15,
  },

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },

  dropdown: {
    height: 60,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownText: {
    fontSize: 15,
    color: '#111',
  },
  
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  chipText: {
    color: '#FF4F8F',
    fontSize: 14,
    marginRight: 4,
  },

  chipRemoveButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },

  sheetButton: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  sheetButtonText: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
  },

  cancelButton: {
    marginTop: 15,
    backgroundColor: '#FFE4ED',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },

  cancelText: {
    color: '#FF4F8F',
    fontSize: 16,
    fontWeight: '700',
  },
});

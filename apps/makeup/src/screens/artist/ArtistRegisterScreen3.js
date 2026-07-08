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

const MAX_CERTIFICATE_SIZE = 2 * 1024 * 1024;
const ALLOWED_CERTIFICATE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ArtistRegisterScreen3 = ({ navigation, route }) => {
  const { data, setSpecializations, setCertificates } = useArtistRegistration();
  const [selectedSpecializations, setSelectedSpecializations] = useState(
    data.specializations || [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setCertificateError(index, 'File must be under 2MB.');
        Alert.alert('File too large', 'Please select a file under 2MB.');
        return;
      }

      // upload to backend -> cloudinary
      try {
        setCertificateError(index, '');
        
        // keep local copy to get a file path
        const [localCopy] = await keepLocalCopy({
          files: [{ uri: result.uri, fileName: result.name }],
          destination: 'cachesDirectory',
        });
        
        const localUri = localCopy.status === 'success' ? localCopy.localUri : result.uri;

        const fileObj = {
          uri: localUri,
          name: result.name || `file_${Date.now()}`,
          type: result.type || 'application/octet-stream',
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
                      PDF or any file under 2MB
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
                
                const payload = {
                  specializations: selectedSpecializations,
                  certificates: certPayload,
                };
                
                await updateArtistProfile(payload);
                setSpecializations(selectedSpecializations);
                setCertificates(certificates);
                
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
});

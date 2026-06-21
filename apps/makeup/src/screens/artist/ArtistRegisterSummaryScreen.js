// FinalSummaryScreen.js

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Alert,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';
import { updateArtistProfile } from '../../api/auth';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';

const ArtistRegisterSummaryScreen = ({ navigation }) => {
  const { data, resetRegistration } = useArtistRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileImageUri =
    data.profile.profileImage ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500';

  const specializations =
    data.specializations && data.specializations.length > 0
      ? data.specializations
      : [];

  const services = Array.isArray(data.services) ? data.services : [];
  const portfolioItems = Array.isArray(data.portfolio) ? data.portfolio : [];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        profile: {
          profileImage: data.profile.profileImage || undefined,
          gender: data.profile.gender || undefined,
          bio: data.profile.bio || undefined,
          location: data.profile.location || undefined,
          experience: data.profile.experience || undefined,
        },
        specializations,
        certificates: (data.certificates || []).map(cert => ({
          fileName: cert?.file?.name || cert?.fileName,
          fileUrl: cert?.file?.url || cert?.fileUrl,
          fileSize: cert?.file?.size || cert?.fileSize,
          fileType: cert?.file?.type || cert?.fileType,
          certificateNumber: cert?.certificateNumber,
          instituteName: cert?.instituteName,
        })),
        services,
        portfolio: portfolioItems.map(item => ({
          beforeImage: item?.beforeImage,
          afterImage: item?.afterImage,
          tag: item?.tag,
          description: item?.description,
        })),
        payment: {
          accountHolder: data.payment.accountHolder || undefined,
          bankName: data.payment.bankName || undefined,
          accountNumber: data.payment.accountNumber || undefined,
          ifscCode: data.payment.ifscCode || undefined,
          upiId: data.payment.upiId || undefined,
        },
      };

      await updateArtistProfile(payload);
      resetRegistration();
      Alert.alert('Profile saved', 'Your artist profile is ready.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'ArtistHome' }],
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message;
      Alert.alert('Save failed', message || 'Unable to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          {/* SUMMARY CARD */}
          <View style={styles.summaryCard}>
            {/* PROFILE SECTION */}
            <View style={styles.profileSection}>
              <Image
                source={{
                  uri: profileImageUri,
                }}
                style={styles.profileImage}
              />

              <View style={styles.profileInfo}>
                <Text style={styles.name}>{data.basic.name || 'Artist'}</Text>

                <Text style={styles.category}>
                  {specializations.length > 0
                    ? `${specializations.slice(0, 3).join(', ')} Artist`
                    : 'Makeup Artist'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('ArtistRegister2', { fromSummary: true })
                }
              >
                <Ionicons name="create" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* BIO */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bio</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ArtistRegister2', {
                      fromSummary: true,
                    })
                  }
                >
                  <Ionicons name="create" size={16} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionText}>
                {data.profile.bio || 'Add your bio to introduce yourself.'}
              </Text>
            </View>

            {/* SPECIALIZATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Specializations</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ArtistRegister3', {
                      fromSummary: true,
                    })
                  }
                >
                  <Ionicons name="create" size={16} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {specializations.length > 0 ? (
                  specializations.map((item, index) => (
                    <View key={`${item}-${index}`} style={styles.chip}>
                      <Text style={styles.chipText}>{item}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sectionText}>
                    No specializations added yet.
                  </Text>
                )}
              </View>
            </View>

            {/* PRICING */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pricing</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ArtistRegister4', {
                      fromSummary: true,
                    })
                  }
                >
                  <Ionicons name="create" size={16} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              {services.length > 0 ? (
                services.map((service, index) => (
                  <View key={index} style={styles.priceCard}>
                    <Text style={styles.priceTitle}>
                      {service.specialization || 'Service'}
                    </Text>

                    <Text style={styles.priceText}>
                      {service.priceRange || 'Price not set'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.sectionText}>No services added yet.</Text>
              )}
            </View>

            {/* PAYMENT */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Details</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ArtistRegister6', {
                      fromSummary: true,
                    })
                  }
                >
                  <Ionicons name="create" size={16} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionText}>
                UPI: {data.payment.upiId || 'Not provided'}
              </Text>

              <Text style={styles.sectionText}>
                Bank: {data.payment.bankName || 'Not provided'}
              </Text>
            </View>

            {/* PORTFOLIO */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Portfolio</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ArtistRegister5', {
                      fromSummary: true,
                    })
                  }
                >
                  <Ionicons name="create" size={16} color="#FF4F8F" />
                </TouchableOpacity>
              </View>

              <View style={styles.portfolioContainer}>
                {portfolioItems.length > 0 ? (
                  portfolioItems.slice(0, 4).map((item, index) => {
                    const imageUri =
                      item.afterImage ||
                      item.beforeImage ||
                      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600';

                    return (
                      <Image
                        key={`${imageUri}-${index}`}
                        source={{ uri: imageUri }}
                        style={styles.portfolioImage}
                      />
                    );
                  })
                ) : (
                  <Text style={styles.sectionText}>
                    No portfolio images added yet.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Saving...' : 'Start The Journey'}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={22}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ArtistRegisterSummaryScreen;

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

  // SUMMARY CARD

  summaryCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 34,
    padding: 24,
    marginTop: 20,
  },

  // PROFILE

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFF',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },

  category: {
    marginTop: 4,
    fontSize: 14,
    color: '#B7796C',
    lineHeight: 20,
  },

  editButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF4F8F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SECTION

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  sectionText: {
    fontSize: 15,
    color: '#6F625D',
    lineHeight: 24,
  },

  // CHIPS

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  chip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
  },

  chipText: {
    color: '#FF4F8F',
    fontWeight: '600',
    fontSize: 13,
  },

  // PRICE

  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  priceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  priceText: {
    marginTop: 6,
    color: '#B7796C',
    fontSize: 14,
  },

  // PORTFOLIO

  portfolioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  portfolioImage: {
    width: '48%',
    height: 140,
    borderRadius: 20,
  },

  // BUTTON

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 34,
    marginBottom: 20,
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

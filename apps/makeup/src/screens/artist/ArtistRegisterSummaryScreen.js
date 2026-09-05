import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { updateArtistProfile } from '../../api/auth';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';

const ArtistRegisterSummaryScreen = ({ navigation }) => {
  const { data, resetRegistration } = useArtistRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileImageUri =
    data.profile?.profileImage ||
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500';

  const specializations =
    Array.isArray(data.specializations) && data.specializations.length > 0
      ? data.specializations
      : [];

  const services = Array.isArray(data.services) ? data.services : [];
  const portfolioItems = Array.isArray(data.portfolio) ? data.portfolio : [];
  const socialLinks = data.socialLinks || {};
  const bookingPolicy = data.bookingPolicy || {};
  const payment = data.payment || {};

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        profile: {
          profileImage: data.profile?.profileImage || undefined,
          gender: data.profile?.gender || undefined,
          bio: data.profile?.bio || undefined,
          location: data.profile?.location || undefined,
          experience: data.profile?.experience || undefined,
          parlourName: data.profile?.parlourName || undefined,
          parlourAddress: data.profile?.parlourAddress || undefined,
          homeService: data.profile?.homeService || undefined,
          languages: data.profile?.languages || undefined,
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
          beforeImage: item?.beforeImage || item?.beforeImageUrl,
          afterImage: item?.afterImage || item?.afterImageUrl,
          images: Array.isArray(item?.images) && item.images.length > 0
            ? item.images
            : (item?.afterImage || item?.afterImageUrl ? [item?.afterImage || item?.afterImageUrl] : []),
          tag: item?.tag,
          description: item?.description,
        })),
        bookingPolicy: Object.keys(bookingPolicy).length > 0 ? bookingPolicy : undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        payment: {
          accountHolder: payment.accountHolder || undefined,
          bankName: payment.bankName || undefined,
          accountNumber: payment.accountNumber || undefined,
          ifscCode: payment.ifscCode || undefined,
          upiId: payment.upiId || undefined,
        },
      };

      await updateArtistProfile(payload);
      resetRegistration();
      Alert.alert('Congratulations! 🎉', 'Your profile is live! Welcome to the Glam platform.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'ArtistHome' }],
      });
    } catch (error) {
      console.error('Submit summary error:', error);
      const message = error?.response?.data?.message || error?.message;
      Alert.alert('Save failed', message || 'Unable to complete profile registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSocialLinks =
    socialLinks.instagram ||
    socialLinks.facebook ||
    socialLinks.youtube ||
    socialLinks.website ||
    socialLinks.whatsapp;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#FFF" barStyle="dark-content" />

      {/* TOP HEADER NAV */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backNavBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profile Overview</Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO ARTIST CARD */}
        <View style={styles.heroCard}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800',
            }}
            style={styles.heroBg}
            imageStyle={styles.heroBgImage}
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: profileImageUri }} style={styles.heroAvatar} />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#FF4F8F" />
                </View>
              </View>

              <Text style={styles.artistName}>{data.basic?.name || 'Makeup Artist'}</Text>
              
              <Text style={styles.artistSubtitle}>
                {specializations.length > 0
                  ? specializations.slice(0, 3).join(' • ')
                  : 'Professional Makeup Artist'}
              </Text>

              <View style={styles.heroMetaRow}>
                {!!data.profile?.experience && (
                  <View style={styles.metaPill}>
                    <Ionicons name="briefcase-outline" size={13} color="#FFF" style={styles.metaIcon} />
                    <Text style={styles.metaText}>{data.profile.experience}</Text>
                  </View>
                )}
                {!!data.profile?.gender && (
                  <View style={styles.metaPill}>
                    <Ionicons name="person-outline" size={13} color="#FFF" style={styles.metaIcon} />
                    <Text style={styles.metaText}>{data.profile.gender}</Text>
                  </View>
                )}
                {!!data.profile?.homeService && (
                  <View style={styles.metaPill}>
                    <Ionicons name="car-outline" size={13} color="#FFF" style={styles.metaIcon} />
                    <Text style={styles.metaText}>
                      {data.profile.homeService.includes('Yes') || data.profile.homeService.includes('Both')
                        ? 'Home Service'
                        : 'Studio Only'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* STATUS READY CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={styles.sparkleCircle}>
              <Ionicons name="sparkles" size={20} color="#FF4F8F" />
            </View>
            <View style={styles.statusTextCol}>
              <Text style={styles.statusTitle}>Your Profile is 100% Ready!</Text>
              <Text style={styles.statusSubtitle}>Review your details below before publishing.</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: BASIC INFO & BIO */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="person-circle-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>About You</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('ArtistRegister2', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          <Text style={styles.bioText}>
            {data.profile?.bio || 'No bio added yet.'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location / Serving Areas</Text>
              <Text style={styles.infoValue}>
                {data.profile?.location || 'Not specified'}
              </Text>
            </View>

            {!!data.profile?.parlourName && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Studio Name</Text>
                <Text style={styles.infoValue}>{data.profile.parlourName}</Text>
              </View>
            )}

            {!!data.profile?.parlourAddress && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Studio Address</Text>
                <Text style={styles.infoValue}>{data.profile.parlourAddress}</Text>
              </View>
            )}

            {Array.isArray(data.profile?.languages) && data.profile.languages.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Languages Known</Text>
                <Text style={styles.infoValue}>{data.profile.languages.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 2: SPECIALIZATIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="sparkles-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Specializations</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('ArtistRegister3', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          <View style={styles.chipsRow}>
            {specializations.length > 0 ? (
              specializations.map((spec, idx) => (
                <View key={`${spec}-${idx}`} style={styles.specChip}>
                  <Ionicons name="star" size={12} color="#FF4F8F" style={{ marginRight: 6 }} />
                  <Text style={styles.specChipText}>{spec}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No specializations selected.</Text>
            )}
          </View>
        </View>

        {/* SECTION 3: SERVICES & PRICING */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="pricetag-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Services & Rates</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('ArtistRegister4', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {services.length > 0 ? (
            services.map((srv, idx) => (
              <View key={idx} style={styles.serviceItemCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{srv.specialization || 'Makeup Package'}</Text>
                  {!!srv.priceRange && (
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>{srv.priceRange}</Text>
                    </View>
                  )}
                </View>

                {Array.isArray(srv.services) && srv.services.length > 0 && (
                  <View style={styles.serviceSubList}>
                    {srv.services.map((sub, sIdx) => (
                      <View key={sIdx} style={styles.subServiceRow}>
                        <Ionicons name="checkmark-circle-outline" size={15} color="#32C766" style={{ marginRight: 6 }} />
                        <Text style={styles.subServiceName}>{sub.name || sub}</Text>
                        {!!sub.price && (
                          <Text style={styles.subServicePrice}>₹{sub.price}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No services added yet.</Text>
          )}
        </View>

        {/* SECTION 4: PORTFOLIO SHOWCASE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="images-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Work Portfolio ({portfolioItems.length})</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('ArtistRegister5', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {portfolioItems.length > 0 ? (
            <View style={styles.portfolioGrid}>
              {portfolioItems.map((item, idx) => {
                const imgUri =
                  item?.afterImage ||
                  item?.afterImageUrl ||
                  item?.beforeImage ||
                  item?.images?.[0] ||
                  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600';

                return (
                  <View key={idx} style={styles.portfolioGridItem}>
                    <Image source={{ uri: imgUri }} style={styles.portfolioGridImg} />
                    {!!item?.tag && (
                      <View style={styles.portfolioTagPill}>
                        <Text style={styles.portfolioTagText}>{item.tag}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No portfolio photos added yet.</Text>
          )}
        </View>

        {/* SECTION 5: BOOKING POLICIES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="calendar-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Booking Preferences</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('BookingPreferencesScreen', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Trial Offered:</Text>
            <Text style={styles.policyValue}>{bookingPolicy.trialType || 'Not specified'}</Text>
          </View>

          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Cancellation Policy:</Text>
            <Text style={styles.policyValue}>{bookingPolicy.cancellationPolicy || 'Flexible'}</Text>
          </View>

          {!!bookingPolicy.advanceNotice && (
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Advance Notice:</Text>
              <Text style={styles.policyValue}>{bookingPolicy.advanceNotice}</Text>
            </View>
          )}
        </View>

        {/* SECTION 6: SOCIAL LINKS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="share-social-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Social Media</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('SocialLinksScreen', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          {hasSocialLinks ? (
            <View style={styles.socialGrid}>
              {!!socialLinks.instagram && (
                <View style={styles.socialChip}>
                  <Ionicons name="logo-instagram" size={16} color="#E4405F" style={{ marginRight: 6 }} />
                  <Text style={styles.socialText} numberOfLines={1}>{socialLinks.instagram}</Text>
                </View>
              )}
              {!!socialLinks.whatsapp && (
                <View style={styles.socialChip}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" style={{ marginRight: 6 }} />
                  <Text style={styles.socialText} numberOfLines={1}>{socialLinks.whatsapp}</Text>
                </View>
              )}
              {!!socialLinks.facebook && (
                <View style={styles.socialChip}>
                  <Ionicons name="logo-facebook" size={16} color="#1877F2" style={{ marginRight: 6 }} />
                  <Text style={styles.socialText} numberOfLines={1}>{socialLinks.facebook}</Text>
                </View>
              )}
              {!!socialLinks.website && (
                <View style={styles.socialChip}>
                  <Ionicons name="globe-outline" size={16} color="#FF4F8F" style={{ marginRight: 6 }} />
                  <Text style={styles.socialText} numberOfLines={1}>{socialLinks.website}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No social media links connected (Optional).</Text>
          )}
        </View>

        {/* SECTION 7: PAYMENT DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="card-outline" size={22} color="#FF4F8F" />
              <Text style={styles.sectionTitle}>Payout Details</Text>
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => navigation.navigate('ArtistRegister6', { fromSummary: true })}
            >
              <Ionicons name="create-outline" size={18} color="#FF4F8F" />
            </TouchableOpacity>
          </View>

          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>UPI ID:</Text>
            <Text style={styles.policyValue}>{payment.upiId || 'Not set'}</Text>
          </View>

          {!!payment.bankName && (
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Bank Name:</Text>
              <Text style={styles.policyValue}>{payment.bankName}</Text>
            </View>
          )}

          {!!payment.accountNumber && (
            <View style={styles.policyRow}>
              <Text style={styles.policyLabel}>Account No:</Text>
              <Text style={styles.policyValue}>
                •••• {payment.accountNumber.slice(-4)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOOTER CALL TO ACTION */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Publish Profile & Go Live</Text>
              <Ionicons name="rocket-outline" size={22} color="#FFF" style={{ marginLeft: 10 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ArtistRegisterSummaryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  navHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  backNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  navRightPlaceholder: {
    width: 36,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  /* HERO CARD */
  heroCard: {
    height: 230,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  heroBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },

  heroBgImage: {
    borderRadius: 24,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 20, 0.65)',
  },

  heroContent: {
    padding: 20,
    alignItems: 'center',
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },

  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#FFF',
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },

  artistName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },

  artistSubtitle: {
    fontSize: 13,
    color: '#FFD1E1',
    marginTop: 2,
    textAlign: 'center',
  },

  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginHorizontal: 4,
    marginVertical: 2,
  },

  metaIcon: {
    marginRight: 4,
  },

  metaText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* STATUS CARD */
  statusCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sparkleCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  statusTextCol: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4F8F',
  },

  statusSubtitle: {
    fontSize: 12,
    color: '#6F625D',
    marginTop: 2,
  },

  /* GENERIC SECTION CARD */
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginLeft: 8,
  },

  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bioText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },

  infoGrid: {
    gap: 12,
  },

  infoItem: {
    marginBottom: 4,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  /* CHIPS */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  specChipText: {
    color: '#FF4F8F',
    fontWeight: '700',
    fontSize: 13,
  },

  /* SERVICES */
  serviceItemCard: {
    backgroundColor: '#FDFBFB',
    borderWidth: 1,
    borderColor: '#F0EAE8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },

  pricePill: {
    backgroundColor: '#FF4F8F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  pricePillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  serviceSubList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },

  subServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  subServiceName: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },

  subServicePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  /* PORTFOLIO GRID */
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  portfolioGridItem: {
    width: '48%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },

  portfolioGridImg: {
    width: '100%',
    height: '100%',
  },

  portfolioTagPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  portfolioTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },

  /* POLICIES */
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  policyLabel: {
    fontSize: 14,
    color: '#666',
  },

  policyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  /* SOCIAL GRID */
  socialGrid: {
    gap: 8,
  },

  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  socialText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },

  /* FOOTER CTA */
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },

  submitButton: {
    height: 58,
    backgroundColor: '#FF4F8F',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#FF4F8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

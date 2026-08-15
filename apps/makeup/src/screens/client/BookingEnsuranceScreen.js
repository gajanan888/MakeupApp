import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';

const INSURANCE_FEE = 1000;

const BookingEnsuranceScreen = ({ navigation, route }) => {
  const {
    artist,
    selectedService,
    selectedLocation,
    selectedDate,
    selectedTime,
    dateStr,
    selectedAddons = [],
    addonsTotal = 0,
  } = route?.params || {};

  // Default pre-checked to match design screenshot
  const [hasInsurance, setHasInsurance] = useState(true);

  const handleContinue = () => {
    if (hasInsurance) {
      navigation.navigate('SelectBackupArtist', {
        artist,
        selectedService,
        selectedLocation,
        selectedDate,
        selectedTime,
        dateStr,
        selectedAddons,
        addonsTotal,
        hasInsurance,
        insuranceFee: INSURANCE_FEE,
      });
    } else {
      navigation.navigate('BookingConfirmation', {
        artist,
        selectedService,
        selectedLocation,
        selectedDate,
        selectedTime,
        dateStr,
        selectedAddons,
        addonsTotal,
        hasInsurance: false,
        insuranceFee: 0,
        backupArtist: null,
        backupArtistId: null,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* ── Screen Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Protection</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Illustration & Title ────────────────────────────── */}
        <View style={styles.heroContainer}>
          <View style={styles.shieldGlowOuter}>
            <View style={styles.shieldGlowInner}>
              <View style={styles.shieldIconBox}>
                <Ionicons name="shield-checkmark" size={32} color="#FFF" />
              </View>
            </View>
            {/* Sparkle decorative dots */}
            <Ionicons name="sparkles" size={14} color="#FF9EBE" style={styles.sparkleTopLeft} />
            <Ionicons name="sparkles" size={12} color="#FF9EBE" style={styles.sparkleBottomRight} />
          </View>

          <Text style={styles.heroTitle}>
            Last-Minute Cancellation{'\n'}Protection
          </Text>
          <Text style={styles.heroSubtitle}>
            Ensure your event is <Text style={styles.pinkHighlight}>100%</Text> stress-free with{'\n'}our Premium Artist Guarantee.
          </Text>
        </View>

        {/* ── Main Insurance Card ──────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.card, hasInsurance && styles.cardActive]}
          onPress={() => setHasInsurance(!hasInsurance)}
          activeOpacity={0.9}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <View style={[styles.checkbox, hasInsurance && styles.checkboxActive]}>
              {hasInsurance && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.cardTitle}>Add Insurance Protection</Text>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>+₹{INSURANCE_FEE}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.cardDescription}>
            This premium feature guarantees that even if your selected artist has to cancel last-minute due to an unavoidable emergency, your booking will be completed by the best available top-rated artist nearby.
          </Text>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Feature Bullets */}
          <View style={styles.featuresContainer}>
            {/* Feature 1 */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="flash" size={18} color="#FF3B7B" />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Instant automated priority re-assignment</Text>
                <Text style={styles.featureSubtext}>Quick action to find the best replacement for you.</Text>
              </View>
            </View>

            <View style={styles.featureLineDivider} />

            {/* Feature 2 */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="ribbon" size={18} color="#FF3B7B" />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Matched with top-rated nearby backup artist</Text>
                <Text style={styles.featureSubtext}>We connect you with trusted professionals near you.</Text>
              </View>
            </View>

            <View style={styles.featureLineDivider} />

            {/* Feature 3 */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="shield-checkmark" size={18} color="#FF3B7B" />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>100% Service completion warranty</Text>
                <Text style={styles.featureSubtext}>Your event, our responsibility.</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── Notice Box ───────────────────────────────────────────── */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeInfoIconCircle}>
            <Text style={styles.infoIconText}>i</Text>
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>This protection is optional and skippable.</Text>
            <Text style={styles.noticeSubtext}>
              You can leave it unchecked if you prefer to proceed without insurance guarantee.
            </Text>
          </View>
          <View style={styles.umbrellaIconBox}>
            <Ionicons name="umbrella" size={24} color="#FF3B7B" />
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Action Button ──────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, !hasInsurance && styles.actionBtnSkip]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {hasInsurance
              ? `Continue with Insurance`
              : 'Skip'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingEnsuranceScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  // ── Scroll Content (Elongated Layout) ──────────────────────────────
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },

  // ── Hero Section ──────────────────────────────────────────────────
  heroContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  shieldGlowOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  shieldGlowInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFE2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B7B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B7B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 4,
    left: 8,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 6,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 21,
  },
  pinkHighlight: {
    color: '#FF3B7B',
    fontWeight: '800',
  },

  // ── Card Section ──────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF5F8',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FFC8DA',
    marginBottom: 20,
  },
  cardActive: {
    backgroundColor: '#FFF5F8',
    borderColor: '#FF3B7B',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#FF3B7B',
    borderColor: '#FF3B7B',
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
  },
  pricePill: {
    backgroundColor: '#FFE4EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pricePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF3B7B',
  },

  cardDescription: {
    fontSize: 13.5,
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 16,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F6E0E8',
    marginBottom: 16,
  },

  // ── Features Breakdown ────────────────────────────────────────────
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE6EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  featureSubtext: {
    fontSize: 12.5,
    color: '#666',
  },
  featureLineDivider: {
    height: 1,
    backgroundColor: '#F7E4EC',
    marginLeft: 52,
  },

  // ── Notice Card ───────────────────────────────────────────────────
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F7',
    borderRadius: 18,
    padding: 16,
  },
  noticeInfoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#777',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    fontStyle: 'italic',
    marginTop: -2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  noticeSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  umbrellaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // ── Footer ────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 34,
    paddingTop: 14,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  actionBtn: {
    backgroundColor: '#FF3B7B',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B7B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnSkip: {
    backgroundColor: '#555',
    shadowColor: '#555',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

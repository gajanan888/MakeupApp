import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';

// ─── Default add-ons (can be overridden via route params) ────────────────────
const DEFAULT_ADDONS = [
  { id: '1', name: 'Hairstyling', price: 50 },
  { id: '2', name: 'False Lashes', price: 20 },
  { id: '3', name: 'HD Makeup', price: 30 },
  { id: '4', name: 'Saree Draping', price: 25 },
  { id: '5', name: 'Touch-up (Extra)', price: 40 },
  { id: '6', name: 'Products (Premium)', price: 35 },
];

const AddOnsScreen = ({ navigation, route }) => {
  const {
    artist,
    selectedService,
    selectedLocation,
    selectedDate,
    selectedTime,
    dateStr,
  } = route?.params || {};

  // Build initial checked state — first two pre-checked to match design
  const addons = route?.params?.addons || DEFAULT_ADDONS;
  const [checked, setChecked] = useState(() => {
    const init = {};
    addons.forEach((a, i) => {
      init[a.id] = i < 2;
    });
    return init;
  });

  const toggleAddon = id => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate total of selected add-ons
  const selectedAddons = addons.filter(a => checked[a.id]);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);

  const handleNext = () => {
    navigation.navigate('BookingConfirmation', {
      artist,
      selectedService,
      selectedLocation,
      selectedDate,
      selectedTime,
      dateStr,
      selectedAddons,
      addonsTotal,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader title="Add-ons" onBack={() => navigation.goBack()} />

      {/* ── Subtitle ────────────────────────────────────────────────── */}
      <Text style={styles.subtitle}>
        Enhance your look with our add-on{'\n'}services
      </Text>

      {/* ── Add-on List ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {addons.map((addon, index) => {
          const isChecked = !!checked[addon.id];
          return (
            <TouchableOpacity
              key={addon.id}
              style={[
                styles.addonRow,
                index === addons.length - 1 && styles.addonRowLast,
              ]}
              onPress={() => toggleAddon(addon.id)}
              activeOpacity={0.7}
            >
              {/* Custom Checkbox */}
              <View
                style={[styles.checkbox, isChecked && styles.checkboxActive]}
              >
                {isChecked && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </View>

              {/* Name */}
              <Text
                style={[styles.addonName, isChecked && styles.addonNameActive]}
              >
                {addon.name}
              </Text>

              {/* Price */}
              <Text
                style={[
                  styles.addonPrice,
                  isChecked && styles.addonPriceActive,
                ]}
              >
                ${addon.price}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ── Selected Summary ──────────────────────────────────────── */}
        {selectedAddons.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="sparkles-outline" size={15} color="#FF4F87" />
              <Text style={styles.summaryLabel}>
                {selectedAddons.length} add-on
                {selectedAddons.length > 1 ? 's' : ''} selected
              </Text>
              <Text style={styles.summaryTotal}>+${addonsTotal}</Text>
            </View>
            <Text style={styles.summaryItems} numberOfLines={1}>
              {selectedAddons.map(a => a.name).join(' · ')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Next Button ─────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddOnsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },

  // Subtitle
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 40,
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },

  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F6',
  },
  addonRowLast: {
    borderBottomWidth: 0,
  },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },

  // Name & Price
  addonName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  addonNameActive: {
    color: '#111',
    fontWeight: '600',
  },
  addonPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
    minWidth: 44,
    textAlign: 'right',
  },
  addonPriceActive: {
    color: '#FF4F87',
  },

  // Summary card
  summaryCard: {
    marginTop: 20,
    backgroundColor: '#FFF5F8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD6E3',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4F87',
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4F87',
  },
  summaryItems: {
    fontSize: 12,
    color: '#B06070',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 20 : 28,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  nextBtn: {
    backgroundColor: '#FF4F87',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

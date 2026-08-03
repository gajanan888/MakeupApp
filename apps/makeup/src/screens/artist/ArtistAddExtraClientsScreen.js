import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getArtistProfile, getArtistBookings, addExtraClientsToBooking, createArtistDirectBooking } from '../../api/auth';

const ArtistAddExtraClientsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('add_to_existing'); // 'add_to_existing' | 'new_walkin'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [artistServices, setArtistServices] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Per-service count state: { [serviceName]: count }
  const [serviceCounts, setServiceCounts] = useState({});
  const [extraNotes, setExtraNotes] = useState('');

  // Walk-in form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [walkinClientName, setWalkinClientName] = useState('');
  const [walkinClientPhone, setWalkinClientPhone] = useState('');
  const [walkinLocation, setWalkinLocation] = useState('');
  const [walkinDate, setWalkinDate] = useState(todayStr);
  const [walkinTime, setWalkinTime] = useState('10:00 AM');

  function parseAmount(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  // Load artist profile services & bookings
  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, bookingsData] = await Promise.all([
        getArtistProfile().catch(() => null),
        getArtistBookings().catch(() => []),
      ]);

      if (profileData) {
        const rawServices = (profileData.services && profileData.services.length > 0)
          ? profileData.services.map(s => ({
              name: s.name || s.specialization || 'Makeup Service',
              price: s.price ? Number(s.price) : parseAmount(s.priceRange) || 2000,
            }))
          : (profileData.specializations && profileData.specializations.length > 0)
            ? profileData.specializations.map(spec => ({
                name: typeof spec === 'object' ? (spec.name || 'Makeup Service') : String(spec),
                price: 2000,
              }))
            : [
                { name: 'Party Makeup', price: 2500 },
                { name: 'HD Makeup', price: 4000 },
                { name: 'Bridal Makeup', price: 10000 },
                { name: 'Hair Styling', price: 1500 },
                { name: 'Saree Draping', price: 1000 },
              ];
        setArtistServices(rawServices);
      }

      if (Array.isArray(bookingsData)) {
        const activeBookings = bookingsData.filter(b => 
          ['accepted', 'confirmed', 'in_progress', 'pending'].includes(b.status)
        );
        setUpcomingBookings(activeBookings);
        if (activeBookings.length > 0) {
          setSelectedBookingId(activeBookings[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateServiceCount = (serviceName, delta) => {
    setServiceCounts(prev => {
      const current = prev[serviceName] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [serviceName]: next };
    });
  };

  const selectedServiceItems = artistServices
    .map(s => {
      const count = serviceCounts[s.name] || 0;
      const unitPrice = s.price;
      return {
        service: s.name,
        name: s.name,
        count,
        unitPrice,
        price: unitPrice,
        totalPrice: unitPrice * count,
      };
    })
    .filter(s => s.count > 0);

  const totalExtraClientsCount = selectedServiceItems.reduce((sum, item) => sum + item.count, 0);
  const totalAdditionalPrice = selectedServiceItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const selectedBooking = upcomingBookings.find(b => b.id === selectedBookingId);
  const currentBookingPrice = selectedBooking ? parseAmount(selectedBooking.price) : 0;
  const newBookingTotalPrice = currentBookingPrice + totalAdditionalPrice;

  // Handle Submit
  const handleSubmit = async () => {
    if (totalExtraClientsCount === 0) {
      Alert.alert('Validation Error', 'Please select at least 1 service / customer count to add.');
      return;
    }

    if (activeTab === 'add_to_existing') {
      if (!selectedBookingId) {
        Alert.alert('Validation Error', 'Please select an ongoing or upcoming booking to add extra customers to.');
        return;
      }

      try {
        setSubmitting(true);
        await addExtraClientsToBooking(selectedBookingId, {
          extraServices: selectedServiceItems,
          additionalPrice: totalAdditionalPrice,
          notes: extraNotes.trim(),
        });

        Alert.alert(
          'Extra Customers Added! 🎉',
          `Added ${totalExtraClientsCount} extra customer(s) to booking #${selectedBookingId}.\n\nAdditional Amount: ₹${totalAdditionalPrice}\nNew Total: ₹${newBookingTotalPrice}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to add extra customers to booking.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Walk-In Direct Booking
      if (!walkinClientName.trim()) {
        Alert.alert('Validation Error', 'Please enter client name.');
        return;
      }

      try {
        setSubmitting(true);
        const category = selectedServiceItems.map(s => `${s.count}x ${s.name}`).join(', ');
        await createArtistDirectBooking({
          clientName: walkinClientName.trim(),
          clientPhone: walkinClientPhone.trim() || '',
          date: walkinDate,
          time: walkinTime,
          category: category || 'Walk-In Booking',
          price: totalAdditionalPrice,
          location: walkinLocation.trim() || 'Studio / On-Site',
          addOns: selectedServiceItems,
        });

        Alert.alert(
          'Booking Created! 🎉',
          `Created direct booking for ${walkinClientName} with total ₹${totalAdditionalPrice}.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to create direct booking.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#FCFCFC" barStyle="dark-content" />
      
      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>New Booking / Add Clients</Text>
          <Text style={styles.headerSubtitle}>Add extra customers to an ongoing session</Text>
        </View>
      </View>

      {/* SEGMENTED TAB SELECTOR */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'add_to_existing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('add_to_existing')}
        >
          <Ionicons name="person-add-outline" size={16} color={activeTab === 'add_to_existing' ? '#FFF' : '#FF4F8F'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'add_to_existing' && styles.tabTextActive]}>
            Add to Active Session
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'new_walkin' && styles.tabBtnActive]}
          onPress={() => setActiveTab('new_walkin')}
        >
          <Ionicons name="calendar-outline" size={16} color={activeTab === 'new_walkin' ? '#FFF' : '#FF4F8F'} style={{ marginRight: 6 }} />
          <Text style={[styles.tabText, activeTab === 'new_walkin' && styles.tabTextActive]}>
            New Walk-In Client
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF4F8F" />
          <Text style={{ fontSize: 13, color: '#8A7D77', marginTop: 10, fontFamily: 'serif' }}>Loading bookings & services...</Text>
        </View>
      ) : (
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          {activeTab === 'add_to_existing' ? (
            <View>
              {/* STEP 1: SELECT UPCOMING / ONGOING BOOKING */}
              <Text style={styles.sectionLabel}>1. Select Booking Session</Text>
              {upcomingBookings && upcomingBookings.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, flexDirection: 'row' }}>
                  {upcomingBookings.map((b) => {
                    const isSelected = selectedBookingId === b.id;
                    const custName = b.customer?.name || `Booking #${b.id}`;
                    const bDate = b.date || 'Today';
                    const bStatus = (b.status || 'pending').toUpperCase();

                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.bookingCard, isSelected && styles.bookingCardSelected]}
                        onPress={() => setSelectedBookingId(b.id)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={[styles.bookingCustName, isSelected && { color: '#FF4F8F' }]} numberOfLines={1}>
                            {custName}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FF4F8F" />}
                        </View>

                        <Text style={styles.bookingCategory} numberOfLines={1}>{b.category || 'Makeup Booking'}</Text>
                        <Text style={styles.bookingDate}>📅 {bDate} {b.time ? `• ${b.time}` : ''}</Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Text style={styles.bookingStatus}>{bStatus}</Text>
                          <Text style={styles.bookingPrice}>₹{b.price || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.noBookingBox}>
                  <Ionicons name="alert-circle-outline" size={22} color="#FF4F8F" />
                  <Text style={styles.noBookingText}>No active or upcoming bookings found. Switch to "New Walk-In Client" tab to log a fresh client.</Text>
                </View>
              )}

              {/* STEP 2: SELECT SERVICES & COUNTER */}
              <Text style={styles.sectionLabel}>2. Select Extra Customers & Services</Text>
              <Text style={styles.subInstruction}>Tap + or - to select the count of extra customers for each makeup service:</Text>

              {artistServices.map((serviceItem) => {
                const count = serviceCounts[serviceItem.name] || 0;

                return (
                  <View key={serviceItem.name} style={styles.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{serviceItem.name}</Text>
                      <Text style={styles.serviceUnitPrice}>₹{serviceItem.price} per person</Text>
                    </View>

                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={[styles.counterBtn, count === 0 && styles.counterBtnDisabled]}
                        onPress={() => updateServiceCount(serviceItem.name, -1)}
                        disabled={count === 0}
                      >
                        <Ionicons name="remove" size={18} color={count === 0 ? '#CCC' : '#FF4F8F'} />
                      </TouchableOpacity>

                      <Text style={styles.countText}>{count}</Text>

                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => updateServiceCount(serviceItem.name, 1)}
                      >
                        <Ionicons name="add" size={18} color="#FF4F8F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* STEP 3: EXTRA NOTES */}
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>3. Extra Client Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={extraNotes}
                onChangeText={setExtraNotes}
                placeholder="e.g. 2 extra bridesmaids, 1 saree draping on-site..."
                placeholderTextColor="#B7A9A1"
              />
            </View>
          ) : (
            /* NEW WALK-IN CLIENT TAB */
            <View>
              <Text style={styles.sectionLabel}>1. Walk-In Client Information</Text>
              
              <Text style={styles.inputTitle}>Client Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={walkinClientName}
                onChangeText={setWalkinClientName}
                placeholder="e.g. Ananya Roy"
                placeholderTextColor="#B7A9A1"
              />

              <Text style={styles.inputTitle}>Client Phone Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={walkinClientPhone}
                onChangeText={setWalkinClientPhone}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#B7A9A1"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputTitle}>Location / Venue (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={walkinLocation}
                onChangeText={setWalkinLocation}
                placeholder="e.g. Studio, Hotel Park, Pune"
                placeholderTextColor="#B7A9A1"
              />

              <Text style={styles.sectionLabel}>2. Select Services & Customer Count</Text>
              {artistServices.map((serviceItem) => {
                const count = serviceCounts[serviceItem.name] || 0;

                return (
                  <View key={serviceItem.name} style={styles.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{serviceItem.name}</Text>
                      <Text style={styles.serviceUnitPrice}>₹{serviceItem.price} per person</Text>
                    </View>

                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={[styles.counterBtn, count === 0 && styles.counterBtnDisabled]}
                        onPress={() => updateServiceCount(serviceItem.name, -1)}
                        disabled={count === 0}
                      >
                        <Ionicons name="remove" size={18} color={count === 0 ? '#CCC' : '#FF4F8F'} />
                      </TouchableOpacity>

                      <Text style={styles.countText}>{count}</Text>

                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => updateServiceCount(serviceItem.name, 1)}
                      >
                        <Ionicons name="add" size={18} color="#FF4F8F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* PRICE SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Extra Customers Count:</Text>
              <Text style={styles.summaryValue}>{totalExtraClientsCount} person(s)</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Services Amount:</Text>
              <Text style={styles.summaryPriceHighlight}>+ ₹{totalAdditionalPrice}</Text>
            </View>

            {activeTab === 'add_to_existing' && selectedBooking && (
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#FFE4ED', paddingTop: 8, marginTop: 4 }]}>
                <Text style={styles.summaryLabelBold}>New Total Booking Amount:</Text>
                <Text style={styles.summaryTotalHighlight}>₹{newBookingTotalPrice}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* FIXED FOOTER SUBMIT BUTTON */}
      <View style={styles.fixedFooter}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || totalExtraClientsCount === 0) && { backgroundColor: '#E0E0E0' }]}
          onPress={handleSubmit}
          disabled={submitting || totalExtraClientsCount === 0}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {activeTab === 'add_to_existing'
                ? `Confirm & Add Extra Customers (₹${totalAdditionalPrice})`
                : `Create Direct Booking (₹${totalAdditionalPrice})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ArtistAddExtraClientsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
    backgroundColor: '#FCFCFC',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F4',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginVertical: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FF4F8F',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },
  tabTextActive: {
    color: '#FFF',
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 8,
    marginTop: 4,
  },
  subInstruction: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  bookingCard: {
    width: 210,
    backgroundColor: '#FFF0F4',
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#FFE4ED',
  },
  bookingCardSelected: {
    borderColor: '#FF4F8F',
    backgroundColor: '#FFF5F8',
  },
  bookingCustName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    flex: 1,
  },
  bookingCategory: {
    fontSize: 12,
    color: '#FF4F8F',
    fontWeight: '600',
    fontFamily: 'serif',
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'serif',
    marginTop: 4,
  },
  bookingStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#28A745',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  noBookingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4ED',
    marginBottom: 16,
  },
  noBookingText: {
    fontSize: 12,
    color: '#5E1735',
    fontFamily: 'serif',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3ECF0',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  serviceUnitPrice: {
    fontSize: 12,
    color: '#FF4F8F',
    fontFamily: 'serif',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0F4',
    borderWidth: 1,
    borderColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 12,
    minWidth: 18,
    textAlign: 'center',
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 4,
    marginTop: 8,
    fontFamily: 'serif',
  },
  textInput: {
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#FFE4ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFF0F4',
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#FFE4ED',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'serif',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  summaryPriceHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  summaryTotalHighlight: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3ECF0',
  },
  submitBtn: {
    backgroundColor: '#FF4F8F',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'serif',
  },
});

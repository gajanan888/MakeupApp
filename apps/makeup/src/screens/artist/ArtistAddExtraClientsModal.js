import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { addExtraClientsToBooking, createArtistDirectBooking } from '../../api/auth';

const ArtistAddExtraClientsModal = ({ visible, onClose, onSuccess, artistServices = [], upcomingBookings = [] }) => {
  const [activeTab, setActiveTab] = useState('add_to_existing'); // 'add_to_existing' | 'new_walkin'
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  
  // Available services mapping
  const availableServices = (artistServices && artistServices.length > 0)
    ? artistServices.map(s => ({
        name: s.name || s.specialization || 'Makeup Service',
        price: s.price ? Number(s.price) : parseAmount(s.priceRange) || 2000,
      }))
    : [
        { name: 'Party Makeup', price: 2500 },
        { name: 'HD Makeup', price: 4000 },
        { name: 'Bridal Makeup', price: 10000 },
        { name: 'Hair Styling', price: 1500 },
        { name: 'Saree Draping', price: 1000 },
      ];

  function parseAmount(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  // Per-service count state: { [serviceName]: count }
  const [serviceCounts, setServiceCounts] = useState({});
  const [extraNotes, setExtraNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Walk-in form states
  const [walkinClientName, setWalkinClientName] = useState('');
  const [walkinClientPhone, setWalkinClientPhone] = useState('');
  const [walkinLocation, setWalkinLocation] = useState('');

  // Auto-select first active booking if available
  useEffect(() => {
    if (upcomingBookings && upcomingBookings.length > 0) {
      setSelectedBookingId(upcomingBookings[0].id);
    }
  }, [upcomingBookings, visible]);

  // Reset form on open/close
  useEffect(() => {
    if (visible) {
      setServiceCounts({});
      setExtraNotes('');
      setWalkinClientName('');
      setWalkinClientPhone('');
      setWalkinLocation('');
      setSubmitting(false);
    }
  }, [visible]);

  const updateServiceCount = (serviceName, delta) => {
    setServiceCounts(prev => {
      const current = prev[serviceName] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [serviceName]: next };
    });
  };

  const selectedServiceItems = availableServices
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

  // Handle Submission
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
          [{ text: 'OK', onPress: () => { onClose(); if (onSuccess) onSuccess(); } }]
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
          clientPhone: walkinClientPhone.trim() || '0000000000',
          category: category || 'Walk-In Booking',
          price: totalAdditionalPrice,
          location: walkinLocation.trim() || 'Studio / On-Site',
          addOns: selectedServiceItems,
        });

        Alert.alert(
          'Booking Created! 🎉',
          `Created direct booking for ${walkinClientName} with total ₹${totalAdditionalPrice}.`,
          [{ text: 'OK', onPress: () => { onClose(); if (onSuccess) onSuccess(); } }]
        );
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to create direct booking.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.container} activeOpacity={1} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          
          {/* MODAL HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>New Booking / Add Clients</Text>
              <Text style={styles.subtitle}>Add extra customers joining an ongoing or upcoming booking</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          {/* TAB SWITCHER */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'add_to_existing' && styles.tabBtnActive]}
              onPress={() => setActiveTab('add_to_existing')}
            >
              <Ionicons name="person-add-outline" size={16} color={activeTab === 'add_to_existing' ? '#FFF' : '#FF4F8F'} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'add_to_existing' && styles.tabTextActive]}>
                Add to Booking
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

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {activeTab === 'add_to_existing' ? (
              <View>
                {/* STEP 1: SELECT BOOKING SESSION */}
                <Text style={styles.sectionLabel}>1. Select Upcoming / Ongoing Booking</Text>
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexDirection: 'row' }}>
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
                            {isSelected && <Ionicons name="checkmark-circle" size={16} color="#FF4F8F" />}
                          </View>

                          <Text style={styles.bookingCategory} numberOfLines={1}>{b.category || 'Makeup Booking'}</Text>
                          <Text style={styles.bookingDate}>📅 {bDate} {b.time ? `• ${b.time}` : ''}</Text>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <Text style={styles.bookingStatus}>{bStatus}</Text>
                            <Text style={styles.bookingPrice}>₹{b.price || 0}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View style={styles.noBookingBox}>
                    <Ionicons name="alert-circle-outline" size={20} color="#8A7D77" />
                    <Text style={styles.noBookingText}>No active or upcoming bookings found. Switch to "New Walk-In Client" tab below.</Text>
                  </View>
                )}

                {/* STEP 2: SELECT SERVICES & COUNTER */}
                <Text style={styles.sectionLabel}>2. Select Extra Customers & Services</Text>
                <Text style={styles.subInstruction}>Use + / - to add count of extra customers for each makeup service:</Text>

                {availableServices.map((serviceItem) => {
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
                          <Ionicons name="remove" size={16} color={count === 0 ? '#CCC' : '#FF4F8F'} />
                        </TouchableOpacity>

                        <Text style={styles.countText}>{count}</Text>

                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => updateServiceCount(serviceItem.name, 1)}
                        >
                          <Ionicons name="add" size={16} color="#FF4F8F" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* STEP 3: EXTRA NOTES */}
                <Text style={[styles.sectionLabel, { marginTop: 14 }]}>3. Extra Notes (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={extraNotes}
                  onChangeText={setExtraNotes}
                  placeholder="e.g. 2 extra bridesmaids, saree draping included..."
                  placeholderTextColor="#B7A9A1"
                />
              </View>
            ) : (
              /* NEW WALK-IN CLIENT TAB */
              <View>
                <Text style={styles.sectionLabel}>1. Client Details</Text>
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

                <Text style={styles.sectionLabel}>2. Select Services & Number of Clients</Text>
                {availableServices.map((serviceItem) => {
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
                          <Ionicons name="remove" size={16} color={count === 0 ? '#CCC' : '#FF4F8F'} />
                        </TouchableOpacity>

                        <Text style={styles.countText}>{count}</Text>

                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => updateServiceCount(serviceItem.name, 1)}
                        >
                          <Ionicons name="add" size={16} color="#FF4F8F" />
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
                <Text style={styles.summaryLabel}>Extra Customers Selected:</Text>
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

          {/* SUBMIT BUTTON */}
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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ArtistAddExtraClientsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justify: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0D8DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FF4F8F',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },
  tabTextActive: {
    color: '#FFF',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  subInstruction: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  bookingCard: {
    width: 190,
    backgroundColor: '#FFF0F4',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#FFE4ED',
  },
  bookingCardSelected: {
    borderColor: '#FF4F8F',
    backgroundColor: '#FFF5F8',
  },
  bookingCustName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    flex: 1,
  },
  bookingCategory: {
    fontSize: 11,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookingPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  noBookingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9FB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE4ED',
    marginBottom: 14,
  },
  noBookingText: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginLeft: 8,
    flex: 1,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3ECF0',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  serviceUnitPrice: {
    fontSize: 11,
    color: '#FF4F8F',
    fontFamily: 'serif',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 10,
    minWidth: 16,
    textAlign: 'center',
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 4,
    marginTop: 6,
    fontFamily: 'serif',
  },
  textInput: {
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#FFE4ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#FFF0F4',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FFE4ED',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'serif',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  summaryPriceHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },
  summaryLabelBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  summaryTotalHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },
  submitBtn: {
    backgroundColor: '#FF4F8F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'serif',
  },
});

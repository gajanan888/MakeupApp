import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useCall } from '../../context/CallContext';
import {
  acceptArtistBooking,
  rejectArtistBooking,
  startArtistBooking,
  completeArtistBooking,
  cancelArtistBooking,
} from '../../api/auth';

const STYLE_PREFERENCES = [
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=200',
];

const MAP_PREVIEW = 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=400';

const ArtistBookingDetailModal = ({ visible, onClose, booking, onStatusUpdate, onChatPress }) => {
  const [updating, setUpdating] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [dialogType, setDialogType] = useState('reject'); // 'reject' or 'cancel'
  const { initiateCall } = useCall();

  if (!booking) return null;

  const checkTimeReached = () => {
    if (!booking.rawDate || !booking.rawTime) return true;
    try {
      const [year, month, day] = booking.rawDate.split('-').map(Number);
      const [hours, minutes] = booking.rawTime.split(':').map(Number);
      const scheduled = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      return now >= scheduled;
    } catch (e) {
      return true;
    }
  };
  const isTimeReached = checkTimeReached();

  const handleAction = async (apiCall, successMsg) => {
    try {
      setUpdating(true);
      await apiCall(booking.id);
      Alert.alert('Success', successMsg);
      if (onStatusUpdate) await onStatusUpdate();
      onClose();
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to update booking status.');
    } finally {
      setUpdating(false);
    }
  };

  // Parse price number
  const rawPrice = parseFloat(booking.price ? booking.price.replace(/[^0-9.]/g, '') : '0');
  const tax = Math.round(rawPrice * 0.1);
  const tip = rawPrice > 50 ? 15 : 8;
  const total = rawPrice + tax + tip;

  // Set default phone if undefined
  const clientPhone = booking.phone || '9876543210';
  const displayAddress = booking.address || 'Flat 402, Block B, Marvel Zephyr, Kharadi, Pune';

  // Determine timeline steps
  const isConfirmed = ['accepted', 'in_progress', 'completed'].includes(booking.rawStatus);
  const isStarted = ['in_progress', 'completed'].includes(booking.rawStatus);
  const isCompleted = booking.rawStatus === 'completed';
  const isCancelled = ['cancelled', 'rejected'].includes(booking.rawStatus);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* DRAG HANDLE INDICATOR */}
          <View style={styles.dragHandle} />

          {/* HEADER */}
          <View style={styles.header}>
            <Image source={{ uri: booking.avatar }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.clientName}>{booking.name}</Text>
              <Text style={styles.categoryText}>{booking.category}</Text>
              <Text style={styles.dateText}>{booking.date}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* IN-APP CHAT AND CALL SHORTCUTS */}
            {['accepted', 'in_progress', 'confirmed'].includes(booking?.rawStatus) && (
              <View style={styles.contactContainer}>
                <TouchableOpacity 
                  style={[styles.chatBubbleFull, { marginRight: 5 }]} 
                  onPress={() => {
                    onClose();
                    initiateCall(booking.id, booking.customerId, 'client', booking.name);
                  }}
                >
                  <Ionicons name="call" size={20} color="#FF4F8F" />
                  <Text style={styles.contactLabel}>Call Client</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.chatBubbleFull, { marginLeft: 5 }]} 
                  onPress={() => {
                    onClose();
                    if (onChatPress) onChatPress(booking);
                  }}
                >
                  <Ionicons name="chatbubbles" size={20} color="#FF4F8F" />
                  <Text style={styles.contactLabel}>Chat with Client</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STYLE INSPIRATION PHOTOS */}
            <Text style={styles.sectionTitle}>STYLE & PREFERENCES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {STYLE_PREFERENCES.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.prefPhoto} />
              ))}
            </ScrollView>

            {/* SERVICE LOCATION ADDRESS */}
            <Text style={styles.sectionTitle}>SERVICE LOCATION</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationMeta}>
                <Ionicons name="location-sharp" size={16} color="#FF4F8F" />
                <Text style={styles.locationText}>{displayAddress}</Text>
              </View>
            </View>

            {/* PAYMENT INVOICE BREAKDOWN */}
            <Text style={styles.sectionTitle}>PAYMENT BREAKDOWN</Text>
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Service Rate</Text>
                <Text style={styles.invoiceValue}>₹{rawPrice}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Estimated Tax</Text>
                <Text style={styles.invoiceValue}>₹{tax}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Client Tip</Text>
                <Text style={styles.invoiceValue}>₹{tip}</Text>
              </View>
              <View style={styles.invoiceDivider} />
              <View style={styles.invoiceRow}>
                <Text style={[styles.invoiceLabel, styles.invoiceTotalLabel]}>Total Amount</Text>
                <Text style={[styles.invoiceValue, styles.invoiceTotalVal]}>₹{total}</Text>
              </View>
            </View>

            {/* STATUS LOGS TIMELINE */}
            <Text style={styles.sectionTitle}>STATUS HISTORY</Text>
            <View style={styles.timelineContainer}>
              <View style={styles.timelineRow}>
                <Ionicons name="checkmark-circle" size={18} color="#389E0D" />
                <Text style={styles.timelineText}>Request Received</Text>
              </View>
              <View style={styles.timelineLine} />

              {isCancelled ? (
                <View style={styles.timelineRow}>
                  <Ionicons name="close-circle" size={18} color="#CF1322" />
                  <Text style={[styles.timelineText, { color: '#CF1322' }]}>
                    Booking Declined/Cancelled
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.timelineRow}>
                    <Ionicons 
                      name={isConfirmed ? "checkmark-circle" : "ellipse-outline"} 
                      size={18} 
                      color={isConfirmed ? "#389E0D" : "#8A7D77"} 
                    />
                    <Text style={[styles.timelineText, !isConfirmed && styles.timelinePendingText]}>
                      Booking Confirmed
                    </Text>
                  </View>
                  <View style={styles.timelineLine} />

                  <View style={styles.timelineRow}>
                    <Ionicons 
                      name={isStarted ? "checkmark-circle" : "ellipse-outline"} 
                      size={18} 
                      color={isStarted ? "#389E0D" : "#8A7D77"} 
                    />
                    <Text style={[styles.timelineText, !isStarted && styles.timelinePendingText]}>
                      Service Started
                    </Text>
                  </View>
                  <View style={styles.timelineLine} />

                  <View style={styles.timelineRow}>
                    <Ionicons 
                      name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                      size={18} 
                      color={isCompleted ? "#389E0D" : "#8A7D77"} 
                    />
                    <Text style={[styles.timelineText, !isCompleted && styles.timelinePendingText]}>
                      Completed
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          {/* DYNAMIC ACTION BUTTON CONTROLS */}
          <View style={styles.footerActions}>
            {updating ? (
              <ActivityIndicator size="small" color="#FF4F8F" style={{ paddingVertical: 12 }} />
            ) : (
              <>
                {booking.rawStatus === 'pending' && (
                  <View style={styles.doubleActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAction(acceptArtistBooking, 'Booking confirmed successfully.')}
                    >
                      <Text style={styles.actionBtnText}>Accept Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => {
                        setDialogType('reject');
                        setRejectionReasonText('');
                        setRejectModalVisible(true);
                      }}
                    >
                      <Text style={[styles.actionBtnText, styles.declineText]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {booking.rawStatus === 'accepted' && (
                  <View style={styles.doubleActions}>
                    {isTimeReached ? (
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.startBtn]}
                        onPress={() => handleAction(startArtistBooking, 'Service started successfully.')}
                      >
                        <Text style={styles.actionBtnText}>Start Service</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.actionBtn, styles.disabledBtn]}>
                        <Text style={styles.disabledBtnText}>Starts {booking.rawTime}</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => {
                        setDialogType('cancel');
                        setRejectionReasonText('');
                        setRejectModalVisible(true);
                      }}
                    >
                      <Text style={[styles.actionBtnText, styles.declineText]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {booking.rawStatus === 'in_progress' && (
                  <View style={styles.doubleActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.completeBtn]}
                      onPress={() => handleAction(completeArtistBooking, 'Service marked as completed.')}
                    >
                      <Text style={styles.actionBtnText}>Complete Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => {
                        setDialogType('cancel');
                        setRejectionReasonText('');
                        setRejectModalVisible(true);
                      }}
                    >
                      <Text style={[styles.actionBtnText, styles.declineText]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Reject/Cancel Booking Dialog Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>{dialogType === 'cancel' ? 'Cancel Booking' : 'Decline Request'}</Text>
            <Text style={styles.dialogLabel}>
              {dialogType === 'cancel' 
                ? 'Please provide a reason for cancelling this booking:' 
                : 'Please provide a reason for declining this request:'}
            </Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="E.g. Slot unavailable / Personal emergency..."
              placeholderTextColor="#999"
              value={rejectionReasonText}
              onChangeText={setRejectionReasonText}
              multiline
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogCancelBtn]}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectionReasonText('');
                }}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogSubmitBtn]}
                onPress={async () => {
                  if (!rejectionReasonText.trim()) {
                    Alert.alert('Required', 'Please enter a reason.');
                    return;
                  }
                  try {
                    setUpdating(true);
                    setRejectModalVisible(false);
                    if (dialogType === 'cancel') {
                      await cancelArtistBooking(booking.id, rejectionReasonText.trim());
                      Alert.alert('Success', 'Booking cancelled.');
                    } else {
                      await rejectArtistBooking(booking.id, rejectionReasonText.trim());
                      Alert.alert('Success', 'Booking declined.');
                    }
                    setRejectionReasonText('');
                    if (onStatusUpdate) await onStatusUpdate();
                    onClose();
                  } catch (err) {
                    Alert.alert('Error', err.message || 'Failed to process action.');
                  } finally {
                    setUpdating(false);
                  }
                }}
              >
                <Text style={styles.dialogSubmitText}>{dialogType === 'cancel' ? 'Cancel' : 'Decline'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 25,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5DFE2',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
  },
  avatar: {
    width: 50,
    height: 55,
    borderRadius: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },
  categoryText: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#FF4F8F',
    fontWeight: '600',
    fontFamily: 'serif',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contactBubble: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBF3',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  chatBubbleFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBF3',
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F8F',
    marginLeft: 6,
    fontFamily: 'serif',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7D77',
    fontFamily: 'serif',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  photoRow: {
    marginBottom: 20,
  },
  prefPhoto: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
  },
  locationContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
    fontFamily: 'serif',
    lineHeight: 16,
    flex: 1,
  },
  mapImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  invoiceCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  invoiceLabel: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
  },
  invoiceValue: {
    fontSize: 12,
    color: '#111',
    fontFamily: 'serif',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#F3ECF0',
    marginVertical: 6,
  },
  invoiceTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  invoiceTotalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F8F',
  },
  timelineContainer: {
    paddingLeft: 8,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    marginLeft: 10,
    fontFamily: 'serif',
  },
  timelinePendingText: {
    color: '#8A7D77',
  },
  timelineLine: {
    width: 2,
    height: 14,
    backgroundColor: '#F3ECF0',
    marginLeft: 8,
    marginVertical: 2,
  },
  footerActions: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
  },
  doubleActions: {
    flexDirection: 'row',
  },
  acceptBtn: {
    backgroundColor: '#389E0D',
    flex: 1,
    marginRight: 10,
  },
  declineBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#CF1322',
    flex: 0.4,
  },
  declineText: {
    color: '#CF1322',
  },
  startBtn: {
    backgroundColor: '#FF4F8F',
    flex: 1,
    marginRight: 10,
  },
  completeBtn: {
    backgroundColor: '#389E0D',
    flex: 1,
    marginRight: 10,
  },
  disabledBtn: {
    backgroundColor: '#E0D8DB',
    flex: 1,
    marginRight: 10,
  },
  disabledBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7D77',
    fontFamily: 'serif',
  },
  dialogContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  dialogLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: 'serif',
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#222',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  dialogCancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'serif',
  },
  dialogSubmitBtn: {
    backgroundColor: '#CF1322',
  },
  dialogSubmitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'serif',
  },
});

export default ArtistBookingDetailModal;

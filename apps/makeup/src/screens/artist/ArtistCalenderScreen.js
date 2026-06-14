import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const todayObj = new Date();
const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

const INITIAL_SCHEDULE = {
  [todayStr]: [
    { id: '1', time: '10:00 AM', title: 'Sophia Laurent', subtitle: 'Bridal Makeup', type: 'booking' },
    { id: '2', time: '02:00 PM', title: 'Another Booking', subtitle: 'Party Makeup', type: 'booking' },
  ],
  '2024-05-16': [
    { id: 'mock-1', time: '10:00 AM', title: 'Sophia Laurent', subtitle: 'Bridal Makeup', type: 'booking' },
    { id: 'mock-2', time: '02:00 PM', title: 'Another Booking', subtitle: 'Party Makeup', type: 'booking' },
  ],
  '2024-05-04': [
    { id: '3', time: '12:00 PM', title: 'Mia Makeup', subtitle: 'Photoshoot Makeup', type: 'booking' },
  ],
  '2024-05-11': [
    { id: '4', time: '09:00 AM', title: 'Unavailable', subtitle: 'Doctor Appointment', type: 'unavailable' },
  ],
  '2024-05-13': [
    { id: '5', time: '03:00 PM', title: 'Unavailable', subtitle: 'Personal Time', type: 'unavailable' },
  ],
};

const ArtistCalenderScreen = ({ onBack }) => {
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [time, setTime] = useState('11:00 AM');

  // Month details helper
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Handle Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate Calendar Grid
  const generateCalendarDays = () => {
    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // First day of current month (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
    let firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust index to start with Monday (Mon=0, Tue=1, ..., Sun=6)
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];

    // Previous month filler days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }

    // Next month filler days to complete grid (multiples of 7)
    const totalSlots = 42; // standard 6 rows
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Add Unavailable Time
  const handleAddUnavailable = () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason/title for the unavailable time.');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Error', 'Please enter a time slot.');
      return;
    }

    const newItem = {
      id: String(Date.now()),
      time: time.trim(),
      title: 'Unavailable',
      subtitle: reason.trim(),
      type: 'unavailable',
    };

    const currentDaySchedule = schedule[selectedDateStr] || [];
    setSchedule({
      ...schedule,
      [selectedDateStr]: [...currentDaySchedule, newItem],
    });

    setReason('');
    setModalVisible(false);
  };

  // Format Selected Date for display (e.g. "16 May 2024")
  const formatDisplayDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${months[m]} ${y}`;
    } catch (e) {
      return dateStr;
    }
  };

  const selectedDayEvents = schedule[selectedDateStr] || [];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="chevron-back-outline" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Calendar</Text>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      {/* CALENDAR MONTH HEADER */}
      <View style={styles.monthHeaderRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
          <Ionicons name="chevron-back" size={20} color="#8A7D77" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {months[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
          <Ionicons name="chevron-forward" size={20} color="#8A7D77" />
        </TouchableOpacity>
      </View>

      {/* WEEKDAY LABELS */}
      <View style={styles.weekLabelsRow}>
        {daysOfWeek.map(day => (
          <Text key={day} style={styles.weekLabelText}>
            {day}
          </Text>
        ))}
      </View>

      {/* CALENDAR DAYS GRID */}
      <View style={styles.daysGridContainer}>
        {calendarDays.map((item, index) => {
          const isSelected = selectedDateStr === item.dateStr;
          const dayEvents = schedule[item.dateStr] || [];
          const hasBookings = dayEvents.some(e => e.type === 'booking');
          const hasUnavailable = dayEvents.some(e => e.type === 'unavailable');

          // Calculate if item is the actual current date (today)
          const todayDateObj = new Date();
          const todayDateStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;
          const isToday = item.dateStr === todayDateStr;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDayCell,
                (!isSelected && isToday) && styles.todayDayCell,
              ]}
              onPress={() => setSelectedDateStr(item.dateStr)}
            >
              <Text
                style={[
                  styles.dayText,
                  !item.isCurrentMonth && styles.inactiveDayText,
                  isSelected && styles.selectedDayText,
                  (!isSelected && isToday) && styles.todayDayText,
                ]}
              >
                {item.day}
              </Text>
              
              {/* Dot Indicators */}
              <View style={styles.dotsRow}>
                {hasBookings && <View style={[styles.dot, styles.bookingDot]} />}
                {hasUnavailable && <View style={[styles.dot, styles.unavailableDot]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SELECTED DATE SECTION HEADER */}
      <View style={styles.selectedDateHeader}>
        <Text style={styles.selectedDateText}>
          {formatDisplayDate(selectedDateStr)}
        </Text>
      </View>

      {/* DAY SCHEDULE LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scheduleListContainer}
      >
        {selectedDayEvents.length > 0 ? (
          selectedDayEvents.map(event => {
            const isBooking = event.type === 'booking';
            return (
              <View
                key={event.id}
                style={[
                  styles.eventCard,
                  isBooking ? styles.bookingEventCard : styles.unavailableEventCard,
                ]}
              >
                <View style={styles.eventLeft}>
                  {/* Circle Indicator */}
                  <View style={styles.indicatorContainer}>
                    {isBooking ? (
                      <View style={styles.bookingCircle} />
                    ) : (
                      <View style={styles.unavailableCircle} />
                    )}
                  </View>
                  
                  {/* Time label */}
                  <Text style={styles.eventTime}>{event.time}</Text>

                  {/* Details */}
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.subtitle}</Text>
                    <Text style={styles.eventSubtitle}>{isBooking ? 'Booking' : 'Unavailable Block'}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyScheduleContainer}>
            <Text style={styles.emptyScheduleText}>No bookings or unavailable time blocks.</Text>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.addTimeButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.addTimeButtonText}>Add Unavailable Time</Text>
        </TouchableOpacity>
      </View>

      {/* ADD UNAVAILABLE TIME MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Unavailable Time</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Modal Body / Input Fields */}
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Reason / Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Doctor's appointment, Lunch break"
                placeholderTextColor="#A99F9A"
                value={reason}
                onChangeText={setReason}
              />

              <Text style={styles.inputLabel}>Time (e.g. 11:00 AM)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 11:00 AM, 02:00 PM"
                placeholderTextColor="#A99F9A"
                value={time}
                onChangeText={setTime}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleAddUnavailable}
              >
                <Text style={styles.modalSubmitText}>Save Unavailable Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ArtistCalenderScreen;

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

  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },

  monthNavButton: {
    padding: 8,
    marginHorizontal: 12,
  },

  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  weekLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  weekLabelText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  daysGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    backgroundColor: '#FCFCFC',
  },

  dayCell: {
    width: '14.28%', // 7 days per row
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 22,
    position: 'relative',
  },

  selectedDayCell: {
    backgroundColor: '#FF4F8F',
  },

  todayDayCell: {
    borderWidth: 1.5,
    borderColor: '#FF4F8F',
  },

  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'serif',
  },

  inactiveDayText: {
    color: '#CCCCCC',
  },

  selectedDayText: {
    color: '#FFF',
    fontWeight: '700',
  },

  todayDayText: {
    color: '#FF4F8F',
    fontWeight: '700',
  },

  dotsRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },

  bookingDot: {
    backgroundColor: '#FF4F8F',
  },

  unavailableDot: {
    backgroundColor: '#0958D9',
  },

  selectedDateHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  selectedDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  scheduleListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  eventCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    alignItems: 'center',
  },

  bookingEventCard: {
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4F8F',
  },

  unavailableEventCard: {
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: '#0958D9',
  },

  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  indicatorContainer: {
    marginRight: 12,
  },

  bookingCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
  },

  unavailableCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0958D9',
  },

  eventTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    width: 80,
  },

  eventInfo: {
    flex: 1,
    marginLeft: 8,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  eventSubtitle: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 1,
  },

  emptyScheduleContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyScheduleText: {
    fontSize: 13,
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(252, 252, 252, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  addTimeButton: {
    backgroundColor: '#FF4F8F',
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  addTimeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
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
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
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
});

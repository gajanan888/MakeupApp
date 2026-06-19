import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM',
];

// Build calendar grid for a given month/year
// Returns array of {day, isCurrentMonth, isToday, isPast} objects padded to full weeks
const buildCalendar = (year, month) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  // Monday = 0 offset (0=Mon, 6=Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Trailing days from prev month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPast: true });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({
      day: d,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isPast: date < today,
      date,
    });
  }

  // Leading days of next month
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, isCurrentMonth: false, isPast: false });
    }
  }

  return cells;
};

const SelectDateTimeScreen = ({ navigation, route }) => {
  const { artist, selectedService, selectedLocation } = route?.params || {};

  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const calendarCells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelectDay = (cell) => {
    if (!cell.isCurrentMonth || cell.isPast) return;
    setSelectedDate(cell.date);
    setSelectedTime(null); // Reset time when date changes
  };

  const isSelectedDate = (cell) => {
    if (!selectedDate || !cell.date) return false;
    return cell.date.getTime() === selectedDate.getTime();
  };

  const handleNext = () => {
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a date.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Required', 'Please select a time slot.');
      return;
    }

    const dateStr = selectedDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    navigation.navigate('AddOns', {
      artist,
      selectedService,
      selectedLocation,
      selectedDate: selectedDate.toISOString(),
      selectedTime,
      dateStr,
    });
  };

  // Format selected date label e.g. "Thu, 16 May 2024"
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Calendar Card ───────────────────────────────────────────── */}
        <View style={styles.calendarCard}>

          {/* Month Navigator */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Day-of-Week Labels */}
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((lbl) => (
              <View key={lbl} style={styles.dayLabelCell}>
                <Text style={styles.dayLabelText}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, idx) => {
              const isSelected = isSelectedDate(cell);
              const isToday    = cell.isToday;
              const isGray     = !cell.isCurrentMonth || cell.isPast;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleSelectDay(cell)}
                  activeOpacity={cell.isCurrentMonth && !cell.isPast ? 0.7 : 1}
                  disabled={!cell.isCurrentMonth || cell.isPast}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isGray      && styles.dayTextGray,
                      isToday     && !isSelected && styles.dayTextToday,
                      isSelected  && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {/* Today indicator dot */}
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF4F87' }]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8E8E8' }]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
          </View>
        </View>

        {/* ── Selected Date Pill ─────────────────────────────────────── */}
        {selectedDateLabel && (
          <View style={styles.selectedDatePill}>
            <Ionicons name="calendar-outline" size={15} color="#FF4F87" />
            <Text style={styles.selectedDateText}>{selectedDateLabel}</Text>
          </View>
        )}

        {/* ── Time Slots ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Available Time Slots</Text>

        <View style={styles.timeSlotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const isActive = selectedTime === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.timeChip, isActive && styles.timeChipActive]}
                onPress={() => setSelectedTime(slot)}
                activeOpacity={0.75}
              >
                <Text style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Next Button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            (!selectedDate || !selectedTime) && styles.nextBtnDisabled,
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectDateTimeScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8FA',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.1,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ── Calendar Card ──────────────────────────────────────────────────────────
  calendarCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },

  // Month row
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F6F6F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.2,
  },

  // Day labels row
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dayLabelCell: {
    width: DAY_CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#BBBBBB',
    letterSpacing: 0.3,
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DAY_CELL_SIZE / 2,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#FF4F87',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222',
  },
  dayTextGray: {
    color: '#CCCCCC',
  },
  dayTextToday: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF4F87',
    position: 'absolute',
    bottom: 5,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#999',
  },

  // Selected Date Pill
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 6,
  },
  selectedDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF4F87',
  },

  // ── Time Slots ─────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  timeChip: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 98,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  timeChipTextActive: {
    color: '#FFF',
  },

  // ── Next Button ────────────────────────────────────────────────────────────
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
  nextBtnDisabled: {
    backgroundColor: '#FFAEC4',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getArtistBookedSlots, getArtists } from '../../api/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TIME_SLOTS = [
  'Morning Slot (7:00 AM - 11:00 AM)',
  'Afternoon Slot (11:00 AM - 3:00 PM)',
  'Evening Slot (3:00 PM - 8:00 PM)',
  'Night Slot (8:00 PM - 7:00 AM)',
];

const SLOT_START_HOURS = {
  'Morning Slot (7:00 AM - 11:00 AM)': 7,
  'Afternoon Slot (11:00 AM - 3:00 PM)': 11,
  'Evening Slot (3:00 PM - 8:00 PM)': 15,
  'Night Slot (8:00 PM - 7:00 AM)': 20,
};

const SLOT_END_HOURS = {
  'Morning Slot (7:00 AM - 11:00 AM)': 11,
  'Afternoon Slot (11:00 AM - 3:00 PM)': 15,
  'Evening Slot (3:00 PM - 8:00 PM)': 20,
  'Night Slot (8:00 PM - 7:00 AM)': 7,
};

const SLOT_PRESETS = {
  'Morning Slot (7:00 AM - 11:00 AM)': [
    '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  ],
  'Afternoon Slot (11:00 AM - 3:00 PM)': [
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  ],
  'Evening Slot (3:00 PM - 8:00 PM)': [
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM',
  ],
  'Night Slot (8:00 PM - 7:00 AM)': [
    '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM',
  ],
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim();
  if (!cleaned) return null;

  // Pattern 1: HH:MM AM/PM or HH AM/PM (e.g. 8:30 AM, 08:30am, 9 PM, 9:00 PM)
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const ampm = match12[3].toUpperCase();

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Pattern 2: HH:MM 24-hour format (e.g. 08:30, 14:30, 09:00)
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  // Pattern 3: Simple hour integer (e.g. 8, 14, 9)
  const matchHour = cleaned.match(/^(\d{1,2})$/);
  if (matchHour) {
    const hours = parseInt(matchHour[1], 10);
    if (hours < 0 || hours > 23) return null;
    return hours * 60;
  }

  return null;
};

export const validateSlotTime = (timeStr, slot, selectedDate) => {
  if (!slot) return { isValid: false, error: 'Please select a time slot first.' };
  if (!timeStr || !timeStr.trim()) return { isValid: false, error: 'Please specify the service start time.' };

  const totalMins = parseTimeToMinutes(timeStr);
  if (totalMins === null) {
    return { isValid: false, error: 'Invalid time format. Example: 08:30 AM or 14:30' };
  }

  let startMins = 7 * 60; // 07:00 AM
  let endMins = 11 * 60;  // 11:00 AM
  let slotName = 'Morning Slot';

  if (slot.includes('Afternoon')) {
    startMins = 11 * 60; // 11:00 AM
    endMins = 15 * 60;   // 15:00 (3:00 PM)
    slotName = 'Afternoon Slot';
  } else if (slot.includes('Evening')) {
    startMins = 15 * 60; // 15:00 (3:00 PM)
    endMins = 20 * 60;   // 20:00 (8:00 PM)
    slotName = 'Evening Slot';
  } else if (slot.includes('Night')) {
    return { isValid: true };
  }

  if (totalMins < startMins || totalMins > endMins) {
    const formatMins = (m) => {
      let h = Math.floor(m / 60);
      const min = m % 60;
      const ap = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${h}:${String(min).padStart(2, '0')} ${ap}`;
    };
    return {
      isValid: false,
      error: `Time must be between ${formatMins(startMins)} and ${formatMins(endMins)} for ${slotName}.`,
    };
  }

  if (selectedDate) {
    const now = new Date();
    const isToday =
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    if (isToday) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (totalMins <= nowMins) {
        return { isValid: false, error: 'This time has already passed today.' };
      }
    }
  }

  return { isValid: true, error: null };
};

// Parse advance notice string into milliseconds
export const parseAdvanceNoticeMs = (noticeStr) => {
  if (!noticeStr || typeof noticeStr !== 'string') return 0;
  const str = noticeStr.trim().toLowerCase();

  if (str.includes('24 hour') || str === '24h' || str === '24 hrs') return 24 * 60 * 60 * 1000;
  if (str.includes('48 hour') || str === '48h' || str === '48 hrs') return 48 * 60 * 60 * 1000;
  if (str.includes('1 week') || str === '1wk') return 7 * 24 * 60 * 60 * 1000;
  if (str.includes('2 week') || str === '2wks') return 14 * 24 * 60 * 60 * 1000;
  if (str.includes('1 month') || str === '1mo') return 30 * 24 * 60 * 60 * 1000;

  const match = str.match(/(\d+)\s*(hour|hr|day|d|week|wk|month|mo)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith('hour') || unit === 'hr') return num * 60 * 60 * 1000;
    if (unit.startsWith('day') || unit === 'd') return num * 24 * 60 * 60 * 1000;
    if (unit.startsWith('week') || unit === 'wk') return num * 7 * 24 * 60 * 60 * 1000;
    if (unit.startsWith('month') || unit === 'mo') return num * 30 * 24 * 60 * 60 * 1000;
  }
  return 0;
};

// Build calendar grid for a given month/year respecting minBookingTime
const buildCalendar = (year, month, minBookingTime) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Trailing days from prev month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPast: true, isUnavailable: true });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateMidnight = new Date(date);
    dateMidnight.setHours(0, 0, 0, 0);

    const isPast = dateMidnight < today;

    const maxSlotStartTimeOnDate = new Date(year, month, d, 23, 59, 59, 999);
    const isAdvanceRestricted = dateMidnight.getTime() === today.getTime() ? false : maxSlotStartTimeOnDate < minBookingTime;

    const isUnavailable = isPast || isAdvanceRestricted;

    cells.push({
      day: d,
      isCurrentMonth: true,
      isToday: dateMidnight.getTime() === today.getTime(),
      isPast,
      isAdvanceRestricted,
      isUnavailable,
      date,
    });
  }

  // Leading days of next month
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, isCurrentMonth: false, isPast: false, isUnavailable: true });
    }
  }

  return cells;
};

const SelectDateTimeScreen = ({ navigation, route }) => {
  const { artist, selectedService, selectedLocation } = route?.params || {};

  const [artistData, setArtistData] = useState(artist);
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null); // Selected Slot Name
  const [exactTime, setExactTime] = useState('');         // Selected/Entered Exact Service Time (e.g. "08:30 AM")
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingBooked, setLoadingBooked] = useState(false);

  useEffect(() => {
    if (artist?.id) {
      const fetchData = async () => {
        try {
          setLoadingBooked(true);
          const [slots, artistsList] = await Promise.all([
            getArtistBookedSlots(artist.id),
            getArtists({ id: artist.id }).catch(() => []),
          ]);
          setBookedSlots(slots);
          if (artistsList && artistsList.length > 0) {
            setArtistData(prev => ({
              ...prev,
              ...artistsList[0],
              bookingPolicy: artistsList[0].bookingPolicy || prev?.bookingPolicy,
            }));
          }
        } catch (err) {
          console.warn('Failed to fetch artist details or booked slots:', err);
        } finally {
          setLoadingBooked(false);
        }
      };
      fetchData();
    }
  }, [artist?.id]);

  const advanceNotice = artistData?.bookingPolicy?.advanceNotice || artistData?.advanceNotice;
  const noticeMs = useMemo(() => parseAdvanceNoticeMs(advanceNotice), [advanceNotice]);

  const minBookingTime = useMemo(() => {
    const now = new Date();
    if (noticeMs <= 0) return now;
    return new Date(now.getTime() + noticeMs);
  }, [noticeMs]);

  const calendarCells = useMemo(() => buildCalendar(viewYear, viewMonth, minBookingTime), [viewYear, viewMonth, minBookingTime]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelectDay = (cell) => {
    if (!cell.isCurrentMonth || cell.isUnavailable) return;
    setSelectedDate(cell.date);
    setSelectedTime(null);
    setExactTime('');
  };

  const handleSelectSlot = (slot) => {
    setSelectedTime(slot);
    const defaultTime = slot.includes('Morning')
      ? '08:00 AM'
      : slot.includes('Afternoon')
      ? '12:00 PM'
      : '04:00 PM';
    setExactTime(defaultTime);
  };

  const isSelectedDate = (cell) => {
    if (!selectedDate || !cell.date) return false;
    return cell.date.getTime() === selectedDate.getTime();
  };

  const slotValidation = useMemo(() => {
    if (!selectedTime) return { isValid: false, error: null };
    return validateSlotTime(exactTime, selectedTime, selectedDate);
  }, [exactTime, selectedTime, selectedDate]);

  const timeSlotStatuses = useMemo(() => {
    if (!selectedDate) return TIME_SLOTS.map(slot => ({ slot, isAvailable: true, statusText: null }));

    const now = new Date();
    const isTodaySelected =
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return TIME_SLOTS.map(slot => {
      // 1. Check if slot is already booked or blocked for this artist
      const isBooked = bookedSlots.some(b => {
        return b.date === dateStr && b.time.trim() === slot.trim();
      });
      if (isBooked) {
        return { slot, isAvailable: false, statusText: 'Booked / Unavailable' };
      }

      // 2. Check if slot has already passed today
      if (isTodaySelected) {
        let slotEndTime = new Date(selectedDate);
        if (slot.includes('Night')) {
          // Night slot ends at 7:00 AM the next day
          slotEndTime.setDate(slotEndTime.getDate() + 1);
          slotEndTime.setHours(7, 0, 0, 0);
        } else {
          const endHour = SLOT_END_HOURS[slot] || 23;
          slotEndTime.setHours(endHour, 0, 0, 0);
        }

        if (now >= slotEndTime) {
          return { slot, isAvailable: false, statusText: 'Slot Passed' };
        }
      }

      // 3. Check minimum advance notice limit requirement (Night Slot available for tonight testing)
      if (slot.includes('Night')) {
        return { slot, isAvailable: true, statusText: null };
      }

      const startHour = SLOT_START_HOURS[slot] || 7;
      const slotStartTime = new Date(selectedDate);
      slotStartTime.setHours(startHour, 0, 0, 0);

      if (slotStartTime < minBookingTime) {
        return {
          slot,
          isAvailable: false,
          statusText: advanceNotice ? `Requires ${advanceNotice} Notice` : 'Advance Notice Limit',
        };
      }

      return { slot, isAvailable: true, statusText: null };
    });
  }, [selectedDate, bookedSlots, minBookingTime, advanceNotice]);

  const handleNext = () => {
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a date.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Required', 'Please select a time slot.');
      return;
    }
    if (!exactTime || !exactTime.trim()) {
      Alert.alert('Required', 'Please enter or select a specific service time.');
      return;
    }
    if (!slotValidation.isValid) {
      Alert.alert('Invalid Time', slotValidation.error || 'The entered time is invalid for the selected slot.');
      return;
    }

    const slotPrefix = selectedTime.startsWith('Morning')
      ? 'Morning Slot'
      : selectedTime.startsWith('Afternoon')
      ? 'Afternoon Slot'
      : selectedTime.startsWith('Night')
      ? 'Night Slot'
      : 'Evening Slot';

    const finalTimeString = `${slotPrefix} (${exactTime.trim()})`;

    const dateStr = selectedDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    navigation.navigate('AddOns', {
      artist: artistData || artist,
      selectedService,
      selectedLocation,
      selectedDate: selectedDate.toISOString(),
      selectedTime: finalTimeString,
      dateStr,
    });
  };

  // Format selected date label e.g. "Thu, 16 May 2024"
  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
        {/* Advance Notice Info Banner */}
        {!!advanceNotice && (
          <View style={styles.advanceNoticeBanner}>
            <View style={styles.advanceNoticeBannerHeader}>
              <Ionicons name="time-outline" size={18} color="#FF4F87" />
              <Text style={styles.advanceNoticeBannerTitle}>Artist Advance Booking Time</Text>
            </View>
            <Text style={styles.advanceNoticeBannerText}>
              This artist requires a minimum advance notice of{' '}
              <Text style={styles.advanceNoticeBannerHighlight}>{advanceNotice}</Text>.
              Dates and time slots prior to this notice window are unavailable.
            </Text>
          </View>
        )}

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
              const isGray     = !cell.isCurrentMonth || cell.isUnavailable;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleSelectDay(cell)}
                  activeOpacity={cell.isCurrentMonth && !cell.isUnavailable ? 0.7 : 1}
                  disabled={!cell.isCurrentMonth || cell.isUnavailable}
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

        {loadingBooked ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#FF4F87" />
          </View>
        ) : !selectedDate ? (
          <Text style={styles.selectDatePromptText}>Please select a date to view available time slots.</Text>
        ) : (
          <View>
            <View style={styles.timeSlotsGrid}>
              {timeSlotStatuses.map(({ slot, isAvailable, statusText }) => {
                const isActive = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeChip,
                      isActive && styles.timeChipActive,
                      !isAvailable && styles.timeChipDisabled,
                    ]}
                    onPress={() => {
                      if (isAvailable) handleSelectSlot(slot);
                    }}
                    disabled={!isAvailable}
                    activeOpacity={isAvailable ? 0.75 : 1}
                  >
                    <View style={styles.timeChipContent}>
                      <Text
                        style={[
                          styles.timeChipText,
                          isActive && styles.timeChipTextActive,
                          !isAvailable && styles.timeChipTextDisabled,
                        ]}
                      >
                        {slot}
                      </Text>
                      {!isAvailable && (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableBadgeText}>{statusText || 'Unavailable'}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Exact Service Start Time Chips (Scoped to Selected Slot) ── */}
            {selectedTime && (
              <View style={styles.exactTimeCard}>
                <View style={styles.exactTimeHeader}>
                  <Ionicons name="time-outline" size={18} color="#FF4F87" />
                  <Text style={styles.exactTimeTitle}>Select Service Start Time</Text>
                </View>
                <Text style={styles.exactTimeSubtext}>
                  Choose a start time within{' '}
                  <Text style={styles.exactTimeSubtextHighlight}>
                    {selectedTime.includes('Morning')
                      ? '7:00 AM - 11:00 AM'
                      : selectedTime.includes('Afternoon')
                      ? '11:00 AM - 3:00 PM'
                      : '3:00 PM - 8:00 PM'}
                  </Text>
                </Text>

                {/* Preset Time Chips Grid */}
                <View style={styles.presetGrid}>
                  {(SLOT_PRESETS[selectedTime] || []).map((preset) => {
                    const isPresetActive = exactTime.trim().toUpperCase() === preset.trim().toUpperCase();

                    // Check if preset time has already passed today
                    let isPastTime = false;
                    if (selectedDate) {
                      const now = new Date();
                      const isToday =
                        selectedDate.getDate() === now.getDate() &&
                        selectedDate.getMonth() === now.getMonth() &&
                        selectedDate.getFullYear() === now.getFullYear();

                      if (isToday) {
                        const presetMins = parseTimeToMinutes(preset);
                        const nowMins = now.getHours() * 60 + now.getMinutes();
                        if (presetMins !== null && presetMins <= nowMins) {
                          isPastTime = true;
                        }
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.presetGridChip,
                          isPresetActive && styles.presetGridChipActive,
                          isPastTime && styles.presetGridChipDisabled,
                        ]}
                        onPress={() => {
                          if (!isPastTime) setExactTime(preset);
                        }}
                        disabled={isPastTime}
                        activeOpacity={isPastTime ? 1 : 0.75}
                      >
                        <Text
                          style={[
                            styles.presetGridChipText,
                            isPresetActive && styles.presetGridChipTextActive,
                            isPastTime && styles.presetGridChipTextDisabled,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Next Button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            (!selectedDate || !selectedTime || !exactTime || !slotValidation.isValid) && styles.nextBtnDisabled,
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8FA',
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

  // Advance Notice Banner
  advanceNoticeBanner: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFD6E5',
  },
  advanceNoticeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  advanceNoticeBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4F87',
  },
  advanceNoticeBannerText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  advanceNoticeBannerHighlight: {
    fontWeight: '700',
    color: '#FF4F87',
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
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  timeChip: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  timeChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeChipDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  timeChipTextActive: {
    color: '#FFF',
  },
  timeChipTextDisabled: {
    color: '#9CA3AF',
  },
  unavailableBadge: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  unavailableBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  // ── Exact Time Section ─────────────────────────────────────────────────────
  exactTimeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  exactTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  exactTimeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  exactTimeSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  exactTimeSubtextHighlight: {
    fontWeight: '700',
    color: '#FF4F87',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  presetGridChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: '28%',
    flexGrow: 1,
  },
  presetGridChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  presetGridChipDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  presetGridChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  presetGridChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  presetGridChipTextDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
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
  selectDatePromptText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 24,
  },
});

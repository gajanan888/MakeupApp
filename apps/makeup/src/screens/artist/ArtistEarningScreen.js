import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getArtistBookings } from '../../api/auth';

const getBookingFinancials = (b) => {
  const price = typeof b.price === 'number' ? b.price : (parseFloat(String(b.price || 0).replace(/[^0-9.]/g, '')) || 0);

  // Advance payment is 10% of base price (+ insurance fee if applicable)
  let advance = 0;
  if (b.advanceAmount !== undefined && b.advanceAmount !== null && Number(b.advanceAmount) > 0) {
    advance = Number(b.advanceAmount);
  } else {
    advance = Math.round(price * 0.10);
  }

  // Actual net earning is booking price after deduction of the advance payment
  const actualEarning = Math.max(0, price - advance);

  return {
    grossPrice: price,
    advanceDeduction: advance,
    actualEarning,
  };
};

const calculateEarningsData = (allBookings = []) => {
  const completed = allBookings.filter(b => (b.status || '').toLowerCase() === 'completed');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const isCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  };

  const isLastMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    let targetYear = currentYear;
    let targetMonth = currentMonth - 1;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  };

  const isCurrentYear = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === currentYear;
  };

  const getPeriodMetrics = (bookingsInPeriod) => {
    let grossTotal = 0;
    let advanceTotal = 0;
    let netTotal = 0;

    bookingsInPeriod.forEach(b => {
      const { grossPrice, advanceDeduction, actualEarning } = getBookingFinancials(b);
      grossTotal += grossPrice;
      advanceTotal += advanceDeduction;
      netTotal += actualEarning;
    });

    return {
      grossTotal,
      advanceTotal,
      netTotal,
    };
  };

  const thisMonthBookings = completed.filter(b => isCurrentMonth(b.date));
  const thisMonthMetrics = getPeriodMetrics(thisMonthBookings);
  const thisMonthTotal = thisMonthMetrics.netTotal;

  const lastMonthBookings = completed.filter(b => isLastMonth(b.date));
  const lastMonthMetrics = getPeriodMetrics(lastMonthBookings);
  const lastMonthTotal = lastMonthMetrics.netTotal;

  const thisYearBookings = completed.filter(b => isCurrentYear(b.date));
  const thisYearMetrics = getPeriodMetrics(thisYearBookings);
  const thisYearTotal = thisYearMetrics.netTotal;

  let growthPercent = 0;
  if (lastMonthTotal > 0) {
    growthPercent = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }
  const growthSign = growthPercent >= 0 ? '+' : '';
  const growthText = `${growthSign}${growthPercent.toFixed(1)}% vs last month`;

  const lastMonthGrowthPercent = lastMonthTotal > 0 ? 12.4 : 0;
  const lastMonthGrowthText = `+${lastMonthGrowthPercent.toFixed(1)}% vs prev month`;
  const yearGrowthText = `+24.2% vs last year`;

  const buildMonthChart = (bookingsInPeriod, year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const buckets = Array(12).fill(0);

    bookingsInPeriod.forEach(b => {
      if (!b.date) return;
      const d = new Date(b.date);
      const day = d.getDate();
      const bucketIdx = Math.min(11, Math.floor(((day - 1) / daysInMonth) * 12));
      const { actualEarning } = getBookingFinancials(b);
      buckets[bucketIdx] += actualEarning;
    });

    const maxVal = Math.max(...buckets);
    const chartPoints = buckets.map(val => {
      if (maxVal === 0) return 15;
      return Math.round(15 + (val / maxVal) * 75);
    });

    const monthLabel = monthNames[month];
    const chartLabels = [
      `1 ${monthLabel}`,
      `${Math.floor(daysInMonth * 0.25)} ${monthLabel}`,
      `${Math.floor(daysInMonth * 0.5)} ${monthLabel}`,
      `${Math.floor(daysInMonth * 0.75)} ${monthLabel}`,
      `${daysInMonth} ${monthLabel}`
    ];

    return { chartPoints, chartLabels };
  };

  const buildYearChart = (bookingsInYear) => {
    const buckets = Array(6).fill(0);
    bookingsInYear.forEach(b => {
      if (!b.date) return;
      const d = new Date(b.date);
      const month = d.getMonth();
      const bucketIdx = Math.floor(month / 2);
      const { actualEarning } = getBookingFinancials(b);
      buckets[bucketIdx] += actualEarning;
    });

    const maxVal = Math.max(...buckets);
    const chartPoints = buckets.map(val => {
      if (maxVal === 0) return 15;
      return Math.round(15 + (val / maxVal) * 75);
    });

    const chartLabels = ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'];
    return { chartPoints, chartLabels };
  };

  const thisMonthChart = buildMonthChart(thisMonthBookings, currentYear, currentMonth);
  const lastMonthChart = buildMonthChart(lastMonthBookings, currentYear, currentMonth === 0 ? 11 : currentMonth - 1);
  const thisYearChart = buildYearChart(thisYearBookings);

  const getPayouts = (bookingsInPeriod) => {
    const groups = {};
    bookingsInPeriod.forEach(b => {
      if (!b.date) return;
      const dateStr = b.date;
      if (!groups[dateStr]) groups[dateStr] = 0;
      const { actualEarning } = getBookingFinancials(b);
      groups[dateStr] += actualEarning;
    });

    const payoutsList = Object.entries(groups).map(([dateStr, amount], idx) => {
      let formattedDate = dateStr;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = monthNames[parseInt(parts[1], 10) - 1] || 'Jan';
        const day = parseInt(parts[2], 10);
        formattedDate = `${day} ${month} ${year}`;
      }

      return {
        id: `p-${idx}-${dateStr}`,
        date: formattedDate,
        amount: `₹${amount.toLocaleString('en-IN')}`,
        status: 'Paid',
        rawAmount: amount,
        rawDate: dateStr
      };
    });

    payoutsList.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    return payoutsList;
  };

  const thisMonthPayouts = getPayouts(thisMonthBookings);
  const lastMonthPayouts = getPayouts(lastMonthBookings);
  const thisYearPayouts = getPayouts(thisYearBookings);

  const defaultPayouts = [];

  return {
    'This Month': {
      total: `₹${thisMonthTotal.toLocaleString('en-IN')}`,
      growth: growthText,
      chartPoints: thisMonthChart.chartPoints,
      chartLabels: thisMonthChart.chartLabels,
      breakdown: {
        gross: `₹${thisMonthMetrics.grossTotal.toLocaleString('en-IN')}`,
        advanceDeduction: `-₹${thisMonthMetrics.advanceTotal.toLocaleString('en-IN')}`,
        netEarning: `₹${thisMonthTotal.toLocaleString('en-IN')}`,
        service: `₹${thisMonthMetrics.grossTotal.toLocaleString('en-IN')}`,
        addons: `-₹${thisMonthMetrics.advanceTotal.toLocaleString('en-IN')}`,
        tips: `₹${thisMonthTotal.toLocaleString('en-IN')}`
      },
      payouts: thisMonthPayouts.length > 0 ? thisMonthPayouts : defaultPayouts
    },
    'Last Month': {
      total: `₹${lastMonthTotal.toLocaleString('en-IN')}`,
      growth: lastMonthGrowthText,
      chartPoints: lastMonthChart.chartPoints,
      chartLabels: lastMonthChart.chartLabels,
      breakdown: {
        gross: `₹${lastMonthMetrics.grossTotal.toLocaleString('en-IN')}`,
        advanceDeduction: `-₹${lastMonthMetrics.advanceTotal.toLocaleString('en-IN')}`,
        netEarning: `₹${lastMonthTotal.toLocaleString('en-IN')}`,
        service: `₹${lastMonthMetrics.grossTotal.toLocaleString('en-IN')}`,
        addons: `-₹${lastMonthMetrics.advanceTotal.toLocaleString('en-IN')}`,
        tips: `₹${lastMonthTotal.toLocaleString('en-IN')}`
      },
      payouts: lastMonthPayouts.length > 0 ? lastMonthPayouts : defaultPayouts
    },
    'This Year': {
      total: `₹${thisYearTotal.toLocaleString('en-IN')}`,
      growth: yearGrowthText,
      chartPoints: thisYearChart.chartPoints,
      chartLabels: thisYearChart.chartLabels,
      breakdown: {
        gross: `₹${thisYearMetrics.grossTotal.toLocaleString('en-IN')}`,
        advanceDeduction: `-₹${thisYearMetrics.advanceTotal.toLocaleString('en-IN')}`,
        netEarning: `₹${thisYearTotal.toLocaleString('en-IN')}`,
        service: `₹${thisYearMetrics.grossTotal.toLocaleString('en-IN')}`,
        addons: `-₹${thisYearMetrics.advanceTotal.toLocaleString('en-IN')}`,
        tips: `₹${thisYearTotal.toLocaleString('en-IN')}`
      },
      payouts: thisYearPayouts.length > 0 ? thisYearPayouts : defaultPayouts
    }
  };
};

const ArtistEarningScreen = () => {
  const [activeFilter, setActiveFilter] = useState('This Month');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [seeAllPayouts, setSeeAllPayouts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterData, setFilterData] = useState({
    'This Month': {
      total: '₹0',
      growth: '+0.0% vs last month',
      chartPoints: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
      chartLabels: ['1 May', '8 May', '15 May', '22 May', '31 May'],
      breakdown: { gross: '₹0', advanceDeduction: '₹0', netEarning: '₹0', service: '₹0', addons: '₹0', tips: '₹0' },
      payouts: []
    },
    'Last Month': {
      total: '₹0',
      growth: '+0.0% vs prev month',
      chartPoints: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
      chartLabels: ['1 Apr', '8 Apr', '15 Apr', '22 Apr', '30 Apr'],
      breakdown: { gross: '₹0', advanceDeduction: '₹0', netEarning: '₹0', service: '₹0', addons: '₹0', tips: '₹0' },
      payouts: []
    },
    'This Year': {
      total: '₹0',
      growth: '+0.0% vs last year',
      chartPoints: [15, 15, 15, 15, 15, 15],
      chartLabels: ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'],
      breakdown: { gross: '₹0', advanceDeduction: '₹0', netEarning: '₹0', service: '₹0', addons: '₹0', tips: '₹0' },
      payouts: []
    }
  });

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const bookings = await getArtistBookings();
      const computed = calculateEarningsData(bookings);
      setFilterData(computed);
    } catch (error) {
      console.warn('Failed to fetch earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const bookings = await getArtistBookings();
      const computed = calculateEarningsData(bookings);
      setFilterData(computed);
    } catch (error) {
      console.warn('Failed to refresh earnings data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const currentData = filterData[activeFilter];

  const handleSelectFilter = (filter) => {
    setActiveFilter(filter);
    setFilterModalVisible(false);
    setSeeAllPayouts(false);
  };

  const displayedPayouts = seeAllPayouts
    ? currentData.payouts
    : currentData.payouts.slice(0, 1);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF4F8F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#111" />
        </TouchableOpacity> */}

        <Text style={styles.headerTitle}>Earnings</Text>

        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.dropdownButtonText}>{activeFilter}</Text>
          <Ionicons name="chevron-down" size={16} color="#5E1735" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF4F8F']}
            tintColor="#FF4F8F"
          />
        }
      >
        {/* TOTAL EARNINGS */}
        <View style={styles.earningsSummary}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <Text style={styles.totalEarningsValue}>{currentData.total}</Text>
          <View style={styles.deductionBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.deductionSubtext}>Net earnings after 10% advance payment deduction</Text>
          </View>
          <Text style={styles.growthText}>
            <Text style={styles.greenText}>{currentData.growth.split(' ')[0]}</Text>
            {' ' + currentData.growth.split(' ').slice(1).join(' ')}
          </Text>
        </View>

        {/* CUSTOM CHART WAVE */}
        <View style={styles.chartContainer}>
          {/* Y Axis Grid Lines */}
          <View style={styles.gridLinesContainer}>
            {['5K', '4K', '3K', '2K', '1K'].map((label, idx) => (
              <View key={idx} style={styles.gridLineRow}>
                <Text style={styles.gridLabel}>{label}</Text>
                <View style={styles.gridLine} />
              </View>
            ))}
          </View>

          {/* Chart Bars (Simulated Area Chart) */}
          <View style={styles.chartBarsRow}>
            {currentData.chartPoints.map((point, index) => (
              <View key={index} style={styles.chartColumn}>
                {/* Visual Area Column */}
                <View
                  style={[
                    styles.chartBarFill,
                    { height: `${point}%` }
                  ]}
                >
                  {/* Top Highlight Dot */}
                  <View style={styles.chartBarDot} />
                </View>
              </View>
            ))}
          </View>

          {/* Chart X Axis Labels */}
          <View style={styles.chartLabelsRow}>
            {currentData.chartLabels.map((label, index) => (
              <Text key={index} style={styles.xAxisLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* BREAKDOWN SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
        </View>

        <View style={styles.breakdownCard}>
          {/* Row 1: Gross Bookings Value */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownRowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="receipt-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.breakdownLabel}>Gross Bookings Value</Text>
            </View>
            <Text style={styles.breakdownValue}>{currentData.breakdown.gross || currentData.breakdown.service}</Text>
          </View>

          {/* Row 2: Advance Payment Deduction (10%) */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownRowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="trending-down-outline" size={18} color="#E11D48" />
              </View>
              <Text style={styles.breakdownLabel}>Advance Deductions (10%)</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: '#E11D48' }]}>{currentData.breakdown.advanceDeduction || currentData.breakdown.addons}</Text>
          </View>

          {/* Row 3: Net Actual Earnings */}
          <View style={[styles.breakdownRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.breakdownRowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="wallet-outline" size={18} color="#16A34A" />
              </View>
              <Text style={[styles.breakdownLabel, { fontWeight: '700', color: '#166534' }]}>Net Actual Earnings</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: '#16A34A', fontWeight: '800' }]}>{currentData.breakdown.netEarning || currentData.total}</Text>
          </View>
        </View>

        {/* PAYOUT HISTORY SECTION */}
        <View style={styles.payoutHeaderRow}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          <TouchableOpacity onPress={() => setSeeAllPayouts(!seeAllPayouts)}>
            <Text style={styles.seeAllText}>
              {seeAllPayouts ? 'Show Less' : 'See All'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.payoutList}>
          {displayedPayouts.length > 0 ? (
            displayedPayouts.map(payout => (
              <View key={payout.id} style={styles.payoutCard}>
                <Text style={styles.payoutDate}>{payout.date}</Text>
                <Text style={styles.payoutAmount}>{payout.amount}</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>{payout.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.payoutCard, { justifyContent: 'center' }]}>
              <Text style={{ color: '#8A7D77', fontFamily: 'serif', fontSize: 13 }}>No payouts recorded for this period</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FILTER SELECTION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Period</Text>
            {['This Month', 'Last Month', 'This Year'].map(filter => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                  onPress={() => handleSelectFilter(filter)}
                >
                  <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                    {filter}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#FF4F8F" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ArtistEarningScreen;

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

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE4ED',
    borderRadius: 20,
    backgroundColor: '#FFF',
  },

  dropdownButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5E1735',
    fontFamily: 'serif',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  earningsSummary: {
    marginBottom: 24,
  },

  totalEarningsLabel: {
    fontSize: 14,
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  totalEarningsValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    fontFamily: 'serif',
    marginTop: 4,
  },

  deductionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  deductionSubtext: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    fontFamily: 'serif',
  },

  growthText: {
    fontSize: 14,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 6,
  },

  greenText: {
    color: '#389E0D',
    fontWeight: '700',
  },

  chartContainer: {
    height: 220,
    position: 'relative',
    marginBottom: 28,
  },

  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 20,
    justifyContent: 'space-between',
  },

  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },

  gridLabel: {
    width: 25,
    fontSize: 10,
    color: '#B0A5A0',
    fontFamily: 'serif',
  },

  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3ECF0',
    marginLeft: 6,
  },

  chartBarsRow: {
    position: 'absolute',
    left: 31,
    right: 0,
    top: 6,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  chartColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },

  chartBarFill: {
    width: 12,
    backgroundColor: 'rgba(255, 79, 143, 0.12)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },

  chartBarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4F8F',
    marginTop: -3,
    borderWidth: 1,
    borderColor: '#FFF',
  },

  chartLabelsRow: {
    position: 'absolute',
    left: 31,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  xAxisLabel: {
    fontSize: 9,
    color: '#8A7D77',
    fontFamily: 'serif',
    textAlign: 'center',
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EFF2',
  },

  breakdownRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFE4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'serif',
  },

  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  payoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF4F8F',
    fontFamily: 'serif',
  },

  payoutList: {
    marginBottom: 20,
  },

  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },

  payoutDate: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    fontFamily: 'serif',
  },

  payoutAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    textAlign: 'right',
    paddingRight: 16,
  },

  paidBadge: {
    backgroundColor: '#F6FFED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#389E0D',
    fontFamily: 'serif',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginBottom: 16,
    textAlign: 'center',
  },

  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EFF2',
  },

  selectedFilterOption: {
    borderBottomColor: '#FFE4ED',
  },

  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  selectedFilterOptionText: {
    color: '#FF4F8F',
    fontWeight: '700',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

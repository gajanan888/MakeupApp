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
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const FILTER_DATA = {
  'This Month': {
    total: '$4,680',
    growth: '+18.6% vs last month',
    chartPoints: [20, 32, 28, 44, 50, 42, 55, 68, 60, 65, 88, 92],
    chartLabels: ['1 May', '8 May', '15 May', '22 May', '31 May'],
    breakdown: {
      service: '$4,120',
      addons: '$360',
      tips: '$200',
    },
    payouts: [
      { id: 'p1', date: '08 May 2024', amount: '$2,350', status: 'Paid' },
      { id: 'p2', date: '24 Apr 2024', amount: '$1,980', status: 'Paid' },
      { id: 'p3', date: '10 Apr 2024', amount: '$1,770', status: 'Paid' },
    ],
  },
  'Last Month': {
    total: '$3,950',
    growth: '+12.4% vs prev month',
    chartPoints: [18, 25, 30, 28, 40, 48, 42, 52, 58, 52, 70, 78],
    chartLabels: ['1 Apr', '8 Apr', '15 Apr', '22 Apr', '30 Apr'],
    breakdown: {
      service: '$3,400',
      addons: '$350',
      tips: '$200',
    },
    payouts: [
      { id: 'p2', date: '24 Apr 2024', amount: '$1,980', status: 'Paid' },
      { id: 'p3', date: '10 Apr 2024', amount: '$1,770', status: 'Paid' },
      { id: 'p4', date: '26 Mar 2024', amount: '$2,100', status: 'Paid' },
    ],
  },
  'This Year': {
    total: '$54,200',
    growth: '+24.2% vs last year',
    chartPoints: [30, 42, 38, 55, 62, 58, 70, 78, 72, 85, 90, 95],
    chartLabels: ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'],
    breakdown: {
      service: '$48,000',
      addons: '$4,200',
      tips: '$2,000',
    },
    payouts: [
      { id: 'p1', date: '08 May 2024', amount: '$2,350', status: 'Paid' },
      { id: 'p2', date: '24 Apr 2024', amount: '$1,980', status: 'Paid' },
      { id: 'p3', date: '10 Apr 2024', amount: '$1,770', status: 'Paid' },
      { id: 'p4', date: '26 Mar 2024', amount: '$2,100', status: 'Paid' },
      { id: 'p5', date: '12 Mar 2024', amount: '$1,850', status: 'Paid' },
    ],
  },
};

const ArtistEarningScreen = () => {
  const [activeFilter, setActiveFilter] = useState('This Month');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [seeAllPayouts, setSeeAllPayouts] = useState(false);

  const currentData = FILTER_DATA[activeFilter];

  const handleSelectFilter = (filter) => {
    setActiveFilter(filter);
    setFilterModalVisible(false);
    setSeeAllPayouts(false); // Reset see all on filter change
  };

  const displayedPayouts = seeAllPayouts
    ? currentData.payouts
    : currentData.payouts.slice(0, 1);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="menu-outline" size={24} color="#111" />
        </TouchableOpacity>
        
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
      >
        {/* TOTAL EARNINGS */}
        <View style={styles.earningsSummary}>
          <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
          <Text style={styles.totalEarningsValue}>{currentData.total}</Text>
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
          {/* Row 1: Service Revenue */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownRowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="cut-outline" size={18} color="#FF4F8F" />
              </View>
              <Text style={styles.breakdownLabel}>Service Revenue</Text>
            </View>
            <Text style={styles.breakdownValue}>{currentData.breakdown.service}</Text>
          </View>

          {/* Row 2: Add-ons */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownRowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="sparkles-outline" size={18} color="#FF4F8F" />
              </View>
              <Text style={styles.breakdownLabel}>Add-ons</Text>
            </View>
            <Text style={styles.breakdownValue}>{currentData.breakdown.addons}</Text>
          </View>

          {/* Row 3: Tips */}
          <View style={[styles.breakdownRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.breakdownRowLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="gift-outline" size={18} color="#FF4F8F" />
              </View>
              <Text style={styles.breakdownLabel}>Tips</Text>
            </View>
            <Text style={styles.breakdownValue}>{currentData.breakdown.tips}</Text>
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
          {displayedPayouts.map(payout => (
            <View key={payout.id} style={styles.payoutCard}>
              <Text style={styles.payoutDate}>{payout.date}</Text>
              <Text style={styles.payoutAmount}>{payout.amount}</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>{payout.status}</Text>
              </View>
            </View>
          ))}
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
});

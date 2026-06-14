import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

const ArtistDashboardScreen = () => {
  const navigation = useNavigation();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="menu-outline" size={26} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Dashboard</Text>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#111" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* EARNINGS CARD */}
      <View style={styles.earningsCard}>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <TouchableOpacity style={styles.dropdownSelector}>
            <Text style={styles.dropdownText}>This Month</Text>
            <Ionicons name="chevron-down" size={12} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <Text style={styles.earningsAmount}>$4,680</Text>

        <Text style={styles.earningsTrend}>
          <Text style={styles.trendGreen}>+18.6% </Text>
          vs last month
        </Text>
      </View>

      {/* STATS GRID */}
      <View style={styles.statsGrid}>
        {/* Bookings */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bookings</Text>
          <Text style={styles.statValue}>28</Text>
          <Text style={styles.trendUp}>+12%</Text>
        </View>

        {/* Completed */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.trendUp}>+9%</Text>
        </View>

        {/* Cancelled */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cancelled</Text>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.trendDown}>-2%</Text>
        </View>

        {/* Reviews */}
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reviews</Text>
          <Text style={styles.statValue}>4.8</Text>
          <View style={styles.starsRow}>
            <Ionicons name="star" size={10} color="#CCCCCC" />
            <Ionicons name="star" size={10} color="#FFA000" style={{ marginLeft: 2 }} />
          </View>
        </View>
      </View>

      {/* UPCOMING BOOKING */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Booking</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bookingCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
          }}
          style={styles.clientAvatar}
        />

        <View style={styles.bookingDetails}>
          <View style={styles.clientNameRow}>
            <Text style={styles.clientName}>Sophia Laurent</Text>
            <Ionicons name="sparkles" size={12} color="#FFD700" style={{ marginLeft: 4 }} />
          </View>
          
          <Text style={styles.bookingCategory}>Bridal Makeup</Text>
          
          <View style={styles.bookingMetaRow}>
            <Ionicons name="calendar-outline" size={12} color="#777" />
            <Text style={styles.bookingMetaText}>16 May 2024 • 10:00 AM</Text>
          </View>

          <View style={styles.bookingMetaRow}>
            <Ionicons name="location-outline" size={12} color="#777" />
            <Text style={styles.bookingMetaText}>At Client Location</Text>
          </View>
        </View>

        <View style={styles.bookingBadgeContainer}>
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>Upcoming</Text>
          </View>
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.actionsRow}>
        {/* Action 1 */}
        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionCircle}>
            <Ionicons name="calendar-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>New Booking</Text>
        </TouchableOpacity>

        {/* Action 2 */}
        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionCircle}>
            <Ionicons name="time-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>My Calendar</Text>
        </TouchableOpacity>

        {/* Action 3 */}
        <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ArtistMessage')}>
          <View style={styles.actionCircle}>
            <Ionicons name="chatbubbles-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>Messages</Text>
        </TouchableOpacity>

        {/* Action 4 */}
        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionCircle}>
            <Ionicons name="megaphone-outline" size={22} color="#FF4F8F" />
          </View>
          <Text style={styles.actionLabel}>Promote</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 25,
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
    position: 'relative',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },

  earningsCard: {
    backgroundColor: '#531830',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: '#531830',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },

  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  earningsLabel: {
    fontSize: 14,
    color: '#FFC3D6',
    fontFamily: 'serif',
  },

  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  dropdownText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
    fontFamily: 'serif',
  },

  earningsAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'serif',
    marginTop: 10,
  },

  earningsTrend: {
    fontSize: 13,
    color: '#FFC3D6',
    fontFamily: 'serif',
    marginTop: 8,
  },

  trendGreen: {
    color: '#32C766',
    fontWeight: '700',
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
  },

  statCard: {
    width: '23%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  statLabel: {
    fontSize: 10,
    color: '#8A7D77',
    fontFamily: 'serif',
    textAlign: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginTop: 6,
    marginBottom: 4,
  },

  trendUp: {
    fontSize: 10,
    color: '#32C766',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  trendDown: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  seeAllText: {
    fontSize: 14,
    color: '#FF4F8F',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  clientAvatar: {
    width: 65,
    height: 75,
    borderRadius: 12,
    alignSelf: 'center',
  },

  bookingDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  bookingCategory: {
    fontSize: 12,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
    marginBottom: 6,
  },

  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  bookingMetaText: {
    fontSize: 11,
    color: '#555',
    marginLeft: 6,
    fontFamily: 'serif',
  },

  bookingBadgeContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  upcomingBadge: {
    backgroundColor: '#E6F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  upcomingBadgeText: {
    fontSize: 10,
    color: '#0958D9',
    fontWeight: '700',
    fontFamily: 'serif',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 20,
  },

  actionItem: {
    alignItems: 'center',
    width: '23%',
  },

  actionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE5EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  actionLabel: {
    fontSize: 11,
    color: '#111',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'serif',
  },
});

export default ArtistDashboardScreen;

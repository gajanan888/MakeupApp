import React, { useState } from 'react';
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

const BOOKINGS_DATA = [
  {
    id: '1',
    name: 'Sophia Laurent',
    category: 'Bridal Makeup',
    date: '16 May 2024 • 10:00 AM',
    location: 'At Client Location',
    price: '$320',
    status: 'Upcoming',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  },
  {
    id: '2',
    name: 'Anastasia Beverly',
    category: 'Party Makeup',
    date: '18 May 2024 • 02:00 PM',
    location: 'At Artist Studio',
    price: '$150',
    status: 'Upcoming',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
  },
  {
    id: '3',
    name: 'Mia Makeup',
    category: 'Photoshoot Makeup',
    date: '20 May 2024 • 11:00 AM',
    location: 'At Client Location',
    price: '$200',
    status: 'Upcoming',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
  },
  {
    id: '4',
    name: 'Daniela Rose',
    category: 'Engagement Makeup',
    date: '10 May 2024 • 04:00 PM',
    location: 'At Artist Studio',
    price: '$250',
    status: 'Completed',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200',
  },
];

const ArtistBookingScreen = ({ onBack }) => {
  const [activeSubTab, setActiveSubTab] = useState('Upcoming');

  const filteredBookings = BOOKINGS_DATA.filter(booking => booking.status === activeSubTab);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Upcoming':
        return {
          bg: '#E6F4FF',
          text: '#0958D9',
        };
      case 'Completed':
        return {
          bg: '#F6FFED',
          text: '#389E0D',
        };
      case 'Cancelled':
        return {
          bg: '#FFF1F0',
          text: '#CF1322',
        };
      default:
        return {
          bg: '#F5F5F5',
          text: '#555555',
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={24} color="#111" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Bookings</Text>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="time-outline" size={22} color="#5E1735" />
        </TouchableOpacity>
      </View>

      {/* SUB-TABS */}
      <View style={styles.tabsContainer}>
        {['Upcoming', 'Completed', 'Cancelled'].map(tab => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveSubTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BOOKINGS LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => {
            const badgeColors = getStatusStyle(booking.status);
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <Image
                  source={{ uri: booking.avatar }}
                  style={styles.clientAvatar}
                />

                <View style={styles.bookingDetails}>
                  <Text style={styles.clientName}>{booking.name}</Text>
                  <Text style={styles.bookingCategory}>{booking.category}</Text>
                  
                  <View style={styles.bookingMetaRow}>
                    <Ionicons name="calendar-outline" size={12} color="#777" />
                    <Text style={styles.bookingMetaText}>{booking.date}</Text>
                  </View>

                  <View style={styles.bookingMetaRow}>
                    <Ionicons name="location-outline" size={12} color="#777" />
                    <Text style={styles.bookingMetaText}>{booking.location}</Text>
                  </View>

                  <Text style={styles.bookingPrice}>{booking.price}</Text>
                </View>

                <View style={styles.bookingBadgeContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeColors.text }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={56} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No {activeSubTab} Bookings</Text>
            <Text style={styles.emptySubtitle}>You don't have any bookings listed as {activeSubTab.toLowerCase()} yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

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

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6EA',
    paddingHorizontal: 10,
    backgroundColor: '#FCFCFC',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  activeTabButton: {
    borderBottomColor: '#FF4F8F',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  activeTabText: {
    color: '#FF4F8F',
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 25,
  },

  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
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

  bookingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    marginTop: 6,
  },

  bookingBadgeContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'serif',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 15,
    fontFamily: 'serif',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#8A7D77',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'serif',
  },
});

export default ArtistBookingScreen;

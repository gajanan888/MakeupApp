import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'client_notifications';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'c1',
    title: 'Booking Confirmed!',
    message: 'Your booking with Priya Sharma for 12th July at 10:00 AM has been accepted.',
    type: 'booking',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 'c2',
    title: 'Payment Pending',
    message: 'Please complete the advance payment of ₹500 to secure your booking with Priya Sharma.',
    type: 'payment',
    time: '5 hours ago',
    read: false,
  },
  {
    id: 'c3',
    title: 'Exclusive Offer! 🎉',
    message: 'Get 20% off on airbrush makeup bookings this week. Use code GLAM20 at checkout.',
    type: 'promo',
    time: '1 day ago',
    read: true,
  },
  {
    id: 'c4',
    title: 'Profile Completed',
    message: 'Welcome to Glamour Booking! Your client profile has been updated successfully.',
    type: 'system',
    time: '2 days ago',
    read: true,
  },
];

const ClientNotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const persistNotifications = async (newList) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setNotifications(newList);
    } catch (error) {
      console.warn('Failed to save notifications:', error);
    }
  };

  const handleMarkAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    persistNotifications(updated);
  };

  const handleDelete = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    persistNotifications(updated);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => persistNotifications([]),
        },
      ]
    );
  };

  const getIconDetails = (type) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar-outline', color: '#FF4F87', bg: '#FFE6EF' };
      case 'payment':
        return { name: 'cash-outline', color: '#28A745', bg: '#E2F7E3' };
      case 'promo':
        return { name: 'sparkles-outline', color: '#FD7E14', bg: '#FFF3CD' };
      case 'system':
      default:
        return { name: 'settings-outline', color: '#007BFF', bg: '#E1E9FF' };
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIconDetails(item.type);
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleMarkAsRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.read && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={styles.messageText} numberOfLines={3}>
            {item.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerActionBtn}>
              <Text style={styles.headerActionText}>Mark read</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAll} style={[styles.headerActionBtn, { marginLeft: 16 }]}>
              <Text style={[styles.headerActionText, { color: '#FF3B30' }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F87" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={48} color="#FF4F87" />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            You do not have any notifications right now. We will let you know when something comes up.
          </Text>
          <TouchableOpacity
            style={styles.goHomeBtn}
            onPress={() => navigation.navigate('ClientHome')}
          >
            <Text style={styles.goHomeText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ClientNotificationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#FFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    paddingVertical: 4,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4F87',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    alignItems: 'center',
    position: 'relative',
  },
  unreadCard: {
    borderColor: '#FFD1DF',
    backgroundColor: '#FFF9FB',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    flex: 1,
    paddingRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#111',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  messageText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFE6EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  goHomeBtn: {
    backgroundColor: '#FF4F87',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 2,
  },
  goHomeText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

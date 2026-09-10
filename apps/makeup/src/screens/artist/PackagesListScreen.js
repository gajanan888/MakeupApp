import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import Icon from 'react-native-vector-icons/Feather';

const PackagesListScreen = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/packages/my-packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch packages', error);
      Alert.alert('Error', 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id) => {
    Alert.alert('Delete Package', 'Are you sure you want to delete this package?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/packages/${id}`);
            fetchPackages();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete package');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    // Extract unique brands
    const brands = [...new Set((item.products || []).map(p => p.brand?.name).filter(Boolean))];
    const brandsString = brands.length > 0 ? brands.join(' • ') : 'No specific brands';

    return (
      <View style={styles.packageCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packagePrice}>₹{item.price}</Text>
        </View>
        
        <View style={styles.badgeRow}>
          {item.occasion && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.occasion}</Text>
            </View>
          )}
          {item.packageLevel && (
            <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.badgeText, { color: '#1976D2' }]}>{item.packageLevel}</Text>
            </View>
          )}
        </View>

        <Text style={styles.packageDetailsText}>⏱ {item.duration}   |   {item.makeupLook || 'Custom Look'}</Text>
        <Text style={styles.brandsText}>Brands: {brandsString}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#4CAF50' : '#999' }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('PackageCreateEdit', { packageId: item.id })}>
            <Icon name="edit-2" size={16} color="#333" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('PackageCreateEdit', { packageId: item.id, duplicate: true })}>
            <Icon name="copy" size={16} color="#333" />
            <Text style={styles.actionText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => deletePackage(item.id)}>
            <Icon name="trash-2" size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF4F87" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Packages</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PackageCreateEdit')}>
          <Icon name="plus" size={24} color="#FF4F87" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={packages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No packages found. Create one to get started!</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  list: { padding: 16 },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  packageName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  packagePrice: { fontSize: 18, fontWeight: 'bold', color: '#FF4F87' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  badge: { backgroundColor: '#FCE4EC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 4 },
  badgeText: { fontSize: 12, color: '#FF4F87', fontWeight: '600' },
  packageDetailsText: { fontSize: 14, color: '#666', marginBottom: 4 },
  brandsText: { fontSize: 13, color: '#888', marginBottom: 12, fontStyle: 'italic' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 14, color: '#555', fontWeight: '500' },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  actionText: { marginLeft: 6, fontSize: 14, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
});

export default PackagesListScreen;

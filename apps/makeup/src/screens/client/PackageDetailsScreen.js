import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../api/client';

const PackageDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { packageId, artist } = route.params;

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      const response = await api.get(`/api/packages/${packageId}`);
      setPkg(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigation.navigate('SelectDateTime', {
      artist: pkg.artist || artist,
      selectedPackage: pkg,
    });
  };

  if (loading || !pkg) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4F87" />
      </View>
    );
  }

  // Get unique brands
  const brands = [];
  pkg.products?.forEach(p => {
    if (p.brand && !brands.includes(p.brand.name)) {
      brands.push(p.brand.name);
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Package Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Info */}
        <View style={styles.mainInfoCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{pkg.category}</Text>
          </View>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <Text style={styles.packagePrice}>₹{pkg.price}</Text>
          
          <View style={styles.metaRow}>
            <Icon name="clock" size={16} color="#666" />
            <Text style={styles.metaText}>{pkg.duration}</Text>
          </View>

          {pkg.description ? (
            <Text style={styles.description}>{pkg.description}</Text>
          ) : null}
        </View>

        {/* Brands Summary */}
        {brands.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brands Used</Text>
            <Text style={styles.brandsText}>{brands.join(', ')}</Text>
          </View>
        )}

        {/* Services Included */}
        {pkg.services && pkg.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Included Services</Text>
            {pkg.services.map(srv => (
              <View key={srv.id} style={styles.serviceRow}>
                <Icon name="check-circle" size={18} color="#FF4F87" />
                <Text style={styles.serviceText}>{srv.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Products Details */}
        {pkg.products && pkg.products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Products Included</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Category</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Brand</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Product</Text>
              </View>
              {pkg.products.map((prod, index) => (
                <View key={prod.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{prod.category}</Text>
                  <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>{prod.brand?.name}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={2}>
                    {prod.productName || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerPriceLabel}>Total Price</Text>
          <Text style={styles.footerPriceValue}>₹{pkg.price}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  mainInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryBadge: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: { color: '#FF4F87', fontWeight: 'bold', fontSize: 12 },
  packageName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  packagePrice: { fontSize: 28, fontWeight: 'bold', color: '#FF4F87', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  metaText: { fontSize: 14, color: '#666', marginLeft: 8 },
  description: { fontSize: 15, color: '#555', lineHeight: 22, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  brandsText: { fontSize: 15, color: '#555', lineHeight: 22 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  serviceText: { fontSize: 15, color: '#444', marginLeft: 12 },
  table: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  tableRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff' },
  tableRowAlt: { backgroundColor: '#F8F9FA' },
  tableCell: { fontSize: 13, color: '#555' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  footerPriceCol: { flex: 1, justifyContent: 'center' },
  footerPriceLabel: { fontSize: 13, color: '#666' },
  footerPriceValue: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  bookButton: {
    backgroundColor: '#FF4F87',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default PackageDetailsScreen;

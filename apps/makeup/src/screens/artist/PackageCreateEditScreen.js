import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/client';
import Icon from 'react-native-vector-icons/Feather';

const OCCASIONS = ['Party', 'Wedding Guest', 'Bridal', 'Engagement', 'Reception', 'Photoshoot', 'Festival', 'Corporate / Event', 'Casual / Everyday', 'Other'];
const PACKAGE_LEVELS = [
  { name: 'Basic', desc: 'Simple makeup using standard products' },
  { name: 'Standard', desc: 'Professional makeup with enhanced product quality' },
  { name: 'Premium', desc: 'High-end products and advanced makeup' },
  { name: 'Luxury', desc: 'Luxury products and premium services' },
  { name: 'Custom', desc: 'Artist-defined package' }
];
const MAKEUP_LOOKS = ['Natural', 'Nude', 'Soft Glam', 'Cocktail Glam', 'Traditional', 'Dewy', 'Matte', 'Smokey Eye', 'HD', 'Airbrush', 'Party Glam', 'Custom'];
const DURATIONS = ['1 Hour', '1.5 Hours', '2 Hours', '2.5 Hours', '3 Hours', '4 Hours', '5 Hours', 'Custom'];

const PackageCreateEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const packageId = route.params?.packageId;
  const duplicate = route.params?.duplicate || false;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [packageLevel, setPackageLevel] = useState('');
  const [makeupLook, setMakeupLook] = useState('');
  const [customMakeupLook, setCustomMakeupLook] = useState('');
  
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [description, setDescription] = useState('');
  
  const [allProducts, setAllProducts] = useState([]);
  const [allServices, setAllServices] = useState([]);
  
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);

  useEffect(() => {
    fetchMetadata();
    if (packageId) {
      fetchPackageDetails();
    }
  }, [packageId]);

  const fetchMetadata = async () => {
    try {
      const [prodRes, servRes] = await Promise.all([
        api.get('/api/packages/products'),
        api.get('/api/packages/services')
      ]);
      setAllProducts(prodRes.data || []);
      setAllServices(servRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/packages/${packageId}`);
      const pkg = res.data;
      
      setName(duplicate ? `${pkg.name} (Copy)` : pkg.name);
      
      if (OCCASIONS.includes(pkg.occasion)) {
        setOccasion(pkg.occasion);
      } else {
        setOccasion('Other');
        setCustomOccasion(pkg.occasion || '');
      }

      setPackageLevel(pkg.packageLevel || '');
      
      if (MAKEUP_LOOKS.includes(pkg.makeupLook)) {
        setMakeupLook(pkg.makeupLook);
      } else {
        setMakeupLook('Custom');
        setCustomMakeupLook(pkg.makeupLook || '');
      }

      setPrice(pkg.price ? pkg.price.toString() : '');
      
      if (DURATIONS.includes(pkg.duration)) {
        setDuration(pkg.duration);
      } else {
        setDuration('Custom');
        setCustomDuration(pkg.duration || '');
      }

      setDescription(pkg.description || '');
      setSelectedProductIds(pkg.products?.map(p => p.id) || []);
      setSelectedServiceIds(pkg.services?.map(s => s.id) || []);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch package details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const finalOccasion = occasion === 'Other' ? customOccasion : occasion;
    const finalLook = makeupLook === 'Custom' ? customMakeupLook : makeupLook;
    const finalDuration = duration === 'Custom' ? customDuration : duration;

    if (!name || !finalOccasion || !packageLevel || !finalLook || !price || !finalDuration) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    
    const payload = {
      name,
      occasion: finalOccasion,
      packageLevel,
      makeupLook: finalLook,
      price: parseFloat(price),
      duration: finalDuration,
      description,
      productIds: selectedProductIds,
      serviceIds: selectedServiceIds,
      addons: [] // Addons can be added here if needed
    };

    try {
      setSaving(true);
      if (packageId && !duplicate) {
        await api.put(`/api/packages/${packageId}`, payload);
      } else {
        await api.post('/api/packages', payload);
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleService = (id) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Group products by brand
  const productsByBrand = allProducts.reduce((acc, product) => {
    const brandName = product.brand?.name || 'OTHER BRANDS';
    if (!acc[brandName]) acc[brandName] = [];
    acc[brandName].push(product);
    return acc;
  }, {});

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FF4F87" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{duplicate ? 'Duplicate Package' : (packageId ? 'Edit Package' : 'Create Package')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* PACKAGE NAME */}
        <Text style={styles.label}>Package Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Premium Party Makeup" />

        {/* OCCASION */}
        <Text style={styles.label}>Select Occasion *</Text>
        <View style={styles.chipGrid}>
          {OCCASIONS.map(occ => (
            <TouchableOpacity 
              key={occ} 
              style={[styles.chip, occasion === occ && styles.chipActive]}
              onPress={() => setOccasion(occ)}
            >
              <Text style={[styles.chipText, occasion === occ && styles.chipTextActive]}>{occ}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {occasion === 'Other' && (
          <TextInput style={[styles.input, { marginTop: 8 }]} value={customOccasion} onChangeText={setCustomOccasion} placeholder="Enter custom occasion" />
        )}

        {/* PACKAGE LEVEL */}
        <Text style={styles.label}>Select Package Level *</Text>
        <View style={styles.levelList}>
          {PACKAGE_LEVELS.map(level => (
            <TouchableOpacity 
              key={level.name} 
              style={[styles.levelCard, packageLevel === level.name && styles.selectableCardActive]}
              onPress={() => setPackageLevel(level.name)}
            >
              <View style={styles.levelHeader}>
                <View style={[styles.radioCircle, packageLevel === level.name && styles.radioCircleActive]}>
                  {packageLevel === level.name && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.levelName, packageLevel === level.name && styles.levelNameActive]}>{level.name}</Text>
              </View>
              <Text style={styles.levelDesc}>{level.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MAKEUP LOOK */}
        <Text style={styles.label}>Select Makeup Look *</Text>
        <View style={styles.chipGrid}>
          {MAKEUP_LOOKS.map(look => (
            <TouchableOpacity 
              key={look} 
              style={[styles.chip, makeupLook === look && styles.chipActive]}
              onPress={() => setMakeupLook(look)}
            >
              <Text style={[styles.chipText, makeupLook === look && styles.chipTextActive]}>{look}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {makeupLook === 'Custom' && (
          <TextInput style={[styles.input, { marginTop: 8 }]} value={customMakeupLook} onChangeText={setCustomMakeupLook} placeholder="Enter custom look" />
        )}

        {/* PRODUCTS INCLUDED */}
        <Text style={styles.sectionTitle}>Products Included *</Text>
        <Text style={styles.subText}>Select products you use for this package. Brands will be displayed to the customer.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowProductsModal(true)}>
          <Icon name="plus" size={18} color="#FF4F87" />
          <Text style={styles.secondaryButtonText}>
            {selectedProductIds.length > 0 ? `Manage Products (${selectedProductIds.length} Selected)` : 'Add Products'}
          </Text>
        </TouchableOpacity>

        {/* SERVICES INCLUDED */}
        <Text style={styles.sectionTitle}>Services Included *</Text>
        <Text style={styles.subText}>Select exactly what is included in this package.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowServicesModal(true)}>
          <Icon name="plus" size={18} color="#FF4F87" />
          <Text style={styles.secondaryButtonText}>
            {selectedServiceIds.length > 0 ? `Manage Services (${selectedServiceIds.length} Selected)` : 'Add Services'}
          </Text>
        </TouchableOpacity>

        {/* DURATION */}
        <Text style={styles.label}>Duration *</Text>
        <View style={styles.chipGrid}>
          {DURATIONS.map(dur => (
            <TouchableOpacity 
              key={dur} 
              style={[styles.chip, duration === dur && styles.chipActive]}
              onPress={() => setDuration(dur)}
            >
              <Text style={[styles.chipText, duration === dur && styles.chipTextActive]}>{dur}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {duration === 'Custom' && (
          <TextInput style={[styles.input, { marginTop: 8 }]} value={customDuration} onChangeText={setCustomDuration} placeholder="e.g. 6 Hours" />
        )}

        {/* PRICE */}
        <Text style={styles.label}>Package Price (Per Person) *</Text>
        <View style={styles.priceInputWrapper}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput style={styles.priceInput} value={price} onChangeText={setPrice} placeholder="5000" keyboardType="numeric" />
        </View>

        {/* DESCRIPTION */}
        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Detailed package description..." 
          multiline 
        />

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Publish Package</Text>}
        </TouchableOpacity>
      </View>

      {/* PRODUCTS MODAL */}
      <Modal visible={showProductsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProductsModal(false)}>
            <Icon name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Products</Text>
          <TouchableOpacity onPress={() => setShowProductsModal(false)}>
            <Text style={{ color: '#FF4F87', fontWeight: 'bold' }}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {Object.keys(productsByBrand).sort().map(brand => (
            <View key={brand} style={styles.modalCategorySection}>
              <Text style={styles.modalCategoryTitle}>{brand.toUpperCase()}</Text>
              {productsByBrand[brand].map(product => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <TouchableOpacity 
                    key={product.id} 
                    style={styles.modalProductRow}
                    onPress={() => toggleProduct(product.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalProductName}>{product.productName || product.category}</Text>
                      <Text style={styles.modalProductBrand}>{product.category}</Text>
                    </View>
                    <Icon name={isSelected ? "check-circle" : "circle"} size={24} color={isSelected ? "#FF4F87" : "#ccc"} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Modal>

      {/* SERVICES MODAL */}
      <Modal visible={showServicesModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowServicesModal(false)}>
            <Icon name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Services</Text>
          <TouchableOpacity onPress={() => setShowServicesModal(false)}>
            <Text style={{ color: '#FF4F87', fontWeight: 'bold' }}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalCategorySection}>
            {allServices.map(service => {
              const isSelected = selectedServiceIds.includes(service.id);
              return (
                <TouchableOpacity 
                  key={service.id} 
                  style={styles.modalProductRow}
                  onPress={() => toggleService(service.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalProductName}>{service.name}</Text>
                  </View>
                  <Icon name={isSelected ? "check-circle" : "circle"} size={24} color={isSelected ? "#FF4F87" : "#ccc"} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Modal>

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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 16 },
  label: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#F1F5F9', marginRight: 10, marginBottom: 10 },
  chipActive: { backgroundColor: '#FF4F87' },
  chipText: { color: '#475569', fontWeight: '500', fontSize: 14 },
  chipTextActive: { color: '#fff' },

  levelList: { gap: 12 },
  levelCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioCircleActive: { borderColor: '#FF4F87' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4F87' },
  levelName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  levelNameActive: { color: '#FF4F87' },
  levelDesc: { fontSize: 14, color: '#64748B', marginLeft: 32 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 32, marginBottom: 8 },
  subText: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  selectableCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginRight: 10, marginBottom: 10 },
  selectableCardActive: { borderColor: '#FF4F87', backgroundColor: '#FFF0F5' },
  selectableText: { color: '#475569', fontWeight: '500' },
  selectableTextActive: { color: '#FF4F87', fontWeight: 'bold' },

  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F5', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#FFB8D2' },
  secondaryButtonText: { marginLeft: 8, color: '#FF4F87', fontSize: 16, fontWeight: 'bold' },

  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 14 },
  currencyPrefix: { fontSize: 18, color: '#64748B', fontWeight: '500', marginRight: 8 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 18, color: '#333' },

  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  saveButton: { backgroundColor: '#FF4F87', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalContent: { padding: 16 },
  modalCategorySection: { marginBottom: 24 },
  modalCategoryTitle: { fontSize: 14, fontWeight: 'bold', color: '#94A3B8', marginBottom: 12, letterSpacing: 1 },
  modalProductRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  modalProductBrand: { fontSize: 12, color: '#64748B', fontWeight: 'bold', marginBottom: 4 },
  modalProductName: { fontSize: 15, color: '#333', fontWeight: '500' }
});

export default PackageCreateEditScreen;

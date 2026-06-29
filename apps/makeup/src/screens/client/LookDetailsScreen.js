import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';

const DEFAULT_PRODUCTS = ['Lip Tint', 'Mascara', 'Base', 'Brush'];

const getLookImage = (lookId) => {
  switch (lookId) {
    case 'natural_glow':
    case 'natural-glow':
      return require('../../assets/images/model.jpeg');
    case 'soft_glam':
    case 'soft-glam':
      return require('../../assets/images/portfolio1.jpg');
    case 'bridal_radiance':
    case 'bridal-radiance':
      return require('../../assets/images/portfolio2.jpg');
    case 'full_glam':
    case 'full-glam':
      return require('../../assets/images/portfolio3.jpg');
    case 'party_makeup':
    case 'party-makeup':
      return require('../../assets/images/portfolio4.jpg');
    default:
      return require('../../assets/images/model.jpeg');
  }
};

const LookDetailsScreen = ({ navigation, route }) => {
  const { look, image, beauty_profile } = route?.params || {};

  const activeLook = useMemo(() => {
    return look || {
      id: 'soft-glam',
      name: 'Soft Glam',
      description: 'Enhances your natural features',
      time_estimate: '30-45 min',
      coverage: 'Medium Coverage',
      long_description: 'This look is perfect for parties and special occasions.',
      products: null,
    };
  }, [look]);

  const products = useMemo(() => {
    if (!activeLook.products) {
      return [
        { category: 'Lipstick', icon: '💄', value: 'Lip Tint' },
        { category: 'Eyeshadow', icon: '👁️', value: 'Mascara' },
        { category: 'Foundation', icon: '✨', value: 'Base' },
        { category: 'Blush', icon: '🌸', value: 'Brush' },
      ];
    }
    const { lipstick = [], blush = [], eyeshadow = [] } = activeLook.products;
    
    const combined = [
      ...lipstick.map(p => ({ category: 'Lipstick', icon: '💄', value: p })),
      ...blush.map(p => ({ category: 'Blush', icon: '🌸', value: p })),
      ...eyeshadow.map(p => ({ category: 'Eyeshadow', icon: '👁️', value: p })),
    ];
    
    // Add foundation if personalized recommendations exists
    if (activeLook.personalized_recommendations?.foundation_shade) {
      combined.push({
        category: 'Foundation',
        icon: '✨',
        value: activeLook.personalized_recommendations.foundation_shade.split('(')[0].trim(),
      });
    }
    
    return combined.length > 0 ? combined : [
      { category: 'Lipstick', icon: '💄', value: 'Lip Tint' },
      { category: 'Eyeshadow', icon: '👁️', value: 'Mascara' },
      { category: 'Foundation', icon: '✨', value: 'Base' },
      { category: 'Blush', icon: '🌸', value: 'Brush' },
    ];
  }, [activeLook]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader title="Look Details" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
          <View style={styles.topRow}>
            <Image source={getLookImage(activeLook.id)} style={styles.heroImage} />

            <View style={styles.topInfo}>
              <Text style={styles.lookTitle}>{activeLook.name}</Text>
              <Text style={styles.lookSubtitle}>{activeLook.description}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{activeLook.time_estimate || '30-45 min'}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{activeLook.coverage || 'Medium Coverage'}</Text>
              </View>

              <Text style={styles.detailText}>
                {activeLook.long_description || activeLook.description}
              </Text>
            </View>
          </View>

          {activeLook.personalized_recommendations && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Personalized Shades & Styles</Text>
              <View style={styles.personalizedCard}>
                <Text style={styles.personalTitle}>
                  🎨 Color Season:{' '}
                  <Text style={styles.personalValue}>
                    {activeLook.personalized_recommendations.seasonal_profile}
                  </Text>
                </Text>
                <View style={styles.divider} />
                <View style={styles.personalGrid}>
                  <Text style={styles.gridItem}>
                    💄 Lipstick:{' '}
                    <Text style={styles.gridValue}>
                      {activeLook.personalized_recommendations.lipstick_color}
                    </Text>
                  </Text>
                  <Text style={styles.gridItem}>
                    ✨ Foundation:{' '}
                    <Text style={styles.gridValue}>
                      {activeLook.personalized_recommendations.foundation_shade}
                    </Text>
                  </Text>
                  <Text style={styles.gridItem}>
                    🌸 Blush:{' '}
                    <Text style={styles.gridValue}>
                      {activeLook.personalized_recommendations.blush_color}
                    </Text>
                  </Text>
                  <Text style={styles.gridItem}>
                    👁️ Eyeshadow:{' '}
                    <Text style={styles.gridValue}>
                      {activeLook.personalized_recommendations.eyeshadow_color}
                    </Text>
                  </Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.personalTitle}>📐 Facial Geometry Correction</Text>
                <Text style={styles.guidelineText}>
                  • Brow Shape:{' '}
                  <Text style={styles.gridValue}>
                    {activeLook.personalized_recommendations.eyebrow_shape}
                  </Text>
                </Text>
                <Text style={styles.guidelineText}>
                  • Contour Placing:{' '}
                  <Text style={styles.gridValue}>
                    {activeLook.personalized_recommendations.contour_style}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Products</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {products.map((product, index) => (
                <View key={`${product.value}-${index}`} style={styles.productCard}>
                  <View style={styles.productIconCircle}>
                    <Text style={{ fontSize: 16 }}>{product.icon}</Text>
                  </View>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productShade} numberOfLines={2}>{product.value}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('TryThisLook', { look: activeLook, image })}
            >
              <Text style={styles.primaryButtonText}>View AI Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() =>
                navigation.navigate('BookLookArtist', { look: activeLook, beauty_profile })
              }
            >
              <Text style={styles.secondaryButtonText}>Book This Look</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

export default LookDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroImage: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F4F4F4',
  },
  topInfo: {
    flex: 1,
    paddingTop: 2,
  },
  lookTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  lookSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#7A7A7A',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#8C6F7A',
    fontWeight: '700',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#D38BA5',
    fontWeight: '900',
  },
  detailText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#6E6E6E',
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  personalizedCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  personalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF4F87',
    marginBottom: 8,
  },
  personalValue: {
    color: '#333',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE0EC',
    marginVertical: 10,
  },
  personalGrid: {
    gap: 8,
  },
  gridItem: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  gridValue: {
    color: '#222',
    fontWeight: '800',
  },
  guidelineText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#555',
    marginTop: 4,
    fontWeight: '600',
  },
  productRow: {
    gap: 10,
    paddingBottom: 6,
  },
  productCard: {
    width: 84,
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFE0EC',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  productCategory: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#8A5D6D',
    textTransform: 'uppercase',
  },
  productShade: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4F87',
    marginTop: 2,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF4F87',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#FF4F87',
    fontSize: 14,
    fontWeight: '800',
  },
});

import React from 'react';
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

const LookDetailsScreen = ({ navigation, route }) => {
  const look = route?.params?.look || {
    title: 'Soft Glam',
    description: 'Enhances your natural features',
    image: require('../../assets/images/model.jpeg'),
    products: DEFAULT_PRODUCTS,
  };

  const products = look.products || DEFAULT_PRODUCTS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader title="Look Details" onBack={() => navigation.goBack()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.topRow}>
            <Image source={look.image} style={styles.heroImage} />

            <View style={styles.topInfo}>
              <Text style={styles.lookTitle}>{look.title}</Text>
              <Text style={styles.lookSubtitle}>{look.description}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>30-45 min</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>Medium Coverage</Text>
              </View>

              <Text style={styles.detailText}>
                This look is perfect for parties and special occasions. It
                enhances your natural beauty.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Products</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {products.map((product, index) => (
                <View key={`${product}-${index}`} style={styles.productCard}>
                  <View style={styles.productPill} />
                  <Text style={styles.productText}>{product}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.navigate('TryThisLook', { look })}
            >
              <Text style={styles.primaryButtonText}>Try This Look</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('BookLookArtist', { look })}
            >
              <Text style={styles.secondaryButtonText}>Book This Look</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LookDetailsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: {
    flex: 1,
    margin: 10,
    borderRadius: 28,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    overflow: 'hidden',
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
  productRow: {
    gap: 10,
  },
  productCard: {
    width: 74,
    alignItems: 'center',
  },
  productPill: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F8E4EB',
    borderWidth: 1,
    borderColor: '#F0CBD9',
  },
  productText: {
    marginTop: 6,
    fontSize: 10,
    color: '#7A7A7A',
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

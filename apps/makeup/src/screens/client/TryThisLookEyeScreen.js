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

const RECOMMENDED_PRODUCTS = ['Palette', 'Mascara', 'Liner', 'Brush'];

const TryThisLookEyeScreen = ({ navigation, route }) => {
  const look = route?.params?.look;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Step 2/3 - Eye Makeup"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Apply eye makeup as shown</Text>

          <Image
            source={look?.image || require('../../assets/images/model.jpeg')}
            style={styles.eyeImage}
          />

          <Text style={styles.sectionTitle}>Recommended Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.productRow}>
              {RECOMMENDED_PRODUCTS.map(item => (
                <View key={item} style={styles.productCard}>
                  <View style={styles.productPill} />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('TryThisLookFinal', { look })}
            >
              <Text style={styles.primaryText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TryThisLookEyeScreen;

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
  subtitle: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 10,
  },
  eyeImage: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    gap: 10,
  },
  productCard: {
    width: 58,
    alignItems: 'center',
  },
  productPill: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F8E4EB',
    borderWidth: 1,
    borderColor: '#F0CBD9',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  button: {
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
  primaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryText: {
    color: '#FF4F87',
    fontSize: 14,
    fontWeight: '800',
  },
});

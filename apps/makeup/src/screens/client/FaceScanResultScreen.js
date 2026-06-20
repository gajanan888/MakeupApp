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
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';

const FEATURE_ROWS = [
  { label: 'Forehead', value: 'Balanced' },
  { label: 'Cheekbones', value: 'Defined' },
  { label: 'Jawline', value: 'Soft' },
  { label: 'Face Symmetry', value: 'High' },
];

const SKIN_SWATCHES = ['#E8C6AE', '#DDB38F', '#C78E69', '#B97A53', '#A6633E'];

const FaceScanResultScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Analysis Result"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <View style={styles.heroCard}>
            <Image
              source={require('../../assets/images/model.jpeg')}
              style={styles.heroImage}
              resizeMode="cover"
            />

            <View style={styles.overlayRing} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Face Shape</Text>
            <View style={styles.shapeCard}>
              <View style={styles.shapeIconWrap}>
                <View style={styles.shapeIconCircle}>
                  <Ionicons name="person" size={16} color="#C88A9D" />
                </View>
              </View>
              <Text style={styles.shapeValue}>Oval</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Skin Tone</Text>
            <View style={styles.skinCard}>
              <Text style={styles.skinText}>Medium Warm</Text>
              <View style={styles.swatchRow}>
                {SKIN_SWATCHES.map(color => (
                  <View
                    key={color}
                    style={[styles.swatch, { backgroundColor: color }]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Features</Text>
            <View style={styles.featuresCard}>
              {FEATURE_ROWS.map(item => (
                <View key={item.label} style={styles.featureRow}>
                  <Text style={styles.featureName}>{item.label}</Text>
                  <Text style={styles.featureValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FaceScanRecommendations')}
          >
            <Text style={styles.buttonText}>View Recommended Looks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanResultScreen;

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
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  heroCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 288,
    height: 132,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
    position: 'relative',
    marginBottom: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlayRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  shapeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
  },
  shapeIconWrap: {
    marginRight: 10,
  },
  shapeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  skinCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
  },
  skinText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  featuresCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  featureName: {
    fontSize: 12,
    color: '#575757',
    fontWeight: '600',
  },
  featureValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '700',
  },
  button: {
    marginTop: 'auto',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

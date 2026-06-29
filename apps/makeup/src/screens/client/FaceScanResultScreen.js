import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { refineRecommendations } from '../../api/aiClient';

const SKIN_TONES = [
  { name: 'Fair', color: '#FCE5D6' },
  { name: 'Light', color: '#E8C6AE' },
  { name: 'Medium', color: '#DDB38F' },
  { name: 'Tan', color: '#C78E69' },
  { name: 'Deep', color: '#A6633E' },
];

const UNDERTONES = ['Warm', 'Cool', 'Neutral', 'Olive'];

const FACE_SHAPES = ['Oval', 'Round', 'Square', 'Rectangle', 'Heart', 'Diamond'];

const FaceScanResultScreen = ({ navigation, route }) => {
  const { beauty_profile, recommended_looks, image } = route?.params || {};

  const [beautyProfile, setBeautyProfile] = useState(beauty_profile);
  const [recommendedLooks, setRecommendedLooks] = useState(recommended_looks || []);
  const [loading, setLoading] = useState(false);

  const forehead = beautyProfile?.features?.forehead || 'Balanced';
  const cheekbones = beautyProfile?.features?.cheekbones || 'Defined';
  const jawline = beautyProfile?.features?.jawline || 'Soft';
  const symmetry = beautyProfile?.features?.symmetry || 'High';

  const featureRows = [
    { label: 'Forehead', value: forehead },
    { label: 'Cheekbones', value: cheekbones },
    { label: 'Jawline', value: jawline },
    { label: 'Face Symmetry', value: symmetry },
  ];

  const handleRefine = async (newShape, newSkinTone, newUndertone) => {
    try {
      setLoading(true);
      const shape = newShape || beautyProfile?.face_shape || 'Oval';
      const tone = newSkinTone || beautyProfile?.skin_tone || 'Medium';
      const under = newUndertone || beautyProfile?.undertone || 'Neutral';

      console.log('[RefineResult] Requesting look update for:', shape, tone, under);

      // Call the refinement endpoint on the backend
      const result = await refineRecommendations(shape, tone, under, null, null);

      if (result && result.beauty_profile) {
        setBeautyProfile(result.beauty_profile);
        setRecommendedLooks(result.recommended_looks || []);
      }
    } catch (err) {
      console.error('[RefineResult] Refinement failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader
        title="Analysis Result"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <Image
                source={image ? { uri: image.uri } : require('../../assets/images/model.jpeg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.overlayRing} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FF4F87" />
                  <Text style={styles.loadingText}>Updating looks...</Text>
                </View>
              )}
            </View>

            {/* Face Shape Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Face Shape (Tap to correct)</Text>
              <View style={styles.selectorContainer}>
                {FACE_SHAPES.map(shape => {
                  const isActive = beautyProfile?.face_shape?.toLowerCase() === shape.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={shape}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => handleRefine(shape, null, null)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {shape}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Skin Tone & Undertone Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Skin Tone & Undertone (Tap to correct)</Text>
              <View style={styles.skinCard}>
                <Text style={styles.skinText}>
                  {beautyProfile?.skin_tone} ({beautyProfile?.undertone} Undertone)
                </Text>
                
                {/* Tone Swatches */}
                <View style={styles.swatchRow}>
                  {SKIN_TONES.map(item => {
                    const isMatched = beautyProfile?.skin_tone?.toLowerCase() === item.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={item.name}
                        activeOpacity={0.8}
                        style={[
                          styles.swatch,
                          { backgroundColor: item.color },
                          isMatched && styles.swatchMatched,
                        ]}
                        onPress={() => handleRefine(null, item.name, null)}
                      >
                        {isMatched && (
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Undertone Chips */}
                <View style={styles.undertoneRow}>
                  {UNDERTONES.map(under => {
                    const isActive = beautyProfile?.undertone?.toLowerCase() === under.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={under}
                        style={[styles.underChip, isActive && styles.underChipActive]}
                        onPress={() => handleRefine(null, null, under)}
                      >
                        <Text style={[styles.underChipText, isActive && styles.underChipTextActive]}>
                          {under}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Features Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Facial Structure Analysis</Text>
              <View style={styles.featuresCard}>
                {featureRows.map(item => (
                  <View key={item.label} style={styles.featureRow}>
                    <Text style={styles.featureName}>{item.label}</Text>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('FaceScanRecommendations', {
                beauty_profile: beautyProfile,
                recommended_looks: recommendedLooks,
                image,
              })
            }
          >
            <Text style={styles.buttonText}>Choose Your Personalized Look ✨</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

export default FaceScanResultScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  scrollArea: {
    flex: 1,
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  heroCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 288,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
    position: 'relative',
    marginBottom: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlayRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#FF4F87',
  },
  section: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },
  selectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFE0EC',
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CC5577',
  },
  chipTextActive: {
    color: '#FFF',
  },
  skinCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  skinText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 10,
    fontWeight: '800',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  swatchMatched: {
    borderWidth: 2.5,
    borderColor: '#FF4F87',
    transform: [{ scale: 1.15 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  undertoneRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#FFE4EF',
    paddingTop: 10,
  },
  underChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0EC',
    backgroundColor: '#FFF',
  },
  underChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  underChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CC5577',
  },
  underChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  featuresCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureName: {
    fontSize: 12,
    color: '#575757',
    fontWeight: '600',
  },
  featureBadge: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  featureBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4F87',
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

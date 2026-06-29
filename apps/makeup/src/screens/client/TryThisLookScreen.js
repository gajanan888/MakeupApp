import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';

const SIMPLIFIED_MAP = {
  // Seasons
  'Spring (Warm & Light)': 'Warm & Bright Colors',
  'Autumn (Warm & Rich)': 'Warm & Earthy Colors',
  'Summer (Cool & Soft)': 'Cool & Soft Colors',
  'Winter (Cool & Bright)': 'Cool & Vibrant Colors',
  'Neutral Light (Versatile & Soft)': 'Soft Neutral Colors',
  'Neutral Deep (Versatile & Rich)': 'Rich Neutral Colors',

  // Foundation
  'Porcelain Warm / Warm Ivory': 'Warm Ivory',
  'Rose Alabaster / Cool Ivory': 'Cool Ivory',
  'Golden Beige / Honey': 'Golden Honey',
  'Amber Caramel': 'Warm Caramel',
  'Chestnut Bronze': 'Bronze',
  'Golden Warm Beige': 'Warm Beige',
  'Neutral Sand': 'Soft Sand',
  'Rich Almond': 'Almond',
  'Rich Espresso / Cocoa': 'Espresso / Cocoa',
  'Neutral Espresso': 'Neutral Espresso',
  'Porcelain': 'Fair Porcelain',
  'Neutral Ivory': 'Light Ivory',
  'Natural Beige': 'Natural Beige',
  'Honey Tan': 'Honey Tan',
  'Rich Cocoa': 'Dark Cocoa',

  // Lipsticks
  'Bright Coral Red': 'Coral Red',
  'Warm Peach Rose': 'Peach Pink',
  'Peach Nude': 'Light Peach',
  'Warm Terracotta / Brick Red': 'Terracotta Red',
  'Spiced Cinnamon / Nutmeg': 'Cinnamon',
  'Warm Caramel Nude': 'Caramel Nude',
  'Vibrant Rosewood': 'Deep Rose',
  'Soft Dusty Mauve': 'Soft Mauve',
  'Cool Pink Nude': 'Soft Pink',
  'True Cherry Red / Deep Plum': 'Cherry Red',
  'Soft Cranberry / Crimson': 'Cranberry Red',
  'Berry Nude': 'Berry Pink',
  'Dusty Mauve / Plum': 'Dusty Plum',
  'Rosewood / Tea Rose': 'Tea Rose',
  'Dusty Rose': 'Dusty Rose',

  // Blush
  'Bright Coral': 'Peach Coral',
  'Soft Pink': 'Soft Pink',
  'Warm Apricot': 'Warm Peach',
  'Terracotta': 'Warm Earthy Orange',
  'Coral Pink': 'Warm Coral Pink',
  'Deep Peach': 'Deep Peach',
  'Rose-Pink': 'Rose Pink',
  'Soft Pastel Pink': 'Pastel Pink',
  'Plum Berry': 'Plum Berry',
  'Rose': 'Soft Rose',
  'Cool Rose': 'Cool Rose',

  // Eyeshadow
  'Gold & Bronze': 'Gold & Bronze shimmer',
  'Champagne Shimmer & Gold': 'Champagne & Gold shimmer',
  'Soft Peach & Champagne': 'Peach & Champagne matte',
  'Rich Copper, Gold & Warm Earthy Brown': 'Copper & Earthy Brown',
  'Soft Brown & Champagne': 'Brown & Champagne',
  'Cool Slate Gray & Silver': 'Slate Gray & Silver',
  'Taupe & Rose Gold': 'Taupe & Rose Gold',
  'Taupe & Soft Pink': 'Taupe & Soft Pink',
  'Icy Pearl, Charcoal & High-Shine Metallic Silver': 'Pearl & Silver',
  'Soft Slate & Champagne': 'Slate & Champagne',
  'Gold & Smokey Bronze': 'Gold & Smokey Bronze',
  'Champagne Shimmer & Rose Gold': 'Champagne & Rose Gold',
};

const getSimpleDescription = (type, value) => {
  if (!value) return 'Natural';
  
  const valTrim = value.trim();
  if (SIMPLIFIED_MAP[valTrim]) {
    return SIMPLIFIED_MAP[valTrim];
  }
  
  // Clean up parenthesis and trailing dots
  let text = value.split('(')[0].trim().replace(/[.,;]$/, '');
  
  // Simplify long slash options (e.g. "Porcelain Warm / Warm Ivory" -> "Warm Ivory")
  if (text.includes('/')) {
    const parts = text.split('/');
    // pick the friendlier/shorter one
    text = parts[1] ? parts[1].trim() : parts[0].trim();
  }
  
  if (type === 'contour') {
    const valLower = value.toLowerCase();
    if (valLower.includes('jawline') || valLower.includes('jaw')) {
      return 'Jawline & Cheek contour';
    }
    if (valLower.includes('temples')) {
      return 'Soften temple & jaw angles';
    }
    if (valLower.includes('hairline')) {
      return 'Hairline & Chin shading';
    }
    if (valLower.includes('cheekbones') || valLower.includes('cheekbone')) {
      return 'Cheekbone definition';
    }
    return 'Subtle face definition';
  }
  
  if (type === 'eyebrow') {
    const valLower = value.toLowerCase();
    if (valLower.includes('high arch') || valLower.includes('high arched')) {
      return 'High Arched Brows';
    }
    if (valLower.includes('flat') || valLower.includes('horizontal')) {
      return 'Soft Flat Brows';
    }
    if (valLower.includes('soft') || valLower.includes('curved')) {
      return 'Natural Curved Brows';
    }
    return text;
  }

  // Strip complex descriptors
  text = text.replace(/Rich\s+/gi, '');
  text = text.replace(/High-Shine\s+/gi, '');
  text = text.replace(/Metallic\s+/gi, '');
  text = text.replace(/Shimmering\s+/gi, '');
  
  return text;
};

const getSimpleExplanation = (rec, profile) => {
  const shape = profile?.face_shape || 'Oval';
  const undertone = profile?.undertone || 'Neutral';
  
  let explanation = [];
  
  // 1. Theme/Tone
  if (undertone.toLowerCase() === 'warm') {
    explanation.push("🌟 Your skin has a warm glow. Cozy colors like peach, gold, and terracotta look best on you.");
  } else if (undertone.toLowerCase() === 'cool') {
    explanation.push("🌟 Your skin has a cool undertone. Rosy pinks, berry shades, and silver tones will suit you beautifully.");
  } else {
    explanation.push("🌟 Your skin has neutral tones, so you look great in both warm and cool shades!");
  }
  
  // 2. Foundation/Complexion
  const found = getSimpleDescription('general', rec?.foundation_shade || 'Natural Beige');
  explanation.push(`✨ Foundation: A ${found} base shade matches your skin tone perfectly.`);
  
  // 3. Colors (Lip & Blush & Eyes)
  const lip = getSimpleDescription('general', rec?.lipstick_color || 'Dusty Rose');
  const blush = getSimpleDescription('general', rec?.blush_color || 'Peach Pink');
  const eye = getSimpleDescription('general', rec?.eyeshadow_color || 'Soft Brown');
  
  explanation.push(`💄 Colors: Pair a soft ${lip} lipstick with ${blush} blush on cheeks, and ${eye} eyeshadow on eyes.`);
  
  // 4. Face Shaping (Contour & Brows)
  const shapeLower = shape.toLowerCase();
  let contourTip = "Contour lightly under cheekbones to define them.";
  if (shapeLower === 'round') {
    contourTip = "Contour your jawline and under cheekbones to slim the face.";
  } else if (shapeLower === 'square') {
    contourTip = "Contour the corners of your forehead and jaw to soften square angles.";
  } else if (shapeLower === 'rectangle') {
    contourTip = "Contour along the upper hairline and chin to balance the face length.";
  } else if (shapeLower === 'heart') {
    contourTip = "Contour the sides of your forehead to balance the chin.";
  } else if (shapeLower === 'diamond') {
    contourTip = "Contour outer cheekbones to soften the widest parts of the face.";
  }
  
  explanation.push(`📐 Contouring: Since you have a ${shape} face, ${contourTip}`);
  
  const browShapeText = getSimpleDescription('eyebrow', rec?.eyebrow_shape);
  explanation.push(`👁️ Eyebrows: Draw a ${browShapeText} to complement your features.`);
  
  return explanation;
};

const TryThisLookScreen = ({ navigation, route }) => {
  const { look, beauty_profile } = route?.params || {};

  const rec = look?.personalized_recommendations || {};

  // Combine all recommended products for the complete look with full categorizations
  const recommendedProducts = [
    ...(look?.products?.lipstick || []).map(p => ({ category: 'Lipstick', icon: '💄', value: p })),
    ...(look?.products?.blush || []).map(p => ({ category: 'Blush', icon: '🌸', value: p })),
    ...(look?.products?.eyeshadow || []).map(p => ({ category: 'Eyeshadow', icon: '👁️', value: p })),
    ...(rec?.foundation_shade ? [{ category: 'Foundation', icon: '✨', value: getSimpleDescription('general', rec.foundation_shade) }] : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader
        title="Your AI Prescription"
        onBack={() => navigation.goBack()}
      />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.prescriptionContainer}>
            <Text style={styles.lookTitle}>{look?.name || 'Personalized Look'}</Text>
            <Text style={styles.lookCategory}>
              Category: {look?.category || 'Custom'} • {look?.time_estimate || '20 min'}
            </Text>
            
            <Text style={styles.introText}>
              Based on your detected <Text style={styles.boldText}>{beauty_profile?.face_shape || 'Heart'}</Text> face shape and <Text style={styles.boldText}>{beauty_profile?.skin_tone || 'Fair'}</Text> skin tone, AI has formulated this custom prescription:
            </Text>

            <View style={styles.prescriptionCard}>
              <Text style={styles.seasonTitle}>🎨 Seasonal Color: {getSimpleDescription('general', rec.seasonal_profile || 'Warm Autumn')}</Text>
              <View style={styles.divider} />

              {/* Complexion */}
              <Text style={styles.recSectionHeader}>✨ Complexion Base</Text>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Foundation Shade</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.foundation_shade || 'Natural Beige')}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Concealer Shade</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>
                    {rec.foundation_shade ? `${getSimpleDescription('general', rec.foundation_shade)} / 1 shade lighter` : 'Match base'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Color Elements */}
              <Text style={styles.recSectionHeader}>💄 Color Accents</Text>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Lipstick Shade</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.lipstick_color || 'Dusty Rose')}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Blush Color</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.blush_color || 'Peach Pink')}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Eyeshadow Palette</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.eyeshadow_color || 'Warm Gold/Taupe')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Sculpting & Framing */}
              <Text style={styles.recSectionHeader}>📐 Sculpting & Framing</Text>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Contour Style</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('contour', rec.contour_style)}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Contour Intensity</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.contour_intensity || 'Medium')}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Highlight Style</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('general', rec.highlight_style || 'Champagne Glow')}</Text>
                </View>
              </View>
              <View style={styles.recRow}>
                <Text style={styles.recLabel}>Eyebrow Shape</Text>
                <View style={styles.valueBadge}>
                  <Text style={styles.valueBadgeText}>{getSimpleDescription('eyebrow', rec.eyebrow_shape)}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              <Text style={styles.recSectionHeader}>💡 Simply Explained</Text>
              {getSimpleExplanation(rec, beauty_profile).map((line, idx) => (
                <Text key={idx} style={styles.simpleExplanationText}>
                  {line}
                </Text>
              ))}
            </View>

            {/* Recommended Products List */}
            {recommendedProducts.length > 0 && (
              <View style={{ width: '100%', marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Recommended Products</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScrollView}>
                  <View style={styles.productRow}>
                    {recommendedProducts.map((item, index) => (
                      <View key={`${item.value}-${index}`} style={styles.productCard}>
                        <View style={styles.productIconCircle}>
                          <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                        </View>
                        <Text style={styles.productCategory}>{item.category}</Text>
                        <Text style={styles.productShade} numberOfLines={2}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Primary Action Button: Book Artist */}
            <TouchableOpacity
              style={styles.launchButton}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('BookLookArtist', { look, beauty_profile })}
            >
              <Text style={styles.launchButtonText}>📅 Book Makeup Artist</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

export default TryThisLookScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0EC',
    backgroundColor: '#FFF5F8',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFF',
    borderBottomWidth: 3,
    borderBottomColor: '#FF4F87',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A5D6D',
  },
  tabButtonTextActive: {
    color: '#FF4F87',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 26,
    alignItems: 'center',
  },
  lookTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  lookCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  prescriptionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  simulationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  introText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#FF4F87',
  },
  prescriptionCard: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF8FA',
    borderWidth: 1.5,
    borderColor: '#FFE4EF',
    marginTop: 6,
    marginBottom: 20,
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF4F87',
    textAlign: 'center',
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE4EF',
    marginVertical: 12,
  },
  recSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  valueBadge: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0EC',
    maxWidth: '70%',
  },
  valueBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FF4F87',
  },
  launchButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  launchButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  imageContainer: {
    width: '100%',
    height: 350,
    borderRadius: 18,
    backgroundColor: '#FFF5F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE0EC',
    marginTop: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  loadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 18,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  productScrollView: {
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  productCard: {
    width: 90,
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFE0EC',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 1,
  },
  productIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  productCategory: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8A5D6D',
    textTransform: 'uppercase',
  },
  productShade: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF4F87',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
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
    fontSize: 13,
    fontWeight: '800',
  },
  simpleExplanationText: {
    fontSize: 12.5,
    color: '#4A4A4A',
    lineHeight: 18,
    marginVertical: 4,
    fontWeight: '500',
  },
});


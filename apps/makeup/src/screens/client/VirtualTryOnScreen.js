import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  TextInput,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ScreenHeader from '../../components/ScreenHeader';
import { applyVirtualTryon, recommendLooks } from '../../api/aiClient';

const LIPSTICK_COLORS = ['Red', 'Pink', 'Nude', 'Brown', 'Wine', 'Coral', 'Peach', 'Maroon', 'Custom'];
const LIPSTICK_STYLES = ['Matte', 'Gloss', 'Cream'];
const FOUNDATION_SHADES = ['Alabaster', 'Ivory', 'Natural', 'Warm Beige', 'Sand', 'Honey', 'Espresso'];
const BLUSH_STYLES = ['Soft', 'Medium', 'Heavy'];
const EYESHADOW_COLORS = ['Pink', 'Peach', 'Purple', 'Brown', 'Gold'];
const EYESHADOW_STYLES = ['Matte', 'Shimmer', 'Smokey'];
const EYELINER_STYLES = ['Thin', 'Medium', 'Winged'];
const EYEBROW_COLORS = ['Brown', 'Black', 'Dark Brown'];

const PRESET_CUSTOM_COLORS = [
  { name: 'Mauve', hex: '#C38B9B' },
  { name: 'Berry', hex: '#8B008B' },
  { name: 'Cherry', hex: '#DE3163' },
  { name: 'Dusty Rose', hex: '#C98C8C' },
  { name: 'Bronze', hex: '#CD7F32' },
  { name: 'Magenta', hex: '#FF007F' },
  { name: 'Brick', hex: '#B22222' }
];

const LOOK_CATEGORIES = ['Bridal', 'Glam', 'Natural', 'Party', 'Minimal', 'Creative'];
const INTENSITY_LEVELS = [20, 40, 60, 80, 100];

const VirtualTryOnScreen = ({ navigation }) => {
  const [originalImage, setOriginalImage] = useState(null); // picked image asset
  const [processedImage, setProcessedImage] = useState(null); // base64 string from API
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false); // Before / After preview toggle
  
  // Look Category Selection
  const [selectedLookCategory, setSelectedLookCategory] = useState('Bridal');

  // Selected Makeup Category (for manual override options)
  const [activeCategory, setActiveCategory] = useState('Lipstick'); // Lipstick, Foundation, Blush, Eyeshadow, Eyeliner, Contour, Highlighter, Eyebrows

  // Makeup Toggles
  const [lipstickEnabled, setLipstickEnabled] = useState(true);
  const [foundationEnabled, setFoundationEnabled] = useState(false);
  const [blushEnabled, setBlushEnabled] = useState(false);
  const [eyeshadowEnabled, setEyeshadowEnabled] = useState(false);
  const [eyelinerEnabled, setEyelinerEnabled] = useState(false);
  const [contourEnabled, setContourEnabled] = useState(false);
  const [highlighterEnabled, setHighlighterEnabled] = useState(false);
  const [eyebrowEnabled, setEyebrowEnabled] = useState(false);
  const [eyelashesEnabled, setEyelashesEnabled] = useState(false);

  // Selected values
  const [selectedLipstickColor, setSelectedLipstickColor] = useState('Red');
  const [selectedLipstickStyle, setSelectedLipstickStyle] = useState('Matte');
  const [customHexColor, setCustomHexColor] = useState('#C38B9B'); // Default custom color Mauve
  
  const [selectedFoundationShade, setSelectedFoundationShade] = useState('Warm Beige');
  
  const [selectedBlushStyle, setSelectedBlushStyle] = useState('Medium');
  
  const [selectedEyeshadowColor, setSelectedEyeshadowColor] = useState('Pink');
  const [selectedEyeshadowStyle, setSelectedEyeshadowStyle] = useState('Matte');
  
  const [selectedEyelinerStyle, setSelectedEyelinerStyle] = useState('Medium');
  const [selectedEyelashesStyle, setSelectedEyelashesStyle] = useState('Natural');
  
  const [selectedEyebrowColor, setSelectedEyebrowColor] = useState('Brown');
  
  const [intensity, setIntensity] = useState(80);

  // Real-time auto application trigger with a 350ms debounce
  useEffect(() => {
    if (originalImage) {
      const delayApply = setTimeout(() => {
        handleApply();
      }, 350);
      return () => clearTimeout(delayApply);
    }
  }, [
    lipstickEnabled, selectedLipstickColor, selectedLipstickStyle, customHexColor,
    foundationEnabled, selectedFoundationShade,
    blushEnabled, selectedBlushStyle,
    eyeshadowEnabled, selectedEyeshadowColor, selectedEyeshadowStyle,
    eyelinerEnabled, selectedEyelinerStyle,
    eyelashesEnabled, selectedEyelashesStyle,
    contourEnabled,
    highlighterEnabled,
    eyebrowEnabled, selectedEyebrowColor,
    intensity
  ]);

  // Mappers for AI recommendation strings to Try-on options
  const mapLipstickColor = (color) => {
    if (!color) return 'Red';
    const lower = color.toLowerCase();
    if (lower.includes('red') || lower.includes('rose') || lower.includes('ruby')) return 'Red';
    if (lower.includes('pink') || lower.includes('magenta') || lower.includes('fuchsia') || lower.includes('rose')) return 'Pink';
    if (lower.includes('nude') || lower.includes('beige') || lower.includes('flesh')) return 'Nude';
    if (lower.includes('brown') || lower.includes('taupe') || lower.includes('cocoa') || lower.includes('mocha')) return 'Brown';
    if (lower.includes('wine') || lower.includes('berry') || lower.includes('plum') || lower.includes('burgundy')) return 'Wine';
    if (lower.includes('coral') || lower.includes('orange')) return 'Coral';
    if (lower.includes('peach') || lower.includes('apricot')) return 'Peach';
    if (lower.includes('maroon')) return 'Maroon';
    return 'Pink';
  };

  const mapEyeshadowColor = (color) => {
    if (!color) return 'Pink';
    const lower = color.toLowerCase();
    if (lower.includes('pink') || lower.includes('rose')) return 'Pink';
    if (lower.includes('peach') || lower.includes('apricot')) return 'Peach';
    if (lower.includes('purple') || lower.includes('plum') || lower.includes('lavender') || lower.includes('violet')) return 'Purple';
    if (lower.includes('brown') || lower.includes('bronze') || lower.includes('taupe') || lower.includes('copper')) return 'Brown';
    if (lower.includes('gold') || lower.includes('champagne') || lower.includes('yellow') || lower.includes('shimmer')) return 'Gold';
    return 'Pink';
  };

  const mapFoundationShade = (shade) => {
    if (!shade) return 'Warm Beige';
    const lower = shade.toLowerCase();
    if (lower.includes('alabaster')) return 'Alabaster';
    if (lower.includes('ivory')) return 'Ivory';
    if (lower.includes('natural')) return 'Natural';
    if (lower.includes('beige') || lower.includes('warm beige')) return 'Warm Beige';
    if (lower.includes('sand')) return 'Sand';
    if (lower.includes('honey')) return 'Honey';
    if (lower.includes('espresso') || lower.includes('dark') || lower.includes('deep')) return 'Espresso';
    return 'Warm Beige';
  };

  const applyAiRecommendation = async (imageAsset, category = selectedLookCategory) => {
    if (!imageAsset) return;
    try {
      setLoading(true);
      const result = await recommendLooks(imageAsset);
      
      if (result && result.face_detected && result.recommended_looks && result.recommended_looks.length > 0) {
        let look = result.recommended_looks.find(l => 
          l.category?.toLowerCase() === category.toLowerCase() || 
          l.name?.toLowerCase().includes(category.toLowerCase())
        );
        
        if (!look) {
          look = result.recommended_looks[0];
        }

        const recs = look.personalized_recommendations;

        const finalLipstick = mapLipstickColor(recs.lipstick_color);
        const finalFoundation = mapFoundationShade(recs.foundation_shade);
        const finalEyeshadow = mapEyeshadowColor(recs.eyeshadow_color);
        
        // Pre-configure options and trigger auto-apply useEffect
        setLipstickEnabled(true);
        setSelectedLipstickColor(finalLipstick);
        setSelectedLipstickStyle('Matte');

        setFoundationEnabled(true);
        setSelectedFoundationShade(finalFoundation);

        setBlushEnabled(true);
        setSelectedBlushStyle('Medium');

        setEyeshadowEnabled(true);
        setSelectedEyeshadowColor(finalEyeshadow);
        setSelectedEyeshadowStyle('Matte');

        setEyelinerEnabled(true);
        setSelectedEyelinerStyle('Medium');

        setEyelashesEnabled(true);
        setSelectedEyelashesStyle('Natural');

        setContourEnabled(true);
        setHighlighterEnabled(true);
        setEyebrowEnabled(true);
        setSelectedEyebrowColor('Dark Brown');
        setIntensity(80);

        const params = {
          imageUri: imageAsset.uri,
          imageName: imageAsset.fileName,
          imageType: imageAsset.type,
          foundation: true,
          foundationShade: finalFoundation,
          lipstick: true,
          lipstickColor: finalLipstick,
          lipstickStyle: 'Matte',
          blush: true,
          blushColor: 'Pink',
          blushStyle: 'Medium',
          eyeshadow: true,
          eyeshadowColor: finalEyeshadow,
          eyeshadowStyle: 'Matte',
          eyeliner: true,
          eyelinerColor: 'Black',
          eyelinerStyle: 'Medium',
          eyelashes: true,
          eyelashesStyle: 'Natural',
          contour: true,
          contourIntensity: 50,
          highlighter: true,
          eyebrow: true,
          eyebrowColor: 'Dark Brown',
          intensity: 80,
        };

        const tryonRes = await applyVirtualTryon(params);
        if (tryonRes.success && tryonRes.processedImage) {
          setProcessedImage(tryonRes.processedImage);
          setShowOriginal(false);
        } else {
          Alert.alert('AI Analysis', `Recommended "${look.name}" look, but rendering failed.`);
        }
      } else {
        Alert.alert('Notice', 'No face detected or analysis failed.');
      }
    } catch (err) {
      console.warn('[AI Suggestion Error]:', err);
      Alert.alert('Notice', 'AI face lookup failed. Try a front-facing photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryName) => {
    setSelectedLookCategory(categoryName);
    if (originalImage) {
      applyAiRecommendation(originalImage, categoryName);
    }
  };

  const handleLiveCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to capture your selfie.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera access is required to use this feature.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      cameraType: 'front',
      quality: 0.95,
      includeBase64: false,
    };

    launchCamera(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setOriginalImage(response.assets[0]);
        setProcessedImage(null);
        applyAiRecommendation(response.assets[0]);
      }
    });
  };

  const handleUploadPhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.95,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        setOriginalImage(response.assets[0]);
        setProcessedImage(null);
        applyAiRecommendation(response.assets[0]);
      }
    });
  };

  const handleApply = async () => {
    if (!originalImage || !originalImage.uri) return;

    try {
      setLoading(true);
      const params = {
        imageUri: originalImage.uri,
        imageName: originalImage.fileName,
        imageType: originalImage.type,
        foundation: foundationEnabled,
        foundationShade: selectedFoundationShade,
        lipstick: lipstickEnabled,
        lipstickColor: selectedLipstickColor === 'Custom' ? customHexColor : selectedLipstickColor,
        lipstickStyle: selectedLipstickStyle,
        blush: blushEnabled,
        blushColor: 'Pink',
        blushStyle: selectedBlushStyle,
        eyeshadow: eyeshadowEnabled,
        eyeshadowColor: selectedEyeshadowColor,
        eyeshadowStyle: selectedEyeshadowStyle,
        eyeliner: eyelinerEnabled,
        eyelinerColor: 'Black',
        eyelinerStyle: selectedEyelinerStyle,
        eyelashes: eyelashesEnabled,
        eyelashesStyle: selectedEyelashesStyle,
        contour: contourEnabled,
        contourIntensity: 50,
        highlighter: highlighterEnabled,
        eyebrow: eyebrowEnabled,
        eyebrowColor: selectedEyebrowColor,
        intensity: intensity,
      };

      const res = await applyVirtualTryon(params);
      if (res.success && res.processedImage) {
        setProcessedImage(res.processedImage);
        setShowOriginal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUiColorHex = (colorName) => {
    const map = {
      Red: '#B90F1E',        // Crimson
      Pink: '#D75F7D',       // Rose Pink
      Nude: '#BE7D69',       // Toffee Nude
      Brown: '#6E4132',      // Mocha
      Wine: '#64142D',       // Berry Wine
      Coral: '#E16955',      // Salmon Coral
      Peach: '#E1876E',      // Velvet Peach
      Maroon: '#730A19',     // Burgundy Maroon
      Purple: '#8C3278',
      Gold: '#DCC050',
      Black: '#1A1A1A'
    };
    return map[colorName] || '#E0E0E0';
  };

  const handleSave = () => {
    Alert.alert('Success', 'Look saved successfully to your gallery!');
  };

  const handleShare = () => {
    Alert.alert('Share Look', 'Opening share settings...');
  };

  const handleBook = () => {
    navigation.navigate('SelectLocation');
  };

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Bridal': return 'rose-outline';
      case 'Glam': return 'sparkles-outline';
      case 'Natural': return 'leaf-outline';
      case 'Party': return 'wine-outline';
      case 'Minimal': return 'happy-outline';
      case 'Creative': return 'color-palette-outline';
      default: return 'star-outline';
    }
  };

  const handleCustomHexInput = (hex) => {
    let cleanHex = hex;
    if (hex && !hex.startsWith('#')) {
      cleanHex = '#' + hex;
    }
    setCustomHexColor(cleanHex);
  };

  const renderCategoryOptions = () => {
    switch (activeCategory) {
      case 'Lipstick':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Lipstick Finishes</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, lipstickEnabled && styles.toggleBtnActive]}
                onPress={() => setLipstickEnabled(!lipstickEnabled)}
              >
                <Text style={[styles.toggleBtnText, lipstickEnabled && styles.toggleBtnTextActive]}>
                  {lipstickEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {LIPSTICK_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.pill, selectedLipstickStyle === style && styles.pillActive]}
                  onPress={() => setSelectedLipstickStyle(style)}
                >
                  <Text style={[styles.pillText, selectedLipstickStyle === style && styles.pillTextActive]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.optionLabel}>Lipstick Colors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {LIPSTICK_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircleContainer, 
                    selectedLipstickColor === color && styles.colorCircleSelected
                  ]}
                  onPress={() => setSelectedLipstickColor(color)}
                >
                  {color === 'Custom' ? (
                    <View style={[styles.colorCircle, styles.customColorPickerTab]}>
                      <Ionicons name="color-palette" size={18} color="#FF4F87" />
                    </View>
                  ) : (
                    <View style={[styles.colorCircle, { backgroundColor: getUiColorHex(color) }]} />
                  )}
                  <Text style={styles.colorText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedLipstickColor === 'Custom' && (
              <View style={styles.customColorPanel}>
                <Text style={styles.customColorLabel}>Interactive Lip Palette</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spectrumRow}>
                  {[
                    // Crimson & Ruby Reds
                    '#E31B23', '#C41E3A', '#9B111E', '#722F37',
                    // Roses & Pinks
                    '#FF1493', '#FF69B4', '#E06080', '#C38B9B',
                    // Plums, Berries & Wines
                    '#800080', '#4B0082', '#6B1D2F', '#58111A',
                    // Corals, Peaches & Salmons
                    '#FF7F50', '#FF6F61', '#F88379', '#FFA07A',
                    // Nudes & Browns
                    '#BE7D69', '#C58F70', '#C68E17', '#B38B6D'
                  ].map(hex => (
                    <TouchableOpacity
                      key={hex}
                      style={[
                        styles.spectrumCircle,
                        customHexColor === hex && styles.spectrumCircleSelected,
                        { backgroundColor: hex }
                      ]}
                      onPress={() => setCustomHexColor(hex)}
                    >
                      {customHexColor === hex && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.customColorLabel, { marginTop: 8 }]}>Selected Shade: {customHexColor}</Text>
              </View>
            )}
          </View>
        );
      case 'Foundation':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Foundation Tone</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, foundationEnabled && styles.toggleBtnActive]}
                onPress={() => setFoundationEnabled(!foundationEnabled)}
              >
                <Text style={[styles.toggleBtnText, foundationEnabled && styles.toggleBtnTextActive]}>
                  {foundationEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {FOUNDATION_SHADES.map(shade => (
                <TouchableOpacity
                  key={shade}
                  style={[
                    styles.shadeCard, 
                    selectedFoundationShade === shade && styles.shadeCardActive
                  ]}
                  onPress={() => setSelectedFoundationShade(shade)}
                >
                  <View style={[styles.shadeCircle, { backgroundColor: getUiColorHex(shade === 'Warm Beige' ? 'Nude' : shade === 'Espresso' ? 'Brown' : 'Peach') }]} />
                  <Text style={[styles.shadeText, selectedFoundationShade === shade && styles.shadeTextActive]}>
                    {shade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 'Blush':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Blush Intensity Style</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, blushEnabled && styles.toggleBtnActive]}
                onPress={() => setBlushEnabled(!blushEnabled)}
              >
                <Text style={[styles.toggleBtnText, blushEnabled && styles.toggleBtnTextActive]}>
                  {blushEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {BLUSH_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.pill, selectedBlushStyle === style && styles.pillActive]}
                  onPress={() => setSelectedBlushStyle(style)}
                >
                  <Text style={[styles.pillText, selectedBlushStyle === style && styles.pillTextActive]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'Eyeshadow':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Eyeshadow Finishes</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, eyeshadowEnabled && styles.toggleBtnActive]}
                onPress={() => setEyeshadowEnabled(!eyeshadowEnabled)}
              >
                <Text style={[styles.toggleBtnText, eyeshadowEnabled && styles.toggleBtnTextActive]}>
                  {eyeshadowEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {EYESHADOW_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.pill, selectedEyeshadowStyle === style && styles.pillActive]}
                  onPress={() => setSelectedEyeshadowStyle(style)}
                >
                  <Text style={[styles.pillText, selectedEyeshadowStyle === style && styles.pillTextActive]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.optionLabel}>Eyeshadow Colors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
              {EYESHADOW_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircleContainer, 
                    selectedEyeshadowColor === color && styles.colorCircleSelected
                  ]}
                  onPress={() => setSelectedEyeshadowColor(color)}
                >
                  <View style={[styles.colorCircle, { backgroundColor: getUiColorHex(color) }]} />
                  <Text style={styles.colorText}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 'Eyeliner':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Eyeliner Styles</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, eyelinerEnabled && styles.toggleBtnActive]}
                onPress={() => setEyelinerEnabled(!eyelinerEnabled)}
              >
                <Text style={[styles.toggleBtnText, eyelinerEnabled && styles.toggleBtnTextActive]}>
                  {eyelinerEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {EYELINER_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.pill, selectedEyelinerStyle === style && styles.pillActive]}
                  onPress={() => setSelectedEyelinerStyle(style)}
                >
                  <Text style={[styles.pillText, selectedEyelinerStyle === style && styles.pillTextActive]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'Eyelashes':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Eyelash Extensions</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, eyelashesEnabled && styles.toggleBtnActive]}
                onPress={() => setEyelashesEnabled(!eyelashesEnabled)}
              >
                <Text style={[styles.toggleBtnText, eyelashesEnabled && styles.toggleBtnTextActive]}>
                  {eyelashesEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {['Natural', 'Volume', 'Dramatic'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.pill, selectedEyelashesStyle === style && styles.pillActive]}
                  onPress={() => setSelectedEyelashesStyle(style)}
                >
                  <Text style={[styles.pillText, selectedEyelashesStyle === style && styles.pillTextActive]}>
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 'Contour':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Jaw, Cheek & Forehead Contour</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, contourEnabled && styles.toggleBtnActive]}
                onPress={() => setContourEnabled(!contourEnabled)}
              >
                <Text style={[styles.toggleBtnText, contourEnabled && styles.toggleBtnTextActive]}>
                  {contourEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.infoDescription}>
              Adds definition along the hollows of your cheeks, jawline perimeter, and temples. Adjust intensity below.
            </Text>
          </View>
        );
      case 'Highlighter':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Glow Highlighter</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, highlighterEnabled && styles.toggleBtnActive]}
                onPress={() => setHighlighterEnabled(!highlighterEnabled)}
              >
                <Text style={[styles.toggleBtnText, highlighterEnabled && styles.toggleBtnTextActive]}>
                  {highlighterEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.infoDescription}>
              Applies a pearlescent shimmer on the bridge of the nose, Cupid's bow, and top of cheekbones.
            </Text>
          </View>
        );
      case 'Eyebrows':
        return (
          <View style={styles.optionContent}>
            <View style={styles.toggleHeader}>
              <Text style={styles.optionLabel}>Eyebrow Tinting</Text>
              <TouchableOpacity 
                style={[styles.toggleBtn, eyebrowEnabled && styles.toggleBtnActive]}
                onPress={() => setEyebrowEnabled(!eyebrowEnabled)}
              >
                <Text style={[styles.toggleBtnText, eyebrowEnabled && styles.toggleBtnTextActive]}>
                  {eyebrowEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillRow}>
              {EYEBROW_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.pill, selectedEyebrowColor === color && styles.pillActive]}
                  onPress={() => setSelectedEyebrowColor(color)}
                >
                  <Text style={[styles.pillText, selectedEyebrowColor === color && styles.pillTextActive]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScreenHeader title="Virtual Makeup Try-On" navigation={navigation} />

      <View style={styles.viewport}>
        {loading && !processedImage ? (
          <View style={styles.placeholderContainer}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loadingText}>AI is analyzing face shape and skin tone...</Text>
          </View>
        ) : processedImage && !showOriginal ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${processedImage}` }}
            style={styles.previewImage}
          />
        ) : originalImage ? (
          <Image
            source={{ uri: originalImage.uri }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={44} color="#FF4F87" />
            </View>
            <Text style={styles.placeholderText}>Start Your Virtual Try-On</Text>
            <Text style={styles.placeholderSubText}>Take a front selfie or upload a photo to start</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={handleLiveCamera}>
                <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.uploadBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.uploadBtn, styles.galleryBtn]} onPress={handleUploadPhoto}>
                <Ionicons name="images" size={18} color="#FF4F87" style={{ marginRight: 6 }} />
                <Text style={[styles.uploadBtnText, styles.galleryBtnText]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Viewport Floating Controls */}
        {originalImage && (
          <View style={styles.floatingControls}>
            <TouchableOpacity 
              style={[styles.floatingBtn, showOriginal && styles.floatingBtnActive]}
              onPressIn={() => setShowOriginal(true)}
              onPressOut={() => setShowOriginal(false)}
            >
              <Ionicons name="eye-outline" size={14} color={showOriginal ? '#FFFFFF' : '#FF4F87'} />
              <Text style={[styles.floatingBtnText, showOriginal && styles.floatingBtnTextActive]}>
                Original
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.floatingBtn} onPress={handleUploadPhoto}>
              <Ionicons name="refresh-outline" size={14} color="#FF4F87" />
              <Text style={styles.floatingBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* AI Style Categories Selection (Always Visible) */}
      <View style={styles.aiStylesHeader}>
        <Text style={styles.aiStylesTitle}>AI Suggested Looks</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiStylesScroll}>
          {LOOK_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.aiStyleTab,
                selectedLookCategory === cat && styles.aiStyleTabActive
              ]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Ionicons 
                name={getCategoryIcon(cat)} 
                size={12} 
                color={selectedLookCategory === cat ? '#FFFFFF' : '#FF4F87'} 
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.aiStyleLabel,
                selectedLookCategory === cat && styles.aiStyleLabelActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Makeup Menu Selection */}
      <View style={styles.categoryNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {['Lipstick', 'Foundation', 'Blush', 'Eyeshadow', 'Eyeliner', 'Eyelashes', 'Contour', 'Highlighter', 'Eyebrows'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryTabLabel, activeCategory === cat && styles.categoryTabLabelActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Settings / Configuration Panel */}
      <View style={styles.controlPanel}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
          {renderCategoryOptions()}

          {/* Compact Intensity Slider */}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Makeup Intensity ({intensity}%)</Text>
            <View style={styles.sliderLine} />
            <View style={styles.sliderDotsRow}>
              {INTENSITY_LEVELS.map(lvl => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.sliderDotContainer, intensity === lvl && styles.sliderDotActive]}
                  onPress={() => setIntensity(lvl)}
                >
                  <View style={styles.sliderDot} />
                  <Text style={styles.sliderDotText}>{lvl}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Consolidated Compact Footer Action Row */}
      {originalImage && (
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.iconActionBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={20} color="#FF4F87" />
            <Text style={styles.iconActionLabel}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#FF4F87" />
            <Text style={styles.iconActionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookActionBtn} onPress={handleBook}>
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.bookActionBtnText}>Book Makeup Artist</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default VirtualTryOnScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  viewport: {
    flex: 8,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFE6EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
  },
  placeholderSubText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: '80%',
  },
  uploadRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F87',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  galleryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
  },
  galleryBtnText: {
    color: '#FF4F87',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '600',
    textAlign: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    elevation: 2,
  },
  floatingBtnActive: {
    backgroundColor: '#FF4F87',
  },
  floatingBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4F87',
    marginLeft: 3,
  },
  floatingBtnTextActive: {
    color: '#FFFFFF',
  },
  aiStylesHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
  },
  aiStylesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiStylesScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  aiStyleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  aiStyleTabActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  aiStyleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF4F87',
  },
  aiStyleLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryNav: {
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
    backgroundColor: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 6,
    backgroundColor: '#F8F8F8',
  },
  categoryTabActive: {
    backgroundColor: '#FFE6EF',
  },
  categoryTabLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  categoryTabLabelActive: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  controlPanel: {
    flex: 3,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  optionContent: {
    marginBottom: 10,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
  },
  toggleBtn: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFE6EF',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
  },
  toggleBtnTextActive: {
    color: '#FF4F87',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  pillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF4F87',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  pillTextActive: {
    color: '#FF4F87',
    fontWeight: '700',
  },
  colorRow: {
    gap: 10,
    paddingVertical: 6,
  },
  colorCircleContainer: {
    alignItems: 'center',
    gap: 3,
  },
  colorCircleSelected: {
    transform: [{ scale: 1.1 }],
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  customColorPickerTab: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorText: {
    fontSize: 9,
    color: '#666666',
    fontWeight: '500',
  },
  customColorPanel: {
    backgroundColor: '#FCFCFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginTop: 6,
  },
  customColorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#777777',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  spectrumRow: {
    gap: 10,
    paddingVertical: 8,
  },
  spectrumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spectrumCircleSelected: {
    borderColor: '#FF4F87',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  shadeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginRight: 6,
    gap: 5,
  },
  shadeCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFE6EF',
  },
  shadeCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shadeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  shadeTextActive: {
    color: '#FF4F87',
  },
  infoDescription: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
    marginTop: 2,
  },
  sliderContainer: {
    marginTop: 6,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  sliderLine: {
    height: 3,
    backgroundColor: '#EFEFEF',
    borderRadius: 1.5,
    position: 'absolute',
    left: 8,
    right: 8,
    top: 32,
  },
  sliderDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sliderDotContainer: {
    alignItems: 'center',
    gap: 4,
  },
  sliderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D0D0D0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sliderDotActive: {
    transform: [{ scale: 1.2 }],
  },
  sliderDotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888888',
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 12,
  },
  iconActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  iconActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF4F87',
    marginTop: 1,
  },
  bookActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4F87',
    height: 44,
    borderRadius: 12,
    elevation: 2,
  },
  bookActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

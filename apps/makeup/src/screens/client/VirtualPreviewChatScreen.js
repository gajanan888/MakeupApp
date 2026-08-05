import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { submitPreviewPreferences, generatePreviewPrompt, generatePreview } from '../../api/aiClient';

const OCCASIONS = [
  'Wedding', 'Reception', 'Engagement', 'Haldi', 'Mehendi', 'Sangeet',
  'Cocktail Party', 'Birthday Party', 'Anniversary', 'Festival',
  'Office Event', 'Graduation', 'Photoshoot', 'Casual Outing', 'Date Night', 'Other'
];

const OUTFITS = [
  'Saree', 'Lehenga', 'Gown', 'Salwar Suit', 'Kurti',
  'Indo-Western', 'Western Dress', 'Blazer/Formal Wear', 'Casual Wear', 'Other'
];

const COLORS = [
  { name: 'Red', hex: '#FF3B30' },
  { name: 'Blue', hex: '#007AFF' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF', border: '#D1D1D6' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Purple', hex: '#AF52DE' },
  { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Orange', hex: '#FF9500' },
  { name: 'Beige', hex: '#F5F5DC', border: '#D1D1D6' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Other', hex: '#E5E5EA', isSpecial: true }
];

const OCCASION_MAKEUP_MAPPING = {
  'Wedding': [
    { name: 'Traditional Bridal', desc: 'Classic cultural bridal look' },
    { name: 'Modern Bridal', desc: 'Contemporary elegant finish' },
    { name: 'Royal Bridal', desc: 'Heavy regal bridal glam' },
    { name: 'HD Bridal', desc: 'High definition flawless base' },
    { name: 'Airbrush Bridal', desc: 'Lightweight waterproof finish' },
    { name: 'Minimal Bridal', desc: 'Subtle and natural bridal look' },
    { name: 'Luxury Bridal', desc: 'High-end premium cosmetic finish' },
    { name: 'Celebrity Bridal', desc: 'Inspired by iconic celebrity brides' }
  ],
  'Reception': [
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Full Glam', desc: 'Bold eyes and defined features' },
    { name: 'Luxury Glam', desc: 'Premium flawless party makeup' },
    { name: 'Bollywood Glam', desc: 'Dramatic cinematic beauty' },
    { name: 'Hollywood Glam', desc: 'Classic retro elegant style' },
    { name: 'Classic Elegant', desc: 'Timeless and sophisticated' },
    { name: 'Dewy Glam', desc: 'Luminous glowing skin' },
    { name: 'Red Carpet Glam', desc: 'Statement making flawless look' }
  ],
  'Engagement': [
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Romantic Glam', desc: 'Soft pinks and dreamy finish' },
    { name: 'Luxury Glam', desc: 'Premium flawless party makeup' },
    { name: 'Classic Elegant', desc: 'Timeless and sophisticated' },
    { name: 'Dewy Glam', desc: 'Luminous glowing skin' },
    { name: 'Natural Glam', desc: 'Subtle enhancement of features' },
    { name: 'Minimal Glam', desc: 'Understated elegance' },
    { name: 'Contemporary Glam', desc: 'Modern trendy makeup look' }
  ],
  'Haldi': [
    { name: 'Fresh Glow', desc: 'Bright and luminous morning look' },
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Minimal Makeup', desc: 'Very light base and soft colors' },
    { name: 'Dewy Makeup', desc: 'Hydrated glass-like skin' },
    { name: 'Floral Glam', desc: 'Soft colors complementing floral jewelry' },
    { name: 'Golden Glow', desc: 'Sun-kissed bronzed finish' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' }
  ],
  'Mehendi': [
    { name: 'Bohemian Glam', desc: 'Free-spirited artistic look' },
    { name: 'Fresh Glow', desc: 'Bright and luminous daytime look' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Colorful Glam', desc: 'Vibrant eye makeup to match outfits' },
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Dewy Makeup', desc: 'Hydrated glass-like skin' },
    { name: 'Ethnic Glam', desc: 'Traditional festive makeup' }
  ],
  'Sangeet': [
    { name: 'Bollywood Glam', desc: 'Dramatic cinematic beauty' },
    { name: 'Full Glam', desc: 'Bold eyes and defined features' },
    { name: 'Glitter Glam', desc: 'Sparkling eyes for the dance floor' },
    { name: 'Smokey Glam', desc: 'Deep, dramatic eye makeup focus' },
    { name: 'Bold Glam', desc: 'Striking colors and sharp contour' },
    { name: 'Party Glam', desc: 'Shine bright for evening celebrations' },
    { name: 'Celebrity Glam', desc: 'Trendsetting iconic party look' },
    { name: 'Metallic Glam', desc: 'Metallic shimmers and glowing skin' }
  ],
  'Cocktail Party': [
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Full Glam', desc: 'Bold eyes and defined features' },
    { name: 'Smokey Glam', desc: 'Deep, dramatic eye makeup focus' },
    { name: 'Bold Glam', desc: 'Striking colors and sharp contour' },
    { name: 'Dewy Glam', desc: 'Luminous glowing skin' },
    { name: 'Hollywood Glam', desc: 'Classic retro elegant style' },
    { name: 'Metallic Glam', desc: 'Metallic shimmers and glowing skin' },
    { name: 'Chic Glam', desc: 'Modern sophisticated party look' }
  ],
  'Birthday Party': [
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Party Glam', desc: 'Shine bright for evening celebrations' },
    { name: 'Korean Makeup', desc: 'Gradient lips and youthful blush' },
    { name: 'Dewy Glow', desc: 'Luminous, glass-like hydration skin' },
    { name: 'Minimal Chic', desc: 'Simple but stylish finish' },
    { name: 'Full Glam', desc: 'Bold eyes and defined features' }
  ],
  'Anniversary': [
    { name: 'Romantic Glam', desc: 'Soft pinks and dreamy finish' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Luxury Glam', desc: 'Premium flawless party makeup' },
    { name: 'Classic Elegant', desc: 'Timeless and sophisticated' },
    { name: 'Dewy Glam', desc: 'Luminous glowing skin' },
    { name: 'Natural Glam', desc: 'Subtle enhancement of features' }
  ],
  'Festival': [
    { name: 'Traditional Makeup', desc: 'Classic cultural festive look' },
    { name: 'Ethnic Glam', desc: 'Rich colors matching traditional wear' },
    { name: 'Bollywood Glam', desc: 'Dramatic cinematic beauty' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Festive Glam', desc: 'Bright and joyful makeup look' },
    { name: 'Radiant Glow', desc: 'Healthy glowing skin finish' }
  ],
  'Office Event': [
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Minimal Chic', desc: 'Simple but stylish finish' },
    { name: 'Matte Professional', desc: 'Zero shine, long lasting velvet look' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Nude Makeup', desc: 'Monochromatic subtle nude tones' },
    { name: 'Elegant Professional', desc: 'Sophisticated workplace look' }
  ],
  'Photoshoot': [
    { name: 'Editorial', desc: 'High fashion runway & creative beauty' },
    { name: 'High Fashion', desc: 'Avant-garde bold aesthetics' },
    { name: 'Creative Makeup', desc: 'Artistic and unique expressions' },
    { name: 'Full Glam', desc: 'Bold eyes and defined features' },
    { name: 'Glass Skin', desc: 'Ultra-dewy reflective skin' },
    { name: 'Camera-Ready HD', desc: 'Flawless under studio lighting' },
    { name: 'Artistic Makeup', desc: 'Expressive and colorful' },
    { name: 'Avant-Garde', desc: 'Experimental runway style' }
  ],
  'Date Night': [
    { name: 'Romantic Glam', desc: 'Soft pinks and dreamy finish' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Smokey Glam', desc: 'Deep, dramatic eye makeup focus' },
    { name: 'Luxury Glam', desc: 'Premium flawless party makeup' },
    { name: 'Dewy Glam', desc: 'Luminous glowing skin' },
    { name: 'Chic Glam', desc: 'Modern sophisticated party look' }
  ],
  'Graduation': [
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Korean Makeup', desc: 'Gradient lips and youthful blush' },
    { name: 'Minimal Chic', desc: 'Simple but stylish finish' },
    { name: 'Fresh Glow', desc: 'Bright and luminous daytime look' },
    { name: 'Elegant Glam', desc: 'Sophisticated and photogenic' }
  ],
  'Casual Outing': [
    { name: 'No-Makeup Makeup', desc: 'Flawless bare-faced illusion' },
    { name: 'Natural Makeup', desc: 'Minimal look enhancing natural features' },
    { name: 'Fresh Glow', desc: 'Bright and luminous daytime look' },
    { name: 'Korean Makeup', desc: 'Gradient lips and youthful blush' },
    { name: 'Minimal Chic', desc: 'Simple but stylish finish' },
    { name: 'Everyday Glam', desc: 'Elevated daily makeup routine' },
    { name: 'Dewy Makeup', desc: 'Hydrated glass-like skin' }
  ],
  'Other': [
    { name: 'Natural', desc: 'Minimal look enhancing natural features' },
    { name: 'Soft Glam', desc: 'Elegant, blended look with soft tones' },
    { name: 'Glam', desc: 'Defined features, shimmering colors' },
    { name: 'Smokey Eyes', desc: 'Deep, dramatic eye makeup focus' },
    { name: 'Dewy Glow', desc: 'Luminous, glass-like hydration skin' }
  ]
};

const HAIR_TYPES = [
  'Straight', 'Wavy', 'Curly', 'Coily', 'Other'
];

const HAIR_LENGTHS = [
  'Short', 'Medium', 'Long', 'Tied Hair / Bun', 'Other'
];

const HAIRSTYLES = [
  'Keep Current Hairstyle', 'Bridal Bun', 'Low Bun', 'High Bun', 'Soft Curls',
  'Hollywood Waves', 'Straight Hair', 'Half-Up Half-Down', 'Ponytail',
  'Braided Hairstyle', 'Open Hair', 'Traditional Bridal Hairstyle'
];

const JEWELRY = [
  'None', 'Minimal', 'Traditional', 'Heavy Bridal', 'Diamond', 'Gold', 'Silver', 'Pearl'
];

const ACCESSORIES = [
  'Earrings', 'Necklace', 'Maang Tikka', 'Nose Ring', 'Hair Flowers', 'Bindi', 'Hair Accessories'
];

const BOLDNESS_LEVELS = [
  { val: '1 = Barely Visible', num: 1 },
  { val: '2 = Light', num: 2 },
  { val: '3 = Medium', num: 3 },
  { val: '4 = Glam', num: 4 },
  { val: '5 = Full Glam', num: 5 },
];

const VirtualPreviewChatScreen = ({ navigation, route }) => {
  const { selfie_id, image } = route?.params || {};
  const [generating, setGenerating] = useState(false);

  // Form State
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [location, setLocation] = useState('Indoor');
  const [time, setTime] = useState('Evening');
  const [outfit, setOutfit] = useState(OUTFITS[0]);
  const [outfitColor, setOutfitColor] = useState('Pink');
  const [makeupStyle, setMakeupStyle] = useState(null);
  const [boldness, setBoldness] = useState('3 = Medium');
  const [hairType, setHairType] = useState(HAIR_TYPES[0]);
  const [hairLength, setHairLength] = useState(HAIR_LENGTHS[2]); // Default to Long
  const [preferredHairstyle, setPreferredHairstyle] = useState('Keep Current Hairstyle');
  const [jewelryPreference, setJewelryPreference] = useState('None');
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  // Modal Picker State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState([]);
  const [pickerTitle, setPickerTitle] = useState('');
  const [onSelectHandler, setOnSelectHandler] = useState(null);

  const currentStyles = OCCASION_MAKEUP_MAPPING[occasion] || OCCASION_MAKEUP_MAPPING['Other'];
  const displayStyles = occasion 
    ? [ { name: '✨ AI Recommended (Best Match)', desc: 'Custom style curated by AI for this occasion' }, ...currentStyles ] 
    : [];

  const openPicker = (title, data, currentVal, onSelect) => {
    setPickerTitle(title);
    setPickerData(data);
    setOnSelectHandler(() => (val) => {
      onSelect(val);
      setPickerVisible(false);
    });
    setPickerVisible(true);
  };

  const toggleAccessory = (item) => {
    if (item === 'None') {
      setSelectedAccessories(['None']);
      return;
    }
    let updated = selectedAccessories.filter(a => a !== 'None');
    if (updated.includes(item)) {
      updated = updated.filter(a => a !== item);
    } else {
      updated.push(item);
    }
    setSelectedAccessories(updated);
  };

  const handleSubmit = async () => {
    if (!makeupStyle) {
      alert('Please select a makeup style.');
      return;
    }
    setGenerating(true);
    try {
      // Compile accessories list
      let accs = 'None';
      if (selectedAccessories.length > 0) {
        accs = selectedAccessories.join(', ');
      }

      const preferencesMap = {
        event: occasion,
        location: location,
        time: time,
        outfit: outfit,
        outfit_color: outfitColor,
        style: makeupStyle,
        boldness: boldness,
        hair_type: hairType,
        hair_length: hairLength,
        hairstyle: preferredHairstyle,
        jewelry: jewelryPreference,
        accessories: accs,
      };

      console.log('[FormSubmit] Submitting Preferences:', preferencesMap);
      const data = await submitPreviewPreferences(selfie_id, preferencesMap);

      if (data && data.chat_session_id) {
        console.log('[FormSubmit] Fetching Prompt...');
        const promptData = await generatePreviewPrompt(data.chat_session_id);

        console.log('[FormSubmit] Generating Try-On Preview...');
        const previewData = await generatePreview(selfie_id, promptData.prompt, data.chat_session_id);

        if (previewData && previewData.id) {
          setGenerating(false);
          navigation.replace('VirtualPreviewResult', {
            preview_id: previewData.id,
            selfie_id: selfie_id,
            chat_session_id: data.chat_session_id,
            image: image,
          });
        } else {
          throw new Error('Failed to generate preview.');
        }
      }
    } catch (err) {
      console.error('[FormSubmit] Try-On pipeline failed:', err);
      setGenerating(false);
      alert('Failed to generate virtual try-on. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />
      <ScreenHeader title="AI Try-On Preferences" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.introText}>
            Customize your makeup and style preferences below. Our AI will analyze your features and apply the custom look.
          </Text>

          {/* 1. Occasion */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>1. What is the occasion? <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Occasion', OCCASIONS, occasion, (val) => {
                if (val !== occasion) {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setOccasion(val);
                  setMakeupStyle(null);
                }
              })}
            >
              <Text style={styles.dropdownText}>{occasion}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 2. Makeup Style */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>2. What makeup style do you prefer? <Text style={styles.required}>*</Text></Text>
            {!occasion ? (
              <Text style={{ color: '#8A5D6D', fontStyle: 'italic', marginVertical: 10 }}>Select an occasion to view suitable makeup styles.</Text>
            ) : (
              <View style={styles.makeupCardGrid}>
                {displayStyles.map((style) => {
                  const isSelected = makeupStyle === style.name;
                  return (
                    <TouchableOpacity
                      key={style.name}
                      style={[styles.styleCard, isSelected && styles.styleCardActive]}
                      activeOpacity={0.9}
                      onPress={() => setMakeupStyle(style.name)}
                    >
                      <View style={styles.styleCardHeader}>
                        <Text style={[styles.styleCardTitle, isSelected && styles.styleCardTitleActive]}>{style.name}</Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FF4F87" />}
                      </View>
                      <Text style={styles.styleCardDesc}>{style.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 3. Location */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>3. Where is the event? <Text style={styles.required}>*</Text></Text>
            <View style={styles.radioRow}>
              {['Indoor', 'Outdoor'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.radioItem, location === loc && styles.radioItemActive]}
                  activeOpacity={0.8}
                  onPress={() => setLocation(loc)}
                >
                  <View style={[styles.radioOuter, location === loc && styles.radioOuterActive]}>
                    {location === loc && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioText, location === loc && styles.radioTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 4. Time */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>4. What time is the event? <Text style={styles.required}>*</Text></Text>
            <View style={styles.radioGrid}>
              {['Morning', 'Afternoon', 'Evening', 'Night'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.radioItem, time === t && styles.radioItemActive, { width: '47%', marginBottom: 10 }]}
                  activeOpacity={0.8}
                  onPress={() => setTime(t)}
                >
                  <View style={[styles.radioOuter, time === t && styles.radioOuterActive]}>
                    {time === t && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioText, time === t && styles.radioTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 5. Outfit */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>5. What outfit are you wearing? <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Outfit', OUTFITS, outfit, setOutfit)}
            >
              <Text style={styles.dropdownText}>{outfit}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 6. Outfit Color */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>6. Primary color of your outfit? <Text style={styles.required}>*</Text></Text>
            
            {/* Color Palette Grid */}
            <View style={styles.colorPaletteGrid}>
              {COLORS.map((c) => {
                const isSelected = outfitColor === c.name;
                return (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.colorBubbleOuter, isSelected && styles.colorBubbleOuterActive]}
                    activeOpacity={0.8}
                    onPress={() => setOutfitColor(c.name)}
                  >
                    {c.isSpecial ? (
                      <View style={[styles.colorBubble, { backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="color-palette" size={16} color="#666" />
                      </View>
                    ) : (
                      <View style={[styles.colorBubble, { backgroundColor: c.hex }, c.border ? { borderWidth: 1, borderColor: c.border } : {}]} />
                    )}
                    <Text style={[styles.colorLabelText, isSelected && styles.colorLabelTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>


          {/* 7. Boldness */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>7. How bold should the makeup be? <Text style={styles.required}>*</Text></Text>
            
            {/* Custom Premium Segmented Slider */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLine} />
              <View style={styles.sliderDotsRow}>
                {BOLDNESS_LEVELS.map((level) => {
                  const isSelected = boldness.startsWith(level.num.toString());
                  return (
                    <TouchableOpacity
                      key={level.num}
                      style={styles.sliderDotItem}
                      activeOpacity={0.8}
                      onPress={() => setBoldness(level.val)}
                    >
                      <View style={[styles.sliderDot, isSelected && styles.sliderDotActive]}>
                        {isSelected && <View style={styles.sliderDotInner} />}
                      </View>
                      <Text style={[styles.sliderDotLabel, isSelected && styles.sliderDotLabelActive]}>
                        {level.num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <Text style={styles.boldnessDisplayVal}>Selected: <Text style={{ color: '#FF4F87', fontWeight: '800' }}>{boldness}</Text></Text>
          </View>

          {/* 8. Hair Type */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>8. What is your hair type? <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Hair Type', HAIR_TYPES, hairType, setHairType)}
            >
              <Text style={styles.dropdownText}>{hairType}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 9. Hair Length */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>9. What is your hair length? <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Hair Length', HAIR_LENGTHS, hairLength, setHairLength)}
            >
              <Text style={styles.dropdownText}>{hairLength}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 10. Preferred Hairstyle */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>10. Preferred hairstyle <Text style={styles.optional}>(Optional)</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Preferred Hairstyle', HAIRSTYLES, preferredHairstyle, setPreferredHairstyle)}
            >
              <Text style={styles.dropdownText}>{preferredHairstyle}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 11. Jewelry Preference */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>11. Jewelry preference <Text style={styles.optional}>(Optional)</Text></Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => openPicker('Select Jewelry Preference', JEWELRY, jewelryPreference, setJewelryPreference)}
            >
              <Text style={styles.dropdownText}>{jewelryPreference}</Text>
              <Ionicons name="chevron-down" size={18} color="#FF4F87" />
            </TouchableOpacity>
          </View>

          {/* 12. Accessories Multi-select */}
          <View style={styles.sectionCard}>
            <Text style={styles.questionLabel}>12. Do you want AI to add accessories? <Text style={styles.optional}>(Optional)</Text></Text>
            
            <View style={styles.pillContainer}>
              {/* None option */}
              <TouchableOpacity
                style={[
                  styles.accessoryPill,
                  (selectedAccessories.includes('None') || selectedAccessories.length === 0) && styles.accessoryPillActive
                ]}
                activeOpacity={0.8}
                onPress={() => toggleAccessory('None')}
              >
                <Text style={[
                  styles.accessoryPillText,
                  (selectedAccessories.includes('None') || selectedAccessories.length === 0) && styles.accessoryPillTextActive
                ]}>None</Text>
              </TouchableOpacity>

              {ACCESSORIES.map((acc) => {
                const isSelected = selectedAccessories.includes(acc) && !selectedAccessories.includes('None');
                return (
                  <TouchableOpacity
                    key={acc}
                    style={[styles.accessoryPill, isSelected && styles.accessoryPillActive]}
                    activeOpacity={0.8}
                    onPress={() => toggleAccessory(acc)}
                  >
                    <Text style={[styles.accessoryPillText, isSelected && styles.accessoryPillTextActive]}>
                      {acc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.88}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>Generate Custom Preview ✨</Text>
          </TouchableOpacity>
        </ScrollView>

      {/* Custom Dropdown Modal Picker */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContentBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#AA8899" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerData}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItemRow}
                  activeOpacity={0.7}
                  onPress={() => onSelectHandler && onSelectHandler(item)}
                >
                  <Text style={styles.pickerItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <Modal visible={generating} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loadingTitle}>Creating Your Preview...</Text>
            <Text style={styles.loadingSub}>Applying custom makeup, hair, and jewelry...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VirtualPreviewChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  introText: {
    fontSize: 13,
    color: '#8A5D6D',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFE4EF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#FFD1E1',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#FF2D55',
  },
  optional: {
    color: '#8A5D6D',
    fontWeight: '500',
    fontSize: 12,
  },
  dropdownBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD1E1',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  radioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: '40%',
    justifyContent: 'center',
  },
  radioItemActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF0F5',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#AA8899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#FF4F87',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4F87',
  },
  radioText: {
    fontSize: 13,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  radioTextActive: {
    color: '#FF4F87',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorBubbleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },
  colorBubbleOuterActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF0F5',
  },
  colorBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  colorLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A5D6D',
  },
  colorLabelTextActive: {
    color: '#FF4F87',
  },
  makeupCardGrid: {
    gap: 8,
  },
  styleCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    borderRadius: 14,
    padding: 12,
  },
  styleCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFF0F5',
  },
  styleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  styleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
  },
  styleCardTitleActive: {
    color: '#FF4F87',
  },
  styleCardDesc: {
    fontSize: 11,
    color: '#8A5D6D',
    fontWeight: '500',
  },
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  sliderLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FFD1E1',
    left: '10%',
    right: '10%',
    borderRadius: 2,
  },
  sliderDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: '8%',
  },
  sliderDotItem: {
    alignItems: 'center',
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FFD1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDotActive: {
    borderColor: '#FF4F87',
  },
  sliderDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4F87',
  },
  sliderDotLabel: {
    fontSize: 10,
    color: '#8A5D6D',
    fontWeight: '700',
    marginTop: 4,
  },
  sliderDotLabelActive: {
    color: '#FF4F87',
  },
  boldnessDisplayVal: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginTop: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.2,
    borderColor: '#FFD1E1',
  },
  accessoryPillActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  accessoryPillText: {
    fontSize: 12,
    color: '#8A5D6D',
    fontWeight: '700',
  },
  accessoryPillTextActive: {
    color: '#FFF',
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF4F87',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContentBox: {
    width: '85%',
    maxHeight: '75%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFD9E6',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0EC',
    backgroundColor: '#FFF8FA',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF4F87',
  },
  pickerItemRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  pickerItemText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: '#FFF0F5',
  },
  loadingBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9E6',
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: '#8A5D6D',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

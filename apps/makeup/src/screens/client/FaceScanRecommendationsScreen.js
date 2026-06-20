import React, { useMemo, useState } from 'react';
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

const LOOK_CATEGORIES = ['All Looks', 'Natural', 'Glam', 'Bridal'];

const RECOMMENDED_LOOKS = [
  {
    id: 'natural-glow',
    title: 'Natural Glow',
    description: 'Perfect for everyday look',
    image: require('../../assets/images/artist1.jpeg'),
    products: ['Lip Tint', 'Mascara', 'Base', 'Brush'],
  },
  {
    id: 'soft-glam',
    title: 'Soft Glam',
    description: 'Enhances your natural features',
    image: require('../../assets/images/model.jpeg'),
    products: ['Palette', 'Mascara', 'Lip Pencil', 'Brush'],
  },
  {
    id: 'bridal-radiance',
    title: 'Bridal Radiance',
    description: 'Perfect for weddings',
    image: require('../../assets/images/portfolio1.jpg'),
    products: ['Lipstick', 'Eyeliner', 'Highlighter', 'Brush'],
  },
];

const FaceScanRecommendationsScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Looks');

  const filteredLooks = useMemo(() => {
    if (selectedCategory === 'All Looks') {
      return RECOMMENDED_LOOKS;
    }

    return RECOMMENDED_LOOKS.filter(item => {
      const title = item.title.toLowerCase();
      const category = selectedCategory.toLowerCase();
      return title.includes(category) || category === 'natural';
    });
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Recommended Looks"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.heading}>Best Looks for Your Face</Text>
          <Text style={styles.subheading}>
            Based on your face shape and skin tone
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {LOOK_CATEGORIES.map(category => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[styles.tabText, active && styles.tabTextActive]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.cardList}>
            {filteredLooks.map(item => (
              <View key={item.id} style={styles.lookCard}>
                <Image source={item.image} style={styles.lookImage} />

                <View style={styles.lookInfo}>
                  <Text style={styles.lookTitle}>{item.title}</Text>
                  <Text style={styles.lookDescription}>{item.description}</Text>

                  <TouchableOpacity
                    style={styles.tryButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('LookDetails', { look: item })
                    }
                  >
                    <Text style={styles.tryButtonText}>Try Look</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BookLookArtist')}
          >
            <Text style={styles.bookButtonText}>Book Makeup Artist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FaceScanRecommendationsScreen;

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
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
  },
  subheading: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
  tabRow: {
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  tabChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#FFF5F8',
    borderWidth: 1,
    borderColor: '#F0D7E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: '#FF4F87',
    borderColor: '#FF4F87',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5D6D',
  },
  tabTextActive: {
    color: '#FFF',
  },
  cardList: {
    gap: 12,
  },
  lookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F2E3E9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  lookImage: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  lookInfo: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 6,
  },
  lookTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
  },
  lookDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A7A7A',
    lineHeight: 16,
  },
  tryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 6,
  },
  bookButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FF4F87',
    fontSize: 15,
    fontWeight: '800',
  },
});

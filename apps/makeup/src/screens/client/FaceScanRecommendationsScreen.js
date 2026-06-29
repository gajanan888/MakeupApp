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
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';

const { width: SCREEN_W } = Dimensions.get('window');

const LOOK_CATEGORIES = ['All', 'Natural', 'Glam', 'Bridal'];

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
    case 'engagement_makeup':
    case 'engagement-makeup':
      return require('../../assets/images/portfolio2.jpg');
    default:
      return require('../../assets/images/model.jpeg');
  }
};

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'Natural': return 'leaf-outline';
    case 'Glam':    return 'sparkles-outline';
    case 'Bridal':  return 'heart-outline';
    default:        return 'grid-outline';
  }
};

const getCategoryColor = (cat) => {
  switch (cat) {
    case 'Natural': return ['#4CAF8A', '#2E7D64'];
    case 'Glam':    return ['#FF6B9D', '#E91E63'];
    case 'Bridal':  return ['#FFB347', '#FF8C00'];
    default:        return ['#FF4F87', '#C2185B'];
  }
};

// ── Main Screen ──────────────────────────────────────────────────────────────

const FaceScanRecommendationsScreen = ({ navigation, route }) => {
  const { beauty_profile, recommended_looks, image } = route?.params || {};
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredLooks = useMemo(() => {
    const list = recommended_looks || [];
    if (selectedCategory === 'All') return list;
    return list.filter(item => {
      const cat  = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const sel  = selectedCategory.toLowerCase();
      return cat.includes(sel) || name.includes(sel);
    });
  }, [recommended_looks, selectedCategory]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScreenHeader
        title="Choose Your Look"
        onBack={() => navigation.goBack()}
      />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Section Title ── */}
          <View style={styles.headerInfoSection}>
            <Text style={styles.sectionHeaderTitle}>Best Looks for Your Face</Text>
            <Text style={styles.sectionHeaderSub}>
              Based on your {beauty_profile?.face_shape || 'Oval'} face shape and {beauty_profile?.skin_tone || 'Medium'} skin tone
            </Text>
          </View>

          {/* ── Category Tabs ────────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {LOOK_CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              const colors = getCategoryColor(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.82}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.tabChip, active && { borderColor: colors[0] }]}
                >
                  {active ? (
                    <LinearGradient
                      colors={colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabInner}
                    >
                      <Ionicons name={getCategoryIcon(cat)} size={13} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={[styles.tabText, styles.tabTextActive]}>{cat}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tabInner}>
                      <Ionicons name={getCategoryIcon(cat)} size={13} color="#AA6A7A" style={{ marginRight: 4 }} />
                      <Text style={styles.tabText}>{cat}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Looks Grid ──────────────────────────────────────────── */}
          {filteredLooks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="color-palette-outline" size={36} color="#E0B0C0" />
              <Text style={styles.emptyText}>No looks found in this category</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredLooks.map(item => {
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.88}
                    style={styles.lookCard}
                    onPress={() => {
                      navigation.navigate('TryThisLook', {
                        look: item,
                        image,
                        beauty_profile,
                      });
                    }}
                  >
                    {/* Left: Look Image */}
                    <View style={styles.lookImageWrap}>
                      <Image
                        source={getLookImage(item.id)}
                        style={styles.lookImage}
                        resizeMode="cover"
                      />
                      {/* Category Badge overlay */}
                      <LinearGradient
                        colors={getCategoryColor(item.category || 'All')}
                        style={styles.lookCategoryBadge}
                      >
                        <Text style={styles.lookCategoryText}>
                          {item.category || 'Custom'}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Right: Info */}
                    <View style={styles.lookCardBody}>
                      <Text style={styles.lookCardTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.lookCardDesc} numberOfLines={2}>
                        {item.description}
                      </Text>

                      <View style={styles.lookCardMetaRow}>
                        <View style={styles.metaChip}>
                          <Ionicons name="time-outline" size={10} color="#FF4F87" />
                          <Text style={styles.metaChipText}>{item.time_estimate || '20 min'}</Text>
                        </View>
                        <View style={styles.metaChip}>
                          <Ionicons name="sparkles-outline" size={10} color="#FF4F87" />
                          <Text style={styles.metaChipText}>{item.coverage || 'Medium'}</Text>
                        </View>
                      </View>

                      {/* Try Look Button (Visual prompt) */}
                      <View style={styles.tryLookBtn}>
                        <Text style={styles.tryLookBtnText}>Try Look ✨</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Sticky Footer: Try Now ───────────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BookLookArtist', { beauty_profile })}
          >
            <Text style={styles.bookBtnText}>Book Makeup Artist Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

export default FaceScanRecommendationsScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_W = (SCREEN_W - 20 - 32 - 10) / 2; // 2-column grid

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  headerInfoSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EDD7E2',
    overflow: 'hidden',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6070',
  },
  tabTextActive: {
    color: '#FFF',
  },

  // ── Grid ──────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  listContainer: {
    paddingHorizontal: 14,
    width: '100%',
    gap: 12,
  },
  lookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFE4EF',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#FF4F87',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lookImageWrap: {
    width: 90,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  lookImage: {
    width: '100%',
    height: '100%',
  },
  lookCategoryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lookCategoryText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  lookCardBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  lookCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  lookCardDesc: {
    fontSize: 11.5,
    color: '#666',
    marginTop: 3,
    lineHeight: 15,
  },
  lookCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFE0EC',
    gap: 3,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4F87',
  },
  tryLookBtn: {
    backgroundColor: '#FF4F87',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    shadowColor: '#FF4F87',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tryLookBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Empty ─────────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#CCA8BB',
    fontWeight: '600',
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE8EF',
    backgroundColor: '#FFF',
  },
  bookBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF4F87',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FF4F87',
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getArtists } from '../../api/auth';
import ScreenHeader from '../../components/ScreenHeader';

const { width } = Dimensions.get('window');

const SKIN_TYPES = [
  {
    id: 'dry',
    label: 'Dry Skin',
    desc: 'Flaky or tight skin needing hydration',
  },
  {
    id: 'oily',
    label: 'Oily Skin',
    desc: 'Shiny skin prone to breakouts or excess sebum',
  },
  {
    id: 'combination',
    label: 'Combination Skin',
    desc: 'Oily T-zone with dry or normal cheeks',
  },
  {
    id: 'normal',
    label: 'Normal Skin',
    desc: 'Balanced skin that is neither dry nor oily',
  },
  {
    id: 'sensitive',
    label: 'Sensitive Skin',
    desc: 'Prone to redness, itching, or product reactions',
  },
];

const BUDGETS = [
  {
    id: 'budget',
    label: 'Budget Friendly',
    range: 'Under ₹2,000',
    value: '0-2000',
  },
  {
    id: 'mid',
    label: 'Mid-Range Professional',
    range: '₹2,000 - ₹5,000',
    value: '2000-5000',
  },
  {
    id: 'luxury',
    label: 'Premium & Luxury',
    range: 'Above ₹5,000',
    value: '5000+',
  },
];

const EVENT_STYLES = [
  { id: 'Bridal', label: 'Bridal / Wedding', icon: 'heart-outline' },
  { id: 'Party', label: 'Party / Festive', icon: 'sparkles-outline' },
  { id: 'HD Makeup', label: 'HD Glamour / Engagement', icon: 'star-outline' },
  { id: 'Airbrush', label: 'Airbrush Flawless', icon: 'color-wand-outline' },
  { id: 'Photoshoot', label: 'Photoshoot / Editorial', icon: 'camera-outline' },
  { id: 'Minimal', label: 'Minimal / Casual Look', icon: 'happy-outline' },
];

const AIMatchScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);

  // Recommendation engine state
  const [matching, setMatching] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');
  const [recommendedArtists, setRecommendedArtists] = useState([]);

  const handleNextStep = () => {
    if (step === 1 && !selectedSkin) {
      Alert.alert('Required', 'Please select your skin type to continue.');
      return;
    }
    if (step === 2 && !selectedBudget) {
      Alert.alert(
        'Required',
        'Please select your budget preference to continue.',
      );
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      runRecommendationEngine();
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const runRecommendationEngine = async () => {
    if (!selectedStyle) {
      Alert.alert(
        'Required',
        'Please select an event style to get recommendations.',
      );
      return;
    }

    setMatching(true);
    setStep(4); // Match complete / Results step placeholder

    // Stage 1 animation
    setMatchMessage('Analyzing skin type compatibility...');
    await new Promise(r => setTimeout(r, 600));

    // Stage 2 animation
    setMatchMessage('Filtering by budget constraints...');
    await new Promise(r => setTimeout(r, 600));

    // Stage 3 animation
    setMatchMessage('Scoring event specializations...');
    await new Promise(r => setTimeout(r, 600));

    try {
      const allArtists = await getArtists();
      const scored = allArtists.map(artist => {
        let score = 50; // Base baseline score

        // 1. Specialization Match (Max 30 points)
        const specs = (artist.specializations || []).map(s =>
          s.name?.toLowerCase(),
        );
        const styleQuery = selectedStyle.toLowerCase();

        const hasDirectSpec = specs.some(
          s => s.includes(styleQuery) || styleQuery.includes(s),
        );
        if (hasDirectSpec) {
          score += 30;
        } else {
          // Check related keywords
          if (
            styleQuery === 'bridal' &&
            specs.some(
              s =>
                s.includes('wedding') ||
                s.includes('reception') ||
                s.includes('hd'),
            )
          ) {
            score += 20;
          } else if (
            styleQuery === 'party' &&
            specs.some(
              s =>
                s.includes('glam') ||
                s.includes('engagement') ||
                s.includes('minimal'),
            )
          ) {
            score += 20;
          } else if (specs.length > 0) {
            score += 10;
          }
        }

        // 2. Budget Range Match (Max 30 points)
        const rawPriceRange = artist.services?.[0]?.priceRange || '';
        const budgetId = selectedBudget.id;

        if (budgetId === 'budget') {
          // Wants cheap under 2000
          if (
            rawPriceRange.includes('1500') ||
            rawPriceRange.includes('1000') ||
            rawPriceRange.includes('2000')
          ) {
            score += 30;
          } else if (rawPriceRange.includes('5000')) {
            score -= 10;
          } else {
            score += 15; // default
          }
        } else if (budgetId === 'mid') {
          // Wants mid 2000-5000
          if (
            rawPriceRange.includes('2500') ||
            rawPriceRange.includes('3000') ||
            rawPriceRange.includes('5000')
          ) {
            score += 30;
          } else {
            score += 20;
          }
        } else if (budgetId === 'luxury') {
          // Luxury 5000+
          if (
            rawPriceRange.includes('5000') ||
            rawPriceRange.includes('8000') ||
            rawPriceRange.includes('10000')
          ) {
            score += 30;
          } else if (
            rawPriceRange.includes('1500') ||
            rawPriceRange.includes('1000')
          ) {
            score += 10;
          } else {
            score += 20;
          }
        }

        // 3. Experience Match (Max 10 points)
        const experience = artist.profile?.experience || 0;
        if (experience > 5) {
          score += 10;
        } else if (experience >= 2) {
          score += 7;
        } else {
          score += 4;
        }

        // Caps
        const finalScore = Math.min(Math.max(score, 45), 99);

        return {
          ...artist,
          matchPercentage: finalScore,
        };
      });

      // Sort by score descending
      const sorted = scored.sort(
        (a, b) => b.matchPercentage - a.matchPercentage,
      );
      setRecommendedArtists(sorted);
    } catch (error) {
      console.warn('AI Match engine error:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not run recommendations at this time.',
      );
    } finally {
      setMatching(false);
    }
  };

  const handleReset = () => {
    setSelectedSkin(null);
    setSelectedBudget(null);
    setSelectedStyle(null);
    setRecommendedArtists([]);
    setStep(1);
  };

  const renderStepIndicator = () => {
    if (step > 3) return null;
    return (
      <View style={styles.stepIndicatorContainer}>
        <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
          <Text
            style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}
          >
            1
          </Text>
        </View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
          <Text
            style={[styles.stepNumber, step >= 2 && styles.stepNumberActive]}
          >
            2
          </Text>
        </View>
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}>
          <Text
            style={[styles.stepNumber, step >= 3 && styles.stepNumberActive]}
          >
            3
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="AI Recommendation Wizard" onBack={handleBackStep} />

      {/* Step Indicator */}
      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 1 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.quizHeading}>Select Your Skin Type</Text>
            <Text style={styles.quizSubheading}>
              We match skin compatibility and product usage specifications.
            </Text>

            {SKIN_TYPES.map(item => {
              const isSelected = selectedSkin?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardActive,
                  ]}
                  onPress={() => setSelectedSkin(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#FF4F87"
                      />
                    )}
                  </View>
                  <Text style={styles.optionDesc}>{item.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.quizHeading}>Select Event Budget</Text>
            <Text style={styles.quizSubheading}>
              We rank makeup artists fitting your range preferences.
            </Text>

            {BUDGETS.map(item => {
              const isSelected = selectedBudget?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardActive,
                  ]}
                  onPress={() => setSelectedBudget(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isSelected && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#FF4F87"
                      />
                    )}
                  </View>
                  <Text style={styles.optionDesc}>
                    Pricing scope: {item.range}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {step === 3 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.quizHeading}>Choose Event Style</Text>
            <Text style={styles.quizSubheading}>
              Which specialization fits the event or look you are going for?
            </Text>

            <View style={styles.gridContainer}>
              {EVENT_STYLES.map(item => {
                const isSelected = selectedStyle === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.gridCard,
                      isSelected && styles.gridCardActive,
                    ]}
                    onPress={() => setSelectedStyle(item.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconWrapper,
                        isSelected && styles.iconWrapperActive,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={28}
                        color={isSelected ? '#FFF' : '#FF4F87'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.gridTitle,
                        isSelected && styles.gridTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {step === 4 && (
          <View style={{ flex: 1 }}>
            {matching ? (
              /* MATCH LOADING STATE */
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF4F87" />
                <Text style={styles.loadingHeading}>AI Match Engine</Text>
                <Text style={styles.loadingSubtext}>{matchMessage}</Text>
              </View>
            ) : (
              /* MATCH RESULTS VIEW */
              <View style={{ flex: 1 }}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Your Top Matches</Text>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={handleReset}
                  >
                    <Ionicons name="refresh" size={16} color="#FF4F87" />
                    <Text style={styles.retakeBtnText}>Retake Quiz</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={recommendedArtists}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.resultsList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="sad-outline" size={48} color="#CCC" />
                      <Text style={styles.emptyText}>
                        No highly compatible matches
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Try adjusting your event preferences or budget range.
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.artistResultCard}
                      onPress={() =>
                        navigation.navigate('ArtistDetails', { artist: item })
                      }
                    >
                      <View style={styles.resultCardBody}>
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={24} color="#FF4F87" />
                        </View>
                        <View style={styles.artistMeta}>
                          <Text style={styles.artistResultName}>
                            {item.name}
                          </Text>
                          <Text style={styles.artistResultSpec}>
                            {item.specializations?.[0]?.name ||
                              'Makeup Specialist'}
                          </Text>
                          <Text style={styles.artistResultExp}>
                            ⭐{' '}
                            {item.profile?.experience
                              ? `${item.profile.experience} years experience`
                              : 'Premium Specialist'}
                          </Text>
                          <Text style={styles.artistResultPrice}>
                            {item.services?.[0]?.priceRange ||
                              'Contact for price'}
                          </Text>
                        </View>
                        <View style={styles.scoreContainer}>
                          <Text style={styles.scoreNumber}>
                            {item.matchPercentage}%
                          </Text>
                          <Text style={styles.scoreLabel}>Match</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Bottom Actions for Quiz Step */}
      {step < 4 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelQuizBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelQuizText}>Exit Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextQuizBtn} onPress={handleNextStep}>
            <Text style={styles.nextQuizText}>
              {step === 3 ? 'Match Me' : 'Next Question'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FFF"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AIMatchScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#FF4F87',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#F3F3F3',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#FF4F87',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quizHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    marginTop: 8,
  },
  quizSubheading: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFE6EF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  optionTextActive: {
    color: '#FF4F87',
  },
  optionDesc: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
    lineHeight: 16,
  },

  /* Grid Layout (Step 3) */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  gridCardActive: {
    borderColor: '#FF4F87',
    backgroundColor: '#FFE6EF',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFEBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapperActive: {
    backgroundColor: '#FF4F87',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  gridTextActive: {
    color: '#FF4F87',
  },

  /* Loading State */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  loadingHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
  },

  /* Results styling */
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4F87',
    marginLeft: 4,
  },
  resultsList: {
    paddingBottom: 20,
  },
  artistResultCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  resultCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistMeta: {
    flex: 1,
    marginLeft: 14,
  },
  artistResultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  artistResultSpec: {
    fontSize: 12,
    color: '#FF4F87',
    fontWeight: '500',
    marginTop: 2,
  },
  artistResultExp: {
    fontSize: 11,
    color: '#777',
    marginTop: 3,
  },
  artistResultPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4F87',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F9F0',
    borderColor: '#B7EB8F',
    borderWidth: 1,
    borderRadius: 14,
    width: 58,
    height: 58,
  },
  scoreNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#389E0D',
  },
  scoreLabel: {
    fontSize: 9,
    color: '#389E0D',
    fontWeight: '600',
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    height: 68,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelQuizBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelQuizText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#777',
  },
  nextQuizBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF4F87',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextQuizText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

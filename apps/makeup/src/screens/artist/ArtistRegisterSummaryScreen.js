// FinalSummaryScreen.js

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

const ArtistRegisterSummaryScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#F7F7F7"
        barStyle="dark-content"
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}>
          {/* SUMMARY CARD */}
          <View style={styles.summaryCard}>
            {/* PROFILE SECTION */}
            <View style={styles.profileSection}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
                }}
                style={styles.profileImage}
              />

              <View style={styles.profileInfo}>
                <Text style={styles.name}>
                  Mona Lisa
                </Text>

                <Text style={styles.category}>
                  Bridal & HD Makeup Artist
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editButton}>
                <Icon
                  name="edit-2"
                  size={18}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            {/* BIO */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Bio
                </Text>

                <TouchableOpacity>
                  <Icon
                    name="edit"
                    size={16}
                    color="#FF4F8F"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionText}>
                Passionate professional makeup
                artist specializing in bridal,
                fashion and celebrity makeup
                looks with 5+ years of
                experience.
              </Text>
            </View>

            {/* SPECIALIZATION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Specializations
                </Text>

                <TouchableOpacity>
                  <Icon
                    name="edit"
                    size={16}
                    color="#FF4F8F"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {[
                  'Bridal',
                  'HD Makeup',
                  'Party Makeup',
                  'Fashion',
                ].map((item, index) => (
                  <View
                    key={index}
                    style={styles.chip}>
                    <Text style={styles.chipText}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* PRICING */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Pricing
                </Text>

                <TouchableOpacity>
                  <Icon
                    name="edit"
                    size={16}
                    color="#FF4F8F"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.priceCard}>
                <Text style={styles.priceTitle}>
                  Bridal Makeup
                </Text>

                <Text style={styles.priceText}>
                  ₹10,000 - ₹25,000
                </Text>
              </View>

              <View style={styles.priceCard}>
                <Text style={styles.priceTitle}>
                  Party Makeup
                </Text>

                <Text style={styles.priceText}>
                  ₹3,000 - ₹8,000
                </Text>
              </View>
            </View>

            {/* PAYMENT */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Payment Details
                </Text>

                <TouchableOpacity>
                  <Icon
                    name="edit"
                    size={16}
                    color="#FF4F8F"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionText}>
                UPI: monalisa@upi
              </Text>

              <Text style={styles.sectionText}>
                Bank: HDFC Bank
              </Text>
            </View>

            {/* PORTFOLIO */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Portfolio
                </Text>

                <TouchableOpacity>
                  <Icon
                    name="edit"
                    size={16}
                    color="#FF4F8F"
                  />
                </TouchableOpacity>
              </View>

              <View
                style={styles.portfolioContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600',
                  }}
                  style={styles.portfolioImage}
                />

                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600',
                  }}
                  style={styles.portfolioImage}
                />
              </View>
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>
              Start The Journey
            </Text>

            <Icon
              name="arrow-right"
              size={22}
              color="#FFF"
              style={{marginLeft: 8}}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ArtistRegisterSummaryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },

  // SUMMARY CARD

  summaryCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 34,
    padding: 24,
    marginTop: 20,
  },

  // PROFILE

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFF',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },

  category: {
    marginTop: 4,
    fontSize: 14,
    color: '#B7796C',
    lineHeight: 20,
  },

  editButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF4F8F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SECTION

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  sectionText: {
    fontSize: 15,
    color: '#6F625D',
    lineHeight: 24,
  },

  // CHIPS

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  chip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD1E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
  },

  chipText: {
    color: '#FF4F8F',
    fontWeight: '600',
    fontSize: 13,
  },

  // PRICE

  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  priceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },

  priceText: {
    marginTop: 6,
    color: '#B7796C',
    fontSize: 14,
  },

  // PORTFOLIO

  portfolioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  portfolioImage: {
    width: '48%',
    height: 140,
    borderRadius: 20,
  },

  // BUTTON

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 34,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
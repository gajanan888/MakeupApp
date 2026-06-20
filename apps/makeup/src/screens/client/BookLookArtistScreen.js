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
  Image,
} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';

const ARTISTS = [
  { id: '1', name: 'Priya Sharma', rating: '4.8', price: '₹2500' },
  { id: '2', name: 'Neha Patil', rating: '4.7', price: '₹2200' },
];

const BookLookArtistScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Book Makeup Artist"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.inputValueRow}>
              <Text style={styles.inputValue}>25 May 2025</Text>
            </View>
          </View>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Time</Text>
            <View style={styles.inputValueRow}>
              <Text style={styles.inputValue}>11:00 AM</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            Select Artist
          </Text>

          <View style={styles.artistList}>
            {ARTISTS.map(artist => (
              <View key={artist.id} style={styles.artistCard}>
                <Image
                  source={require('../../assets/images/artist1.jpeg')}
                  style={styles.artistImage}
                />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <Text style={styles.artistRating}>⭐ {artist.rating}</Text>
                </View>
                <Text style={styles.artistPrice}>{artist.price}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BookLookArtistScreen;

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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  inputBox: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '700',
  },
  inputValueRow: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D7E1',
    backgroundColor: '#FFF7FA',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inputValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  artistList: {
    gap: 10,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F2E3E9',
  },
  artistImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 10,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },
  artistRating: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 2,
  },
  artistPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

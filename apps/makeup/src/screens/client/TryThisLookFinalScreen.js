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
import ScreenHeader from '../../components/ScreenHeader';

const TryThisLookFinalScreen = ({ navigation, route }) => {
  const look = route?.params?.look;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Step 3/3 - Final Look"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <Text style={styles.subtitle}>This is your final look</Text>

          <Image
            source={look?.image || require('../../assets/images/model.jpeg')}
            style={styles.heroImage}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('BookLookArtist', { look })}
            >
              <Text style={styles.primaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TryThisLookFinalScreen;

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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroImage: {
    width: '100%',
    height: 300,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  button: {
    flex: 1,
    height: 46,
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
    fontSize: 14,
    fontWeight: '800',
  },
});

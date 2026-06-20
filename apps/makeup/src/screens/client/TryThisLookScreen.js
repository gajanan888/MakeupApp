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

const TryThisLookScreen = ({ navigation, route }) => {
  const look = route?.params?.look;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />

      <View style={styles.shell}>
        <ScreenHeader
          title="Try This Look"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.content}>
          <Text style={styles.stepLabel}>Step 1/3</Text>
          <Text style={styles.subtitle}>
            We will show you how to achieve this look
          </Text>

          <Image
            source={look?.image || require('../../assets/images/model.jpeg')}
            style={styles.heroImage}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('TryThisLookEye', { look })}
          >
            <Text style={styles.buttonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TryThisLookScreen;

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
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#444',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 296,
    height: 330,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
  },
  button: {
    marginTop: 18,
    height: 48,
    width: '100%',
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

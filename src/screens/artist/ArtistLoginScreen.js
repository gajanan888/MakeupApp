import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const ArtistLoginScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Artist Login
      </Text>
    </View>
  );
};

export default ArtistLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FF4F87',
  },
});
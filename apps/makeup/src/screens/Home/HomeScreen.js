import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

const HomeScreen = ({navigation, route}) => {
  const userName = route?.params?.userName || 'Beauty Lover';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Signed in</Text>
        <Text style={styles.title}>Hi, {userName}</Text>
        <Text style={styles.subtitle}>
          Your pink beauty theme is live and polished for the next screens.
        </Text>

        <Pressable
          onPress={() => navigation.replace('Login')}
          style={({pressed}) => [styles.button, pressed ? styles.buttonPressed : null]}>
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff7fb',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#f7dfe9',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#8e4460',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    width: '100%',
  },
  kicker: {
    color: '#cf5f89',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  title: {
    color: '#24131b',
    fontSize: 30,
    fontWeight: '300',
  },
  subtitle: {
    color: '#8f6a78',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#cf5f89',
    borderRadius: 28,
    paddingVertical: 18,
  },
  buttonPressed: {
    backgroundColor: '#b94f77',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;

// PaymentDetailsScreen.js

import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';

const ACCOUNT_NUMBER_REGEX = /^\d{6,18}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const ArtistRegisterScreen6 = ({ navigation }) => {
  const { data, setPayment } = useArtistRegistration();

  const [error, setError] = useState('');

  const [accountHolder, setAccountHolder] = useState(
    data.payment.accountHolder || '',
  );

  const [bankName, setBankName] = useState(data.payment.bankName || '');

  const [accountNumber, setAccountNumber] = useState(
    data.payment.accountNumber || '',
  );

  const [ifscCode, setIfscCode] = useState(data.payment.ifscCode || '');

  const [upiId, setUpiId] = useState(data.payment.upiId || '');

  const validatePayment = () => {
    const normalizedAccountNumber = accountNumber.trim();
    const normalizedIfscCode = ifscCode
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();

    if (!accountHolder.trim()) {
      return 'Account holder name is required.';
    }

    if (!bankName.trim()) {
      return 'Bank name is required.';
    }

    if (!ACCOUNT_NUMBER_REGEX.test(normalizedAccountNumber)) {
      return 'Account number must contain 6 to 18 digits.';
    }

    if (!IFSC_REGEX.test(normalizedIfscCode)) {
      return 'IFSC code must be 11 characters like ABCD0123456.';
    }

    return '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
        >
          {/* HEADER */}
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              Setup your{'\n'}
              <Text style={styles.pinkText}>Payment</Text> Details
            </Text>
          </View>

          {/* ACCOUNT HOLDER */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#FF4F8F"
                style={styles.icon}
              />

              <TextInput
                placeholder="Enter Account Holder Name"
                placeholderTextColor="#C7AAA0"
                value={accountHolder}
                onChangeText={setAccountHolder}
                style={styles.input}
              />
            </View>
          </View>

          {/* BANK NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color="#FF4F8F"
                style={styles.icon}
              />

              <TextInput
                placeholder="Enter Bank Name"
                placeholderTextColor="#C7AAA0"
                value={bankName}
                onChangeText={setBankName}
                style={styles.input}
              />
            </View>
          </View>

          {/* ACCOUNT NUMBER */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="card-outline"
                size={20}
                color="#FF4F8F"
                style={styles.icon}
              />

              <TextInput
                placeholder="Enter Account Number"
                placeholderTextColor="#C7AAA0"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          {/* IFSC */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>IFSC Code</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="hash"
                size={20}
                color="#FF4F8F"
                style={styles.icon}
              />

              <TextInput
                placeholder="Enter IFSC Code"
                placeholderTextColor="#C7AAA0"
                value={ifscCode}
                onChangeText={setIfscCode}
                autoCapitalize="characters"
                style={styles.input}
              />
            </View>
          </View>

          {/* UPI */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI ID</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color="#FF4F8F"
                style={styles.icon}
              />

              <TextInput
                placeholder="Enter UPI ID"
                placeholderTextColor="#C7AAA0"
                value={upiId}
                onChangeText={setUpiId}
                style={styles.input}
              />
            </View>
          </View>

          {/* INFO CARD */}
          <View style={styles.infoCard}>
            <Ionicons name="shield" size={20} color="#FF4F8F" />

            <Text style={styles.infoText}>
              Your payment details are safely encrypted and securely stored.
            </Text>
          </View>

          {!!error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              const validationError = validatePayment();

              if (validationError) {
                setError(validationError);
                return;
              }

              const normalizedAccountNumber = accountNumber.trim();
              const normalizedIfscCode = ifscCode
                .trim()
                .replace(/\s+/g, '')
                .toUpperCase();

              setError('');
              setPayment({
                accountHolder: accountHolder.trim(),
                bankName: bankName.trim(),
                accountNumber: normalizedAccountNumber,
                ifscCode: normalizedIfscCode,
                upiId,
              });
              navigation.navigate('ArtistRegisterSummary');
            }}
          >
            <Text style={styles.buttonText}>Let’s Make-up Profile</Text>

            <Ionicons
              name="arrow-forward"
              size={22}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ArtistRegisterScreen6;

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

  // HEADER

  headerCard: {
    backgroundColor: '#FFE4ED',
    borderRadius: 30,
    paddingVertical: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 36,
  },

  headerText: {
    fontSize: 24,
    color: '#111',
    textAlign: 'center',
    lineHeight: 38,
    fontWeight: '700',
  },

  pinkText: {
    color: '#FF4F8F',
  },

  // INPUT GROUP

  inputGroup: {
    marginBottom: 26,
  },

  label: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    marginLeft: 18,
    marginBottom: -10,
    zIndex: 10,
    color: '#FF4F8F',
    fontSize: 14,
    fontWeight: '700',
  },

  inputContainer: {
    height: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  icon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    color: '#111',
    fontSize: 15,
  },

  // INFO CARD

  infoCard: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#B7796C',
    lineHeight: 22,
    fontSize: 14,
  },

  errorText: {
    marginTop: 14,
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },

  // BUTTON

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 40,
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

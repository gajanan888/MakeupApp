import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const palette = {
  background: '#fff7fb',
  panel: '#f6dfe8',
  card: '#fffafb',
  text: '#24131b',
  muted: '#8f6a78',
  stroke: '#d98ba8',
  button: '#cf5f89',
  buttonPressed: '#b84d74',
  white: '#ffffff',
  blush: '#fdf0f6',
  divider: '#ecd6e1',
};

const SocialButton = ({label, iconText}) => (
  <Pressable
    style={({pressed}) => [
      styles.socialButton,
      pressed ? styles.socialButtonPressed : null,
    ]}>
    <Text style={styles.socialIcon}>{iconText}</Text>
    <Text style={styles.socialLabel}>{label}</Text>
  </Pressable>
);

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  rightText,
  onRightPress,
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.field}>
      <TextInput
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        secureTextEntry={secureTextEntry}
        style={styles.fieldInput}
        value={value}
      />
      {rightText ? (
        <Pressable onPress={onRightPress} style={styles.fieldAction}>
          <Text style={styles.fieldActionText}>{rightText}</Text>
        </Pressable>
      ) : null}
    </View>
  </View>
);

const initialForm = {
  fullName: '',
  phone: '',
  otp: '',
  otpSent: false,
  email: '',
  city: '',
  password: '',
  confirmPassword: '',
  loading: false,
};

const SignupScreen = ({navigation}) => {
  const [form, setForm] = useState(initialForm);

  const updateForm = updates => {
    setForm(current => ({...current, ...updates}));
  };

  const handleSendOtp = () => {
    const trimmedPhone = form.phone.trim();

    if (trimmedPhone.length < 10) {
      Alert.alert(
        'Invalid mobile number',
        'Please enter a valid mobile number.',
      );
      return;
    }

    updateForm({otpSent: true});
    Alert.alert('OTP sent', 'Use 123456 to verify this demo account.');
  };

  const handleSignup = () => {
    const trimmedName = form.fullName.trim();
    const trimmedPhone = form.phone.trim();
    const trimmedOtp = form.otp.trim();
    const trimmedEmail = form.email.trim();
    const trimmedCity = form.city.trim();

    if (
      !trimmedName ||
      !trimmedPhone ||
      !trimmedOtp ||
      !trimmedEmail ||
      !trimmedCity ||
      !form.password ||
      !form.confirmPassword
    ) {
      Alert.alert('Missing details', 'Please fill in all required fields.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (trimmedPhone.length < 10) {
      Alert.alert(
        'Invalid mobile number',
        'Please enter a valid mobile number.',
      );
      return;
    }

    if (trimmedOtp !== '123456') {
      Alert.alert('Invalid OTP', 'Please enter the demo OTP 123456.');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert(
        'Weak password',
        'Password must be at least 6 characters long.',
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    updateForm({loading: true});
    setTimeout(() => {
      updateForm({loading: false});
      navigation.replace('Home', {userName: trimmedName});
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>User Registration</Text>
          <Text style={styles.heroTitle}>Create your beauty account</Text>
          <Text style={styles.heroSubtitle}>
            Register with mobile OTP, email ID, and secure account details.
            Social login stays optional.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Required Details</Text>
            <Text style={styles.sectionCopy}>
              All fields below help create a complete user profile.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Field
              autoCapitalize="words"
              label="Full Name"
              onChangeText={value => updateForm({fullName: value})}
              placeholder="Enter your full name"
              value={form.fullName}
            />
            <Field
              keyboardType="phone-pad"
              label="Mobile Number"
              onChangeText={value => updateForm({phone: value})}
              placeholder="+91 98765 43210"
              value={form.phone}
            />
            <Field
              keyboardType="number-pad"
              label="OTP Verification"
              onChangeText={value => updateForm({otp: value})}
              onRightPress={handleSendOtp}
              placeholder="Enter 6-digit OTP"
              rightText={form.otpSent ? 'Resend' : 'Send OTP'}
              value={form.otp}
            />
            <Field
              keyboardType="email-address"
              label="Email ID"
              onChangeText={value => updateForm({email: value})}
              placeholder="you@example.com"
              value={form.email}
            />
            <Field
              autoCapitalize="words"
              label="City"
              onChangeText={value => updateForm({city: value})}
              placeholder="Your city"
              value={form.city}
            />
            <Field
              label="Password"
              onChangeText={value => updateForm({password: value})}
              placeholder="Create password"
              secureTextEntry
              value={form.password}
            />
            <Field
              label="Confirm Password"
              onChangeText={value => updateForm({confirmPassword: value})}
              placeholder="Confirm password"
              secureTextEntry
              value={form.confirmPassword}
            />
          </View>

          <Text style={styles.helperText}>
            Mobile OTP verification is required before account creation.
          </Text>

          <Pressable
            disabled={form.loading}
            onPress={handleSignup}
            style={({pressed}) => [
              styles.primaryButton,
              pressed && !form.loading ? styles.primaryButtonPressed : null,
              form.loading ? styles.primaryButtonDisabled : null,
            ]}>
            {form.loading ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Optional social login</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <SocialButton iconText="G" label="Google" />
            <SocialButton iconText="f" label="Facebook" />
            <SocialButton iconText="A" label="Apple" />
          </View>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({pressed}) => [
              styles.linkButton,
              pressed ? styles.linkButtonPressed : null,
            ]}>
            <Text style={styles.linkButtonText}>BACK TO SIGN IN</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: palette.panel,
    borderRadius: 36,
    marginBottom: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#9a5070',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  heroEyebrow: {
    color: palette.button,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    marginTop: 10,
  },
  heroSubtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 32,
    padding: 20,
    shadowColor: '#9a5070',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '700',
  },
  sectionCopy: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  formSection: {
    gap: 20,
  },
  fieldWrap: {
    position: 'relative',
  },
  fieldLabel: {
    alignSelf: 'flex-start',
    backgroundColor: palette.card,
    color: palette.stroke,
    fontSize: 13,
    marginLeft: 18,
    paddingHorizontal: 8,
    position: 'absolute',
    top: -9,
    zIndex: 1,
  },
  field: {
    alignItems: 'center',
    backgroundColor: palette.blush,
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: 16,
  },
  fieldInput: {
    color: palette.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  fieldAction: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  fieldActionText: {
    color: palette.button,
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.button,
    borderRadius: 22,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 56,
  },
  primaryButtonPressed: {
    backgroundColor: palette.buttonPressed,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 26,
  },
  divider: {
    backgroundColor: palette.divider,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: palette.muted,
    fontSize: 13,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 18,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.stroke,
    borderRadius: 20,
    borderWidth: 1.5,
    flex: 1,
    minHeight: 74,
    justifyContent: 'center',
  },
  socialButtonPressed: {
    backgroundColor: palette.blush,
  },
  socialIcon: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  socialLabel: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
  linkButton: {
    alignItems: 'center',
    borderColor: palette.stroke,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 54,
  },
  linkButtonPressed: {
    backgroundColor: palette.blush,
  },
  linkButtonText: {
    color: palette.button,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SignupScreen;

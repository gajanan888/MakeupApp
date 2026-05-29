import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

const ArtistRegisterScreen1 = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isChecked, setIsChecked] = useState(false);
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [termsError, setTermsError] = useState('');

    const handleRegister = () => {

        let valid = true;

        setNameError('');
        setEmailError('');
        setPhoneError('');
        setPasswordError('');
        setConfirmPasswordError('');

        if (!fullName.trim()) {
            setNameError('Please enter your full name');
            valid = false;
        }

        if (!email.trim()) {
            setEmailError('Email is required');
            valid = false;
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            setEmailError('Enter a valid email address');
            valid = false;
        }

        if (!phone.trim()) {
            setPhoneError('Phone number is required');
            valid = false;
        } else if (!/^\d{10}$/.test(phone)) {
            setPhoneError('Enter a valid 10-digit phone number');
            valid = false;
        }

        if (!password) {
            setPasswordError('Password is required');
            valid = false;
        }
        else if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            valid = false;
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Confirm Password is required');
            valid = false;
        }
        else if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        }

        if (!isChecked) {
            setTermsError('Please accept Terms & Conditions');
            valid = false;
        }

        if (!valid) return;

        navigation.navigate('ArtistOTPVerification');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>

                    {/* Header */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={28}
                            color="#222"
                        />
                    </TouchableOpacity>

                    <Text style={styles.title}>Create Account</Text>

                    <Text style={styles.subtitle}>
                        Join GlamAI and discover top makeup artists
                    </Text>

                    {/* Registration Form */}

                    <View style={styles.inputContainer}>

                        <Ionicons
                            name="person-outline"
                            size={22}
                            color="#FF4F87"
                        />

                        <TextInput
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                setNameError('');
                            }}
                            placeholderTextColor="#C7AAA0"
                            style={styles.input}
                        />

                    </View>

                    {nameError ? (
                        <Text style={styles.errorText}>
                            {nameError}
                        </Text>
                    ) : null}

                    <View style={styles.inputContainer}>

                        <Ionicons
                            name="mail-outline"
                            size={22}
                            color="#FF4F87"
                        />

                        <TextInput
                            placeholder="Email Address"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setEmailError('');
                            }}
                            placeholderTextColor="#C7AAA0"
                            style={styles.input}
                        />

                    </View>

                    {emailError ? (
                        <Text style={styles.errorText}>
                            {emailError}
                        </Text>
                    ) : null}

                    <View style={styles.inputContainer}>

                        <Ionicons
                            name="call-outline"
                            size={22}
                            color="#FF4F87"
                        />

                        <TextInput
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            value={phone}
                            maxLength={10}
                            onChangeText={(text) => {
                                const numbersOnly = text.replace(/[^0-9]/g, '');
                                setPhone(numbersOnly);
                                setPhoneError('');
                            }}
                            placeholderTextColor="#C7AAA0"
                            style={styles.input}
                        />

                    </View>

                    {phoneError ? (
                        <Text style={styles.errorText}>
                            {phoneError}
                        </Text>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={22}
                            color="#FF4F87"
                        />

                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setPasswordError('');
                            }}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#C7AAA0"
                            style={styles.input}
                        />

                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={
                                    showPassword
                                        ? 'eye-off-outline'
                                        : 'eye-outline'
                                }
                                size={22}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>

                    {passwordError ? (
                        <Text style={styles.errorText}>
                            {passwordError}
                        </Text>
                    ) : null}

                    <View style={styles.inputContainer}>

                        <Ionicons
                            name="lock-closed-outline"
                            size={22}
                            color="#FF4F87"
                        />

                        <TextInput
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setConfirmPasswordError('');
                            }}
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor="#C7AAA0"
                            style={styles.input}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                        >
                            <Ionicons
                                name={
                                    showConfirmPassword
                                        ? 'eye-off-outline'
                                        : 'eye-outline'
                                }
                                size={22}
                                color="#999"
                            />
                        </TouchableOpacity>

                    </View>

                    {confirmPasswordError ? (
                        <Text style={styles.errorText}>
                            {confirmPasswordError}
                        </Text>
                    ) : null}

                    {/* Terms & Conditions */}

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setIsChecked(!isChecked)}
                    >
                        <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={22}
                            color="#FF4F87"
                        />

                        <Text style={styles.checkboxText}>
                            I agree to Terms & Conditions
                        </Text>
                    </TouchableOpacity>

                    {/* Register Button */}

                    <TouchableOpacity
                        disabled={!isChecked}
                        style={[
                            styles.registerButton,
                            !isChecked && styles.disabledButton,
                        ]}
                        onPress={handleRegister}

                    >
                        <Text style={styles.registerText}>
                            Create Account
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}

                    <View style={styles.footer}>

                        <Text style={styles.footerText}>
                            Already have an account?
                        </Text>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('ArtistLogin')}
                        >
                            <Text style={styles.signInLink}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
};

export default ArtistRegisterScreen1;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
        paddingTop: 60,
    },

    backButton: {
        marginTop: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },

    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',

    },

    subtitle: {
        fontSize: 16,
        color: '#777',
        marginTop: 8,
        marginBottom: 28,
        lineHeight: 24,
        textAlign: 'center',
    },

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#222',
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 18,
        height: 60,
        paddingHorizontal: 16,
        marginBottom: 16,
    },

    errorText: {
        color: '#FF4F87',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 12,
        marginLeft: 8,
    },

    termsContainer: {
        marginTop: 10,
        marginBottom: 25,
    },

    termsText: {
        color: '#666',
        fontSize: 14,
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 25,
    },

    checkboxText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },

    disabledButton: {
        opacity: 0.5,
    },

    registerButton: {
        backgroundColor: '#FF4F87',

        height: 56,

        borderRadius: 16,

        justifyContent: 'center',
        alignItems: 'center',
    },

    registerText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },



    footer: {
        flexDirection: 'row',
        justifyContent: 'center',

        marginTop: 30,
    },

    footerText: {
        color: '#777',
    },

    signInLink: {
        color: '#FF4F87',
        fontWeight: '700',

        marginLeft: 4,
    },
});
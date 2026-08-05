import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { requestForgotPassword } from '../../api/auth';

const ForgotPasswordScreen = ({ navigation, route }) => {
    const userRole = route?.params?.userRole || 'client';
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!email.trim()) {
            setEmailError('Email or phone number is required');
            return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        const isPhone = /^\+?[\d\s\-]{7,15}$/.test(email.trim());

        if (!isEmail && !isPhone) {
            setEmailError('Enter a valid email or phone number');
            return;
        }

        try {
            setLoading(true);
            const res = await requestForgotPassword(email.trim(), userRole);
            const targetRole = res?.data?.userRole || userRole;
            Alert.alert(
                'OTP Sent',
                'A 6-digit verification code has been sent to your email address.',
                [
                    {
                        text: 'OK',
                        onPress: () =>
                            navigation.navigate('OtpVerification', {
                                email: email.trim(),
                                userRole: targetRole,
                            }),
                    },
                ]
            );
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP. Please try again.';
            setEmailError(msg);
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            {/* Back Button */}

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

            <View style={styles.iconContainer}>
                <Ionicons
                    name="shield-checkmark-outline"
                    size={70}
                    color="#FF4F87"
                />
            </View>

            {/* Heading */}

            <Text style={styles.title}>
                Forgot Password?
            </Text>

            <Text style={styles.subtitle}>
                Enter your registered email address or mobile number to receive an OTP.
            </Text>

            {/* Email Input */}

            <View style={styles.inputContainer}>

                <Ionicons
                    name="mail-outline"
                    size={22}
                    color="#999"
                />
                <TextInput
                    placeholder="Email or Mobile Number"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setEmailError('');
                    }}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

            </View>

            {emailError ? (
                <Text style={styles.errorText}>
                    {emailError}
                </Text>
            ) : null}

            {/* Button */}

            <TouchableOpacity
                style={[styles.resetButton, loading && { opacity: 0.7 }]}
                onPress={handleSendOtp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.resetButtonText}>
                        Send OTP
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Remember your password?
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.footerLink}>
                        Sign In
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
        paddingTop: 60,
    },

    backButton: {
        marginTop: 10,
        marginBottom: 30,
        alignSelf: 'flex-start',
    },

    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },

    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#111',
        marginTop: 20,
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 15,
        color: '#777',
        marginTop: 10,
        lineHeight: 26,
        marginBottom: 28,
        textAlign: 'center',
    },

    inputContainer: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 60,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#222',
    },

    helperText: {
        color: '#999',
        fontSize: 13,
        marginTop: 10,
        marginLeft: 4,
    },

    errorText: {
        color: '#FF3B30',
        marginTop: 8,
        marginLeft: 4,
    },

    resetButton: {
        backgroundColor: '#FF4F87',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },

    resetButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },

    footerText: {
        fontSize: 15,
        color: '#777',
    },

    footerLink: {
        fontSize: 15,
        color: '#FF4F87',
        fontWeight: '700',
        marginLeft: 4,
    },
});
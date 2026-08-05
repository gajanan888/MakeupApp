import React, { useRef, useState } from 'react';
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
import { verifyForgotPasswordOtp, requestForgotPassword } from '../../api/auth';

const OtpVerificationScreen = ({ navigation, route }) => {
    const email = route?.params?.email || '';
    const userRole = route?.params?.userRole || 'client';

    const [otp, setOtp] = useState('');
    const inputRef = useRef(null);
    const [otpError, setOtpError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerifyOtp = async () => {
        if (!/^\d{6}$/.test(otp)) {
            setOtpError('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setLoading(true);
            await verifyForgotPasswordOtp(email, otp);
            navigation.navigate('CreateNewPassword', { email, otp, userRole });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code.';
            setOtpError(msg);
            Alert.alert('Verification Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email) return;
        try {
            setResending(true);
            await requestForgotPassword(email, userRole);
            Alert.alert('OTP Resent', 'A new 6-digit verification code has been sent to your email.');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to resend OTP.';
            Alert.alert('Error', msg);
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>

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

            {/* OTP Icon */}

            <View style={styles.iconContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={70}
                    color="#FF4F87"
                />
            </View>

            {/* Title */}

            <Text style={styles.title}>
                Verify OTP
            </Text>

            {/* Subtitle */}

            <Text style={styles.subtitle}>
                Enter the 6-digit verification code sent to {email || 'your email'}.
            </Text>

            {/* OTP Boxes */}

            <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
            >
                <View style={styles.otpContainer}>

                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <View
                            key={index}
                            style={[
                                styles.otpBox,
                                otp.length === index && styles.activeOtpBox,
                            ]}
                        >
                            <Text style={styles.otpText}>
                                {otp[index] || ''}
                            </Text>
                        </View>
                    ))}

                </View>
            </TouchableOpacity>
            {otpError ? (
                <Text style={styles.errorText}>
                    {otpError}
                </Text>
            ) : null}

            {/* Hidden Input */}

            <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(text) => {
                    const filteredText = text.replace(/[^0-9]/g, '');

                    setOtp(filteredText);
                    setOtpError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenInput}
            />

            {/* Resend OTP */}

            <View style={styles.resendContainer}>

                <Text style={styles.resendText}>
                    Didn't receive the code?
                </Text>

                <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                    <Text style={styles.resendLink}>
                        {resending ? 'Sending...' : 'Resend OTP'}
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Verify Button */}

            <TouchableOpacity
                style={[styles.verifyButton, loading && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.verifyButtonText}>
                        Verify OTP
                    </Text>
                )}
            </TouchableOpacity>

        </View>
    );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 28,
        paddingTop: 60,
    },

    backButton: {
        marginTop: 10,
        marginBottom: 30,
        alignSelf: 'flex-start',
    },

    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },

    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 15,
        color: '#777',
        lineHeight: 24,
        marginTop: 10,
        marginBottom: 35,
        textAlign: 'center',
    },

    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },

    otpBox: {
        width: 52,
        height: 60,

        backgroundColor: '#FFFFFF',

        borderWidth: 1,
        borderColor: '#E5E5E5',

        borderRadius: 16,

        justifyContent: 'center',
        alignItems: 'center',
    },

    otpText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },

    hiddenInput: {
        position: 'absolute',
        opacity: 0,
    },

    activeOtpBox: {
        borderColor: '#FF4F87',
        borderWidth: 2,
    },

    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 30,
    },

    resendText: {
        fontSize: 14,
        color: '#777',
    },

    resendLink: {
        fontSize: 14,
        color: '#FF4F87',
        fontWeight: '700',
        marginLeft: 4,
    },

    verifyButton: {
        backgroundColor: '#FF4F87',

        height: 60,

        borderRadius: 18,

        justifyContent: 'center',
        alignItems: 'center',
    },

    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    timerText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#777',
        marginBottom: 16,
    },

    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        marginBottom: 15,
        textAlign: 'center',
    },
});

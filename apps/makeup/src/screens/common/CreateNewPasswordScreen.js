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
import { resetUserPassword } from '../../api/auth';

const CreateNewPasswordScreen = ({ navigation, route }) => {
    const email = route?.params?.email || '';
    const otp = route?.params?.otp || '';
    const userRole = route?.params?.userRole || 'client';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {
        let valid = true;

        setPasswordError('');
        setConfirmPasswordError('');

        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            valid = false;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            valid = false;
        }

        if (!valid) return;

        try {
            setLoading(true);
            await resetUserPassword(email, otp, password, userRole);
            Alert.alert(
                'Password Updated',
                'Your password has been reset successfully! Please sign in with your new password.',
                [
                    {
                        text: 'Sign In',
                        onPress: () =>
                            navigation.reset({
                                index: 0,
                                routes: [{ name: userRole === 'artist' ? 'ArtistLogin' : 'ClientLogin' }],
                            }),
                    },
                ]
            );
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to update password. Please try again.';
            setPasswordError(msg);
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
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

            <View style={styles.iconContainer}>
                <Ionicons
                    name="lock-closed-outline"
                    size={70}
                    color="#FF4F87"
                />
            </View>

            <Text style={styles.title}>
                Create New Password
            </Text>

            <Text style={styles.subtitle}>
                Create a strong password for your account.
            </Text>

            {/* Password Field */}

            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="New Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setPasswordError('');
                    }}
                    style={styles.input}
                />

                <TouchableOpacity
                    onPress={() =>
                        setShowPassword(!showPassword)
                    }
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

            {/* Confirm Password Field */}

            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="Confirm Password"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        setConfirmPasswordError('');
                    }}
                    style={styles.input}
                />

                <TouchableOpacity
                    onPress={() =>
                        setShowConfirmPassword(
                            !showConfirmPassword
                        )
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

            <TouchableOpacity
                style={[styles.updateButton, loading && { opacity: 0.7 }]}
                onPress={handleUpdatePassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.updateButtonText}>
                        Update Password
                    </Text>
                )}
            </TouchableOpacity>

        </View>
    );
};

export default CreateNewPasswordScreen;

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
        marginBottom: 20,
    },

    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
    },

    subtitle: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 10,
        marginBottom: 35,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',

        borderWidth: 1,
        borderColor: '#E5E5E5',

        borderRadius: 18,

        paddingHorizontal: 16,

        height: 60,

        marginBottom: 10,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: '#222',
    },

    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 4,
    },

    updateButton: {
        backgroundColor: '#FF4F87',

        height: 60,

        borderRadius: 18,

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 20,
    },

    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
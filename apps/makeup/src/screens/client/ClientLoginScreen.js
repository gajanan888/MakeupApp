import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const ClientLoginScreen = ({ navigation }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const handleLogin = () => {
        if (!email.trim()) {
            setEmailError('Email or phone number is required');
            return;
        }

        const isEmail =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        const isPhone =
            /^\d{10}$/.test(email);

        if (!isEmail && !isPhone) {
            setEmailError(
                'Enter a valid email address or 10-digit phone number'
            );
            return;
        }

        if (!password.trim()) {
            setPasswordError('Password is required');
            return;
        }
        navigation.replace('ClientHome');
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

            <Text style={styles.title}>
                Welcome Back!
            </Text>

            <Text style={styles.subtitle}>
                Sign in to continue
            </Text>

            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="Email or Phone"
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setEmailError('');
                    }}
                />
            </View>

            {emailError ? (
                <Text style={styles.errorText}>
                    {emailError}
                </Text>
            ) : null}


            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="Password"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setPasswordError('');
                    }}
                />

                {passwordError ? (
                    <Text style={styles.errorText}>
                        {passwordError}
                    </Text>
                ) : null}


                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#999"
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('ForgotPassword')
                }
            >
                <Text style={styles.forgotPassword}>
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInButton}
                onPress={handleLogin}>
                <Text style={styles.signInText}>
                    Sign In
                </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>
                    or continue with
                </Text>

                <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>

                <TouchableOpacity style={styles.socialButton}>
                    <Ionicons
                        name="logo-google"
                        size={24}
                        color="#EA4335"
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Ionicons
                        name="logo-apple"
                        size={28}
                        color="#111"
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Ionicons
                        name="logo-facebook"
                        size={24}
                        color="#1877F2"
                    />
                </TouchableOpacity>

            </View>

            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                    Don't have an account?
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ClientRegister')}
                >
                    <Text style={styles.signupLink}>
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default ClientLoginScreen;

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

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#222',
    },

    title: {
        fontSize: 38,
        fontWeight: '800',
        color: '#111',
        marginTop: 20,
        textAlign: 'center',
    },

    subtitle: {
        color: '#777',
        marginTop: 4,
        marginBottom: 30,
        textAlign: 'center',

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
        marginBottom: 16,
    },

    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 10,
        marginLeft: 6,
    },

    forgotPassword: {
        alignSelf: 'flex-end',
        color: '#FF4F87',
        marginBottom: 24,
        fontSize: 14,
    },

    signInButton: {
        backgroundColor: '#FF4F87',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },

    signInText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 25,
    },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },

    dividerText: {
        marginHorizontal: 12,
        color: '#888',
        fontSize: 14,
    },

    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
    },

    socialButton: {
        width: 64,
        height: 64,
        backgroundColor: '#FFF',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },

    socialText: {
        fontSize: 24,
        fontWeight: '700',
    },

    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',

        marginTop: 40,
    },

    signupText: {
        color: '#777',
    },

    signupLink: {
        color: '#FF4F87',
        fontWeight: '700',
        marginLeft: 4,
    },
});
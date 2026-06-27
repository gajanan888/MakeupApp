import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { loginArtist, getArtistProfile } from '../../api/auth';
import { useArtistRegistration } from '../../context/ArtistRegistrationContext';

const ArtistLoginScreen = ({ navigation }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loadProfileData } = useArtistRegistration();

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Error', 'Please enter both email/phone and password');
            return;
        }

        try {
            setIsLoading(true);
            const loginRes = await loginArtist(email.trim(), password);
            if (!loginRes?.token) {
                throw new Error('No authentication token received');
            }

            const profileData = await getArtistProfile();
            if (!profileData) {
                throw new Error('Failed to retrieve artist profile details');
            }

            // Check if profile is complete
            const hasProfile = profileData.profile && 
                               profileData.profile.profileImage && 
                               profileData.profile.gender && 
                               profileData.profile.bio && 
                               profileData.profile.location && 
                               profileData.profile.experience;

            const hasSpecializations = profileData.specializations && profileData.specializations.length > 0;
            const hasServices = profileData.services && profileData.services.length > 0;
            const hasPortfolio = profileData.portfolio && profileData.portfolio.length > 0;
            const hasPayment = profileData.payment && 
                              (profileData.payment.upiId || 
                               (profileData.payment.accountNumber && profileData.payment.ifscCode));

            const isComplete = hasProfile && hasSpecializations && hasServices && hasPortfolio && hasPayment;

            loadProfileData(profileData);

            navigation.reset({
                index: 0,
                routes: [{ name: isComplete ? 'ArtistHome' : 'ArtistRegistrationPending' }],
            });
        } catch (error) {
            console.error('Login error:', error);
            const msg = error?.response?.data?.message || error?.message || 'Login failed';
            Alert.alert('Login Failed', msg);
        } finally {
            setIsLoading(false);
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

            <Text style={styles.title}>
                Welcome Back!
            </Text>

            <Text style={styles.subtitle}>
                Sign in to continue
            </Text>

            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="Email or Phone"
                    placeholderTextColor="#C7AAA0"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputContainer}>

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#C7AAA0"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                />

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

            <TouchableOpacity>
                <Text style={styles.forgotPassword}>
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.signInButton, isLoading && { opacity: 0.7 }]} 
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <Text style={styles.signInText}>
                        Sign In
                    </Text>
                )}
            </TouchableOpacity>



            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                    Don't have an account?
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ArtistRegister1')}
                >
                    <Text style={styles.signupLink}>
                        Sign Up
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default ArtistLoginScreen;

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
import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const ClientLoginScreen = () => {
    return (
        <View style={styles.container}>

            <TouchableOpacity style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
                Welcome Back!
            </Text>

            <Text style={styles.subtitle}>
                Sign in to continue
            </Text>

            <TextInput
                placeholder="Email or Phone"
                style={styles.input}
            />

            <TextInput
                placeholder="Password"
                secureTextEntry
                style={styles.input}
            />

            <TouchableOpacity>
                <Text style={styles.forgotPassword}>
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInButton}>
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
                    <Text style={styles.socialText}>G</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.socialText}></Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Text style={styles.socialText}>f</Text>
                </TouchableOpacity>

            </View>

            <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                    Don't have an account?
                </Text>

                <TouchableOpacity>
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },

    backIcon: {
        fontSize: 24,
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },

    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
    },

    subtitle: {
        color: '#777',
        marginTop: 8,
        marginBottom: 30,
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
        width: 60,
        height: 60,
        borderRadius: 15,

        backgroundColor: '#FFFFFF',

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#EAEAEA',
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
import React from 'react';

import {
    View,
    Text,
    ImageBackground,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';

const OnboardingScreen = ({ navigation }) => {

    const handleGetStarted = () => {
        navigation.navigate('RoleSelection');
    };

    const handleSkip = () => {
        navigation.navigate('ClientHome');
    };

    return (
        <ImageBackground
            source={require('../../assets/images/model.jpeg')}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <Text style={styles.heading}>
                    Your Beauty,{'\n'}
                    Perfected by AI
                </Text>

                <Text style={styles.description}>
                    Discover professional makeup artists and get
                    personalized beauty recommendations powered by AI.
                </Text>

                <TouchableOpacity style={styles.primaryButton}
                    onPress={handleGetStarted}>
                    <Text style={styles.primaryButtonText}>
                        Get Started
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipText}>
                        Skip
                    </Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },

    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        paddingHorizontal: 24,
        paddingBottom: 80,
    },

    heading: {
        fontSize: 38,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'left',
        lineHeight: 46,
        width: '100%',
    },

    description: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'left',
        maxWidth: 300,
        marginTop: 12,
        marginBottom: 30,
    },

    primaryButton: {
        width: '90%',
        height: 56,

        backgroundColor: '#FF4F87',

        borderRadius: 16,

        justifyContent: 'center',
        alignItems: 'center',
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    skipText: {
        color: '#FFFFFF',
        marginTop: 20,
        fontSize: 16,
    },
});
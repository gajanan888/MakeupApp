import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {
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

            <Text style={styles.logo}>
                GlamAI
            </Text>

            <Text style={styles.heading}>
                How would you like{'\n'}
                to continue?
            </Text>

            <Text style={styles.subHeading}>
                Choose your role to get started
            </Text>

            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ClientLogin')}            >

                <Image
                    source={require('../../assets/images/client.png')}
                    style={styles.cardImage}
                />

                <View style={styles.cardContent}>

                    <View style={styles.titleRow}>

                        <Text style={styles.cardTitle}>
                            CLIENT
                        </Text>

                    </View>

                    <Text style={styles.cardDescription}>
                        Find and book professional makeup artists
                        for any occasion.
                    </Text>

                </View>

            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ArtistLogin')}            >

                <Image
                    source={require('../../assets/images/artist.png')}
                    style={styles.cardImage}
                />

                <View style={styles.cardContent}>

                    <View style={styles.titleRow}>

                        <Text style={styles.cardTitle}>
                            ARTIST
                        </Text>

                    </View>

                    <Text style={styles.cardDescription}>
                        Manage your bookings, showcase your work
                        and grow your beauty business.
                    </Text>

                </View>
            </TouchableOpacity>

        </View>
    );
};

export default RoleSelectionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 24,
        paddingTop: 50,
    },

    backButton: {
        marginTop: 10,
        marginBottom: 30,
        alignSelf: 'flex-start',
    },

    logo: {
        textAlign: 'center',
        fontSize: 30,
        fontWeight: '700',
        color: '#FF4F87',
        marginBottom: 20,
    },

    heading: {
        fontSize: 30,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 38,
    },

    subHeading: {
        textAlign: 'center',
        color: '#777',
        fontSize: 16,
        marginTop: 15,
        marginBottom: 35,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },

    cardTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FF4F87',
        marginBottom: 10,
    },

    cardDescription: {
        fontSize: 15,
        marginTop: 10,
        color: '#555',
        lineHeight: 22,
    },

    cardImage: {
        width: 115,
        height: 140,
        borderRadius: 18,
    },

    cardContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },

});
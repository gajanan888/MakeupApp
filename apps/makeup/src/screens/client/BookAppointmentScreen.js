import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

const BookAppointmentScreen = ({
    navigation,
    route,
}) => {

    const { artist } = route.params;

    const [selectedService, setSelectedService] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const services = artist.services && artist.services.length > 0
        ? artist.services.map(s => ({
            name: s.specialization,
            price: s.priceRange,
        }))
        : [
            {
                name: 'Bridal Makeup',
                price: '₹5,999',
            },
            {
                name: 'Engagement Makeup',
                price: '₹3,499',
            },
            {
                name: 'Party Makeup',
                price: '₹1,999',
            },
            {
                name: 'Photoshoot Makeup',
                price: '₹4,599',
            },
            {
                name: 'Airbrush Makeup',
                price: '₹4,299',
            },
        ];

    const handleNext = () => {

        if (!selectedService) {
            Alert.alert(
                'Select Service',
                'Please select a service'
            );
            return;
        }

        if (!selectedLocation) {
            Alert.alert(
                'Select Location',
                'Please select a location'
            );
            return;
        }

        navigation.navigate(
            'SelectDateTime',
            {
                artist,
                selectedService,
                selectedLocation,
            }
        );
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >

            <View style={styles.header}>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="chevron-back"
                        size={28}
                        color="#222"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Book Your Appointment
                </Text>

            </View>
            {/* Artist Card */}

            <View style={styles.artistCard}>

                {artist.image ? (
                    <Image
                        source={artist.image}
                        style={styles.artistImage}
                    />
                ) : (
                    <View style={[styles.artistImage, styles.artistImagePlaceholder]}>
                        <Ionicons name="person" size={24} color="#FF4F87" />
                    </View>
                )}

                <View style={styles.artistInfo}>

                    <Text style={styles.artistName}>
                        {artist.name}
                    </Text>

                    <Text style={styles.artistSpeciality}>
                        {artist.speciality || artist.specializations?.[0]?.name || 'Makeup Artist'}
                    </Text>

                    <Text style={styles.artistPrice}>
                        {artist.services?.[0]?.priceRange || 'Contact for Pricing'}
                    </Text>

                </View>

            </View>

            {/* Service Section */}

            <Text style={styles.sectionTitle}>
                Select Service
            </Text>

            {services.map((service) => (

                <TouchableOpacity
                    key={service.name}
                    style={styles.optionRow}
                    onPress={() =>
                        setSelectedService(service.name)
                    }
                >

                    <View style={styles.radioRow}>

                        <Ionicons
                            name={
                                selectedService === service.name
                                    ? 'radio-button-on'
                                    : 'radio-button-off'
                            }
                            size={20}
                            color="#FF4F87"
                        />

                        <Text style={styles.optionText}>
                            {service.name}
                        </Text>

                    </View>

                    <Text style={styles.priceText}>
                        {service.price}
                    </Text>

                </TouchableOpacity>

            ))}

            {/* Location */}

            <Text style={styles.sectionTitle}>
                Location
            </Text>

            <View style={styles.locationCard}>

                <TouchableOpacity
                    style={styles.locationRow}
                    onPress={() =>
                        setSelectedLocation('studio')
                    }
                >

                    <View style={styles.radioRow}>

                        <Ionicons
                            name={
                                selectedLocation === 'studio'
                                    ? 'radio-button-on'
                                    : 'radio-button-off'
                            }
                            size={20}
                            color="#FF4F87"
                        />

                        <View style={{ marginLeft: 10 }}>

                            <Text
                                style={[
                                    styles.optionText,
                                    selectedLocation === 'studio' &&
                                    styles.selectedLocationText,
                                ]}
                            >
                                At Artist Studio
                            </Text>

                            <Text style={styles.addressText}>
                                123 Beauty Street, Pune
                            </Text>

                        </View>

                    </View>

                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.locationRow}
                    onPress={() =>
                        setSelectedLocation('home')
                    }
                >

                    <View style={styles.radioRow}>

                        <Ionicons
                            name={
                                selectedLocation === 'home'
                                    ? 'radio-button-on'
                                    : 'radio-button-off'
                            }
                            size={20}
                            color="#FF4F87"
                        />

                        <Text
                            style={[
                                styles.optionText,
                                selectedLocation === 'home' &&
                                styles.selectedLocationText,
                            ]}
                        >
                            At Your Location
                        </Text>

                    </View>

                </TouchableOpacity>

            </View>

            {/* Next Button */}

            <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
            >
                <Text style={styles.nextButtonText}>
                    Next
                </Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

export default BookAppointmentScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 16,
        paddingTop: 45,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 18,
    },

    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111',

        marginLeft: 14,
    },

    artistCard: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',

        padding: 12,

        borderRadius: 14,

        marginBottom: 24,
    },

    artistImage: {
        width: 55,
        height: 55,

        borderRadius: 12,
    },

    artistImagePlaceholder: {
        backgroundColor: '#FFE6EF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    artistInfo: {
        marginLeft: 12,
    },

    artistName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    artistSpeciality: {
        fontSize: 12,
        color: '#777',
        marginTop: 3,
    },

    artistPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginTop: 6,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',

        marginBottom: 12,
        marginTop: 10,
    },

    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        paddingVertical: 10,

        borderBottomWidth: 1,
        borderBottomColor: '#F1F1F1',
    },

    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    optionText: {
        marginLeft: 10,

        fontSize: 14,
        color: '#333',
    },

    priceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
    },

    locationCard: {
        backgroundColor: '#FFFFFF',

        borderRadius: 14,

        paddingHorizontal: 14,
        paddingVertical: 4,
    },

    locationRow: {
        paddingVertical: 12,
    },

    addressText: {
        fontSize: 12,
        color: '#999',
        marginTop: 3,
    },

    selectedLocationText: {
        color: '#FF4F87',
        fontWeight: '600',
    },

    nextButton: {
        backgroundColor: '#FF4F87',

        height: 54,

        borderRadius: 14,

        justifyContent: 'center',
        alignItems: 'center',

        marginTop: 30,
        marginBottom: 30,
    },

    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

});
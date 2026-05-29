// PricingServicesScreen.js

import React, { useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

const ArtistRegisterScreen4 = ({ navigation }) => {
    const [services, setServices] = useState([
        {
            id: 1,
            specialization: '',
            duration: '',
            timeRange: '',
            priceRange: '',
        },
    ]);

    // ADD NEW SERVICE
    const addService = () => {
        const newService = {
            id: Date.now(),
            specialization: '',
            duration: '',
            timeRange: '',
            priceRange: '',
        };

        setServices([...services, newService]);
    };

    // UPDATE INPUTS
    const updateService = (
        id,
        field,
        value,
    ) => {
        const updated = services.map(service => {
            if (service.id === id) {
                return {
                    ...service,
                    [field]: value,
                };
            }

            return service;
        });

        setServices(updated);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                backgroundColor="#F7F7F7"
                barStyle="dark-content"
            />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingBottom: 50,
                    }}>
                    {/* HEADER BOX */}
                    <View style={styles.headerCard}>
                        <Text style={styles.headerText}>
                            <Text style={styles.pinkText}>
                                Good
                            </Text>{' '}
                            Pricing {'\n'}
                            <Text style={styles.pinkText}>
                                Large
                            </Text>{' '}
                            Profits
                        </Text>
                    </View>

                    {/* SERVICES */}
                    {services.map((service, index) => (
                        <View
                            key={service.id}
                            style={styles.serviceContainer}>
                            {/* LABEL */}
                            <Text style={styles.label}>
                                Specialization
                            </Text>

                            {/* SPECIALIZATION */}
                            <TextInput
                                placeholder="Bridal Makeup"
                                placeholderTextColor="#C7AAA0"
                                value={service.specialization}
                                onChangeText={text =>
                                    updateService(
                                        service.id,
                                        'specialization',
                                        text,
                                    )
                                }
                                style={styles.input}
                            />

                            {/* DURATION */}
                            <TextInput
                                placeholder="Duration of service"
                                placeholderTextColor="#C7AAA0"
                                value={service.duration}
                                onChangeText={text =>
                                    updateService(
                                        service.id,
                                        'duration',
                                        text,
                                    )
                                }
                                style={styles.input}
                            />

                            {/* TIME RANGE */}
                            <TextInput
                                placeholder="Enter Time Range"
                                placeholderTextColor="#C7AAA0"
                                value={service.timeRange}
                                onChangeText={text =>
                                    updateService(
                                        service.id,
                                        'timeRange',
                                        text,
                                    )
                                }
                                style={styles.input}
                            />

                            {/* PRICE RANGE */}
                            <TextInput
                                placeholder="Service Price Range"
                                placeholderTextColor="#C7AAA0"
                                value={service.priceRange}
                                onChangeText={text =>
                                    updateService(
                                        service.id,
                                        'priceRange',
                                        text,
                                    )
                                }
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                    ))}

                    {/* ADD SERVICE BUTTON */}
                    <TouchableOpacity
                        style={styles.addServiceButton}
                        onPress={addService}>
                        <View style={styles.plusCircle}>
                                <Ionicons
                                    name="add"
                                    size={20}
                                    color="#B7796C"
                                />
                        </View>

                        <Text style={styles.addServiceText}>
                            Add a Service
                        </Text>
                    </TouchableOpacity>

                    {/* SUBMIT BUTTON */}
                    <TouchableOpacity style={styles.button}
                        onPress={() => navigation.navigate('ArtistRegister5')}>
                        <Text style={styles.buttonText}>
                            Let’s Make-up Profile
                        </Text>

                        <Ionicons
                                name="arrow-forward"
                                size={22}
                                color="#FFF"
                                style={{ marginLeft: 8 }}
                            />
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ArtistRegisterScreen4;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },

    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },

    // HEADER

    headerCard: {
        backgroundColor: '#FFE4ED',
        borderRadius: 30,
        paddingVertical: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 28,
    },

    headerText: {
        fontSize: 24,
        color: '#111',
        textAlign: 'center',
        lineHeight: 36,
        fontWeight: '700',
    },

    pinkText: {
        color: '#FF4F8F',
    },

    // SERVICE CONTAINER

    serviceContainer: {
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 26,
        backgroundColor: '#FFF',
        paddingHorizontal: 18,
        paddingTop: 24,
        paddingBottom: 18,
        marginBottom: 28,
    },

    label: {
        position: 'absolute',
        top: -11,
        left: 20,
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 10,
        color: '#FF4F8F',
        fontSize: 13,
        fontWeight: '700',
        zIndex: 10,
    },

    input: {
        height: 56,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 18,
        backgroundColor: '#FFF',
        paddingHorizontal: 18,
        color: '#111',
        fontSize: 15,
        marginBottom: 14,
    },

    // ADD BUTTON

    addServiceButton: {
        height: 62,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 24,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },

    plusCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFE4ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    addServiceText: {
        color: '#B7796C',
        fontSize: 18,
        fontWeight: '500',
    },

    // MAIN BUTTON

    button: {
        height: 64,
        backgroundColor: '#FF4F8F',
        borderRadius: 32,
        marginTop: 38,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },

    buttonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
    },
});
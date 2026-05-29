// PortfolioUploadScreen.js

// INSTALL THESE:
//
// npm install react-native-image-picker
// npm install react-native-vector-icons

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
    Image,
    KeyboardAvoidingView,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

import {
    launchImageLibrary,
} from 'react-native-image-picker';

const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600';

const ArtistRegisterScreen5 = ({ navigation }) => {
    const [works, setWorks] = useState([
        {
            id: Date.now(),
            beforeImage: null,
            afterImage: null,
            tag: '',
            description: '',
        },
    ]);

    const pickImage = async (type, index) => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 1,
        });

        if (result.didCancel) {
            return;
        }

        if (result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setWorks(prev =>
                prev.map((item, idx) =>
                    idx === index
                        ? {
                              ...item,
                              [`${type}Image`]: imageUri,
                          }
                        : item,
                ),
            );
        }
    };

    const addWork = () => {
        setWorks(prev => [
            ...prev,
            {
                id: Date.now() + prev.length,
                beforeImage: null,
                afterImage: null,
                tag: '',
                description: '',
            },
        ]);
    };

    const updateWorkField = (index, field, value) => {
        setWorks(prev =>
            prev.map((item, idx) =>
                idx === index
                    ? {...item, [field]: value}
                    : item,
            ),
        );
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
                    {/* HEADER */}
                    <View style={styles.headerCard}>
                        <Text style={styles.headerText}>
                            Let’s{' '}
                            <Text style={styles.pinkText}>
                                Flaunt
                            </Text>
                            {'\n'}
                            Your Work{'\n'}
                            with{' '}
                            <Text style={styles.pinkText}>
                                World
                            </Text>
                        </Text>
                    </View>

                    {works.map((work, index) => (
                        <View key={work?.id ?? index} style={styles.workCard}>
                            <View style={styles.showcaseContainer}>
                                <TouchableOpacity
                                    style={styles.imageBox}
                                    onPress={() => pickImage('before', index)}>
                                    <Image
                                        source={{
                                            uri:
                                                work?.beforeImage ||
                                                PLACEHOLDER_IMAGE,
                                        }}
                                        style={styles.image}
                                    />
                                    {!work?.beforeImage && (
                                        <View style={styles.placeholderOverlay}>
                                            <Text style={styles.placeholderText}>
                                                Tap to add before image
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.imageLabel}>
                                        <Text style={styles.labelText}>
                                            BEFORE
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.imageBox}
                                    onPress={() => pickImage('after', index)}>
                                    <Image
                                        source={{
                                            uri:
                                                work?.afterImage ||
                                                PLACEHOLDER_IMAGE,
                                        }}
                                        style={styles.image}
                                    />
                                    {!work?.afterImage && (
                                        <View style={styles.placeholderOverlay}>
                                            <Text style={styles.placeholderText}>
                                                Tap to add after image
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.imageLabel}>
                                        <Text style={styles.labelText}>
                                            AFTER
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.centerTag}>
                                    <Text style={styles.centerTagText}>
                                        Example Images
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Add Tag</Text>
                                <TextInput
                                    placeholder="Bridal Makeup"
                                    placeholderTextColor="#C7AAA0"
                                    value={work?.tag ?? ''}
                                    onChangeText={text =>
                                        updateWorkField(
                                            index,
                                            'tag',
                                            text,
                                        )
                                    }
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    placeholder="Describe the transformation..."
                                    placeholderTextColor="#C7AAA0"
                                    value={work?.description ?? ''}
                                    onChangeText={text =>
                                        updateWorkField(
                                            index,
                                            'description',
                                            text,
                                        )
                                    }
                                    multiline
                                    style={[
                                        styles.input,
                                        styles.descriptionInput,
                                    ]}
                                />
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.addWorkButton}
                        onPress={addWork}>
                        <View style={styles.plusCircle}>
                            <Ionicons
                                name="add"
                                size={20}
                                color="#B7796C"
                            />
                        </View>
                        <Text style={styles.addWorkText}>
                            Add more Work
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button}
                        onPress={() => navigation.navigate('ArtistRegister6')}>
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

export default ArtistRegisterScreen5;

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
        marginBottom: 35,
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

    // SHOWCASE

    showcaseContainer: {
        height: 340,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#FFB5CC',
        borderRadius: 28,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
    },

    divider: {
        width: 1,
        backgroundColor: '#FFD1E1',
    },

    imageBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    imageLabel: {
        position: 'absolute',
        bottom: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderRadius: 16,
    },

    labelText: {
        color: '#111',
        fontWeight: '700',
        fontSize: 13,
    },

    centerTag: {
        position: 'absolute',
        top: 16,
        alignSelf: 'center',
        backgroundColor: '#FFE4ED',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 18,
    },

    centerTagText: {
        color: '#FF4F8F',
        fontWeight: '700',
        fontSize: 14,
    },

    // INPUTS

    inputGroup: {
        marginTop: 20,
    },

    label: {
        alignSelf: 'flex-start',
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 10,
        marginLeft: 18,
        marginBottom: -10,
        zIndex: 10,
        color: '#FF4F8F',
        fontSize: 14,
        fontWeight: '700',
    },

    input: {
        height: 58,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 22,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        color: '#111',
        fontSize: 15,
        marginBottom: 14,
    },

    descriptionInput: {
        height: 120,
        paddingTop: 18,
        textAlignVertical: 'top',
    },

    workCard: {
        marginBottom: 30,
    },

    placeholderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
        backgroundColor: 'rgba(0,0,0,0.24)',
    },

    placeholderText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    addWorkButton: {
        height: 62,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 24,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    addWorkText: {
        color: '#B7796C',
        fontSize: 18,
        fontWeight: '500',
    },

    // SUBMIT BUTTON

    button: {
        height: 64,
        backgroundColor: '#FF4F8F',
        borderRadius: 32,
        marginTop: 12,
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
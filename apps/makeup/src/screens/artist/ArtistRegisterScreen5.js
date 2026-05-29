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
    Modal,
    Pressable,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import {
    launchCamera,
    launchImageLibrary,
} from 'react-native-image-picker';


const ArtistRegisterScreen5 = ({ navigation }) => {
    const [beforeImage, setBeforeImage] =
        useState(null);

    const [afterImage, setAfterImage] =
        useState(null);

    const [selectedType, setSelectedType] =
        useState(null);

    const [modalVisible, setModalVisible] =
        useState(false);

    const [tag, setTag] = useState('');

    const [description, setDescription] =
        useState('');

    // OPEN IMAGE PICKER
    const openGallery = async () => {
        setModalVisible(false);

        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
            selectionLimit: 1,
        });

        if (result.didCancel) {
            return;
        }

        if (
            result.assets &&
            result.assets.length > 0
        ) {
            const imageUri = result.assets[0].uri;

            if (selectedType === 'before') {
                setBeforeImage(imageUri);
            } else {
                setAfterImage(imageUri);
            }
        }
    };

    // OPEN PICKER
    const chooseImage = type => {
        setSelectedType(type);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                backgroundColor="#F7F7F7"
                barStyle="dark-content"
            />

            <View style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
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

                    {/* IMAGE SHOWCASE */}
                    <View style={styles.showcaseContainer}>
                        {/* BEFORE */}
                        <TouchableOpacity
                            style={styles.imageBox}
                            onPress={() =>
                                chooseImage('before')
                            }>
                            {beforeImage ? (
                                <Image
                                    source={{ uri: beforeImage }}
                                    style={styles.image}
                                />
                            ) : (
                                <Image
                                    source={{
                                        uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=600',
                                    }}
                                    style={styles.image}
                                />
                            )}

                            <View style={styles.imageLabel}>
                                <Text style={styles.labelText}>
                                    BEFORE
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* DIVIDER */}
                        <View style={styles.divider} />

                        {/* AFTER */}
                        <TouchableOpacity
                            style={styles.imageBox}
                            onPress={() =>
                                chooseImage('after')
                            }>
                            {afterImage ? (
                                <Image
                                    source={{ uri: afterImage }}
                                    style={styles.image}
                                />
                            ) : (
                                <Image
                                    source={{
                                        uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600',
                                    }}
                                    style={styles.image}
                                />
                            )}

                            <View style={styles.imageLabel}>
                                <Text style={styles.labelText}>
                                    AFTER
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* CENTER TAG */}
                        <View style={styles.centerTag}>
                            <Text style={styles.centerTagText}>
                                Example Images
                            </Text>
                        </View>
                    </View>

                    {/* TAG INPUT */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Add Tag
                        </Text>

                        <TextInput
                            placeholder="Bridal Makeup"
                            placeholderTextColor="#C7AAA0"
                            value={tag}
                            onChangeText={setTag}
                            style={styles.input}
                        />
                    </View>

                    {/* DESCRIPTION */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Description
                        </Text>

                        <TextInput
                            placeholder="Describe the transformation..."
                            placeholderTextColor="#C7AAA0"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            style={[
                                styles.input,
                                styles.descriptionInput,
                            ]}
                        />
                    </View>

                    {/* CHOOSE FILE BUTTON */}
                    <TouchableOpacity
                        style={styles.chooseButton}
                        onPress={() =>
                            setModalVisible(true)
                        }>
                        <View style={styles.plusCircle}>
                            <Icon
                                name="plus"
                                size={20}
                                color="#B7796C"
                            />
                        </View>

                        <Text style={styles.chooseText}>
                            Choose a File
                        </Text>
                    </TouchableOpacity>

                    {/* SUBMIT BUTTON */}
                    <TouchableOpacity style={styles.button}
                        onPress={() => navigation.navigate('ArtistRegister6')}>
                        <Text style={styles.buttonText}>
                            Let’s Make-up Profile
                        </Text>

                        <Icon
                            name="arrow-right"
                            size={22}
                            color="#FFF"
                            style={{ marginLeft: 8 }}
                        />
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* BOTTOM MODAL */}
            <Modal
                transparent
                animationType="slide"
                visible={modalVisible}>
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() =>
                        setModalVisible(false)
                    }>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.sheetTitle}>
                            Choose Image
                        </Text>

                        {/* BEFORE IMAGE */}
                        <TouchableOpacity
                            style={styles.sheetButton}
                            onPress={() =>
                                chooseImage('before')
                            }>
                            <Text style={styles.sheetText}>
                                Upload Before Makeup
                            </Text>
                        </TouchableOpacity>

                        {/* AFTER IMAGE */}
                        <TouchableOpacity
                            style={styles.sheetButton}
                            onPress={() =>
                                chooseImage('after')
                            }>
                            <Text style={styles.sheetText}>
                                Upload After Makeup
                            </Text>
                        </TouchableOpacity>

                        {/* GALLERY */}
                        <TouchableOpacity
                            style={styles.galleryButton}
                            onPress={openGallery}>
                            <Icon
                                name="image"
                                size={20}
                                color="#FFF"
                            />

                            <Text style={styles.galleryText}>
                                Open Gallery
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
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
        marginTop: 28,
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
    },

    descriptionInput: {
        height: 120,
        paddingTop: 18,
        textAlignVertical: 'top',
    },

    // CHOOSE BUTTON

    chooseButton: {
        height: 62,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 24,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
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

    chooseText: {
        color: '#B7796C',
        fontSize: 18,
        fontWeight: '500',
    },

    // SUBMIT BUTTON

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

    // MODAL

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },

    bottomSheet: {
        backgroundColor: '#FFF',
        padding: 24,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },

    sheetTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        textAlign: 'center',
        marginBottom: 24,
    },

    sheetButton: {
        height: 58,
        borderWidth: 1.5,
        borderColor: '#FFD1E1',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    sheetText: {
        color: '#B7796C',
        fontSize: 17,
        fontWeight: '600',
    },

    galleryButton: {
        height: 58,
        backgroundColor: '#FF4F8F',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 10,
    },

    galleryText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
});
import React, { useState, useEffect } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getArtists } from '../../api/auth';

const ClientHomeScreen = ({ navigation }) => {
    const [customerName, setCustomerName] = useState('');
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationName, setLocationName] = useState('Detecting location...');
    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        let active = true;

        const requestLocationPermission = async () => {
            if (Platform.OS === 'ios') {
                return true;
            }
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'App needs access to your location to show it on your dashboard.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        };

        const fetchLocation = async () => {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                if (active) {
                    setLocationName('Permission Denied');
                    setLoadingLocation(false);
                }
                return;
            }

            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=60988df054524262b847818891916f3e`
                        );
                        const data = await response.json();
                        if (active) {
                            if (data && data.features && data.features.length > 0) {
                                const props = data.features[0].properties;
                                const city = props.city || props.county || props.state || '';
                                const suburb = props.suburb || props.district || props.neighbourhood || '';
                                let displayLoc = '';
                                if (suburb && city) {
                                    displayLoc = `${suburb}, ${city}`;
                                } else if (city) {
                                    displayLoc = city;
                                } else {
                                    displayLoc = props.formatted || 'Location detected';
                                }
                                setLocationName(displayLoc);
                            } else {
                                setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            }
                            setLoadingLocation(false);
                        }
                    } catch (error) {
                        console.error(error);
                        if (active) {
                            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            setLoadingLocation(false);
                        }
                    }
                },
                (error) => {
                    console.error(error);
                    if (active) {
                        setLocationName('Unavailable');
                        setLoadingLocation(false);
                    }
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        };

        fetchLocation();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        // Load customer name from storage
        AsyncStorage.getItem('customerName').then(name => {
            if (name) setCustomerName(name);
        });

        // Fetch artists from backend
        const fetchArtists = async () => {
            try {
                const data = await getArtists();
                const list = Array.isArray(data) ? data : [];
                setArtists(list);
            } catch (err) {
                console.warn('Failed to fetch artists:', err?.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArtists();
    }, []);
    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 100,
                }}
            >
                <View style={styles.container}>

                    {/* Header */}
                    <View style={styles.header}>

                        <View>
                            <Text style={styles.greeting}>
                                Hello, {customerName || 'there'} 👋
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                {loadingLocation ? (
                                    <ActivityIndicator size="small" color="#FF4F87" style={{ marginRight: 4, transform: [{ scale: 0.7 }] }} />
                                ) : (
                                    <Ionicons name="location-outline" size={14} color="#FF4F87" style={{ marginRight: 2 }} />
                                )}
                                <Text style={styles.subGreeting}>
                                    {locationName}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons
                                name="notifications-outline"
                                size={24}
                                color="#222"
                            />
                        </TouchableOpacity>

                    </View>

                    {/* Search */}
                    <View style={styles.searchContainer}>

                        <Ionicons
                            name="search-outline"
                            size={22}
                            color="#999"
                        />

                        <TextInput
                            placeholder="Search makeup artists, services..."
                            placeholderTextColor="#999"
                            style={styles.searchInput}
                        />

                        <TouchableOpacity>
                            <Ionicons
                                name="options-outline"
                                size={22}
                                color="#999"
                            />
                        </TouchableOpacity>

                    </View>

                    <View style={styles.aiCard}>

                        <View style={styles.aiContent}>

                            <Text style={styles.aiTitle}>
                                AI Match
                            </Text>

                            <Text style={styles.aiDescription}>
                                Find your perfect makeup artist with AI recommendations
                            </Text>

                            <TouchableOpacity
                                style={styles.tryNowButton}
                                onPress={() => navigation.navigate('AIMatch')}
                            >
                                <Text style={styles.tryNowText}>
                                    Try Now
                                </Text>
                            </TouchableOpacity>


                        </View>

                        <Image
                            source={require('../../assets/images/artist1.jpeg')}
                            style={styles.aiImage}
                        />

                    </View>

                    {/* Categories */}

                    <View style={styles.categoriesSection}>
                        <View style={styles.sectionHeaderSimple}>
                            <Text style={styles.sectionTitle}>
                                Categories
                            </Text>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesContainer}
                        >

                            <TouchableOpacity style={styles.categoryCard}>
                                <Ionicons
                                    name="person-outline"
                                    size={32}
                                    color="#FF4F87"
                                />
                                <Text style={styles.categoryText}>Bridal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.categoryCard}>
                                <Ionicons
                                    name="sparkles-outline"
                                    size={32}
                                    color="#FF4F87"
                                />
                                <Text style={styles.categoryText}>Party</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.categoryCard}>
                                <Ionicons
                                    name="diamond-outline"
                                    size={32}
                                    color="#FF4F87"
                                />
                                <Text style={styles.categoryText}>Engagement</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.categoryCard}>
                                <Ionicons
                                    name="camera-outline"
                                    size={32}
                                    color="#FF4F87"
                                />
                                <Text style={styles.categoryText}>Photoshoot</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.categoryCard}>
                                <Ionicons
                                    name="color-palette-outline"
                                    size={32}
                                    color="#FF4F87"
                                />
                                <Text style={styles.categoryText}>Creative</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>

                    {/* Trending Artists from Backend */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Trending Makeup Artists
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#FF4F87" size="large" style={{ marginVertical: 20 }} />
                    ) : artists.length === 0 ? (
                        <Text style={{ color: '#999', textAlign: 'center', marginVertical: 20 }}>
                            No artists found yet.
                        </Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {artists.map((artist) => (
                                <TouchableOpacity
                                    key={artist.id}
                                    style={styles.artistCard}
                                    onPress={() => navigation.navigate('ArtistDetails', { artist })}
                                >
                                    <View style={styles.artistImagePlaceholder}>
                                        {artist.profile?.profileImage ? (
                                            <Image
                                                source={{ uri: artist.profile.profileImage }}
                                                style={styles.artistProfileImage}
                                            />
                                        ) : (
                                            <View style={styles.artistInitialsCircle}>
                                                <Text style={styles.artistInitialsText}>
                                                    {artist.name?.charAt(0)?.toUpperCase() || 'A'}
                                                </Text>
                                            </View>
                                        )}
                                        {/* Gradient overlay */}
                                        <View style={styles.imageGradientOverlay} />
                                    </View>
                                    {/* Rating badge */}
                                    <View style={styles.ratingBadge}>
                                        <Ionicons name="star" size={12} color="#FFB800" />
                                        <Text style={styles.ratingBadgeText}>
                                            {artist.profile?.experience ? `${artist.profile.experience}` : '4.5'}
                                        </Text>
                                    </View>
                                    {/* Heart button */}
                                    <TouchableOpacity style={styles.favoriteButton}>
                                        <Ionicons name="heart-outline" size={20} color="#FF4F87" />
                                    </TouchableOpacity>
                                    <View style={styles.artistInfo}>
                                        <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
                                        <View style={styles.locationRow}>
                                            <Ionicons name="location-outline" size={13} color="#999" />
                                            <Text style={styles.artistLocation} numberOfLines={1}>
                                                {artist.profile?.location || 'India'}
                                            </Text>
                                        </View>
                                        <View style={styles.specialistChip}>
                                            <Text style={styles.specialistChipText}>
                                                {artist.specializations?.[0]?.name || 'Makeup Artist'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Popular Artists */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Popular Near You
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {!loading && artists.slice(0, 5).map((artist) => (
                        <TouchableOpacity
                            key={artist.id}
                            style={styles.popularCard}
                            onPress={() => navigation.navigate('ArtistDetails', { artist })}
                        >
                            <View style={styles.popularImage}>
                                {artist.profile?.profileImage ? (
                                    <Image
                                        source={{ uri: artist.profile.profileImage }}
                                        style={styles.popularProfileImage}
                                    />
                                ) : (
                                    <Text style={styles.popularInitials}>
                                        {artist.name?.charAt(0)?.toUpperCase() || 'A'}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.popularInfo}>
                                <Text style={styles.popularName} numberOfLines={1}>{artist.name}</Text>
                                <View style={styles.popularSpecChipRow}>
                                    <View style={styles.popularSpecChip}>
                                        <Text style={styles.popularSpecChipText}>
                                            {artist.specializations?.[0]?.name || 'Makeup Artist'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.popularMetaRow}>
                                    <Ionicons name="location-outline" size={12} color="#999" />
                                    <Text style={styles.popularLocationText} numberOfLines={1}>
                                        {artist.profile?.location || 'India'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.popularRatingBox}>
                                <Ionicons name="star" size={14} color="#FFB800" />
                                <Text style={styles.popularRatingText}>
                                    {artist.profile?.experience || '4.5'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Bottom Navigation */}


                </View>
            </ScrollView>
            <BottomNavigation
                navigation={navigation}
                activeTab="Home"
            />
        </View>

    );
};

export default ClientHomeScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FAFAFA',
        padding: 20,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },

    greeting: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
    },

    subGreeting: {
        fontSize: 14,
        color: '#777',
        fontWeight: '500',
    },

    notificationButton: {
        padding: 6,
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 56,
        marginBottom: 8,
    },

    searchInput: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 15,
        color: '#222',
    },

    aiCard: {
        flexDirection: 'row',
        backgroundColor: '#B76E79',
        borderRadius: 24,
        padding: 18,
        marginBottom: 24,
        alignItems: 'center',
        overflow: 'hidden',
    },

    aiContent: {
        flex: 1,
    },

    aiTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '800',
    },

    aiDescription: {
        color: '#FCEEF1',
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
    },

    tryNowButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FF4F87',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 16,
    },

    tryNowText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    aiImage: {
        width: 110,
        height: 110,
        borderRadius: 16,
        marginLeft: 12,
    },

    sectionHeaderSimple: {
        marginBottom: 14,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
    },

    categoriesContainer: {
        paddingBottom: 10,
    },

    categoriesSection: {
        marginBottom: 10,
    },

    categoryCard: {
        width: 90,
        height: 90,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#F1F1F1',
        elevation: 2,
    },

    categoryEmoji: {
        fontSize: 24,
    },

    categoryText: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 14,
    },

    seeAllText: {
        color: '#FF4F87',
        fontWeight: '600',
    },

    artistCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#FF4F87',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        width: 220,
        marginRight: 16,
    },

    artistImagePlaceholder: {
        height: 200,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    artistProfileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    artistInitialsCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFE6EF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    artistInitialsText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF4F87',
    },

    imageGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },

    ratingBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
    },

    ratingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },

    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },

    artistInfo: {
        padding: 14,
    },

    artistName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },

    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 2,
    },

    artistLocation: {
        fontSize: 12,
        color: '#999',
        marginLeft: 2,
    },

    specialistChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF0F5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginTop: 8,
    },

    specialistChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FF4F87',
    },

    placeholderText: {
        color: '#999',
    },

    artistImage: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
    },

    popularCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F2F2F2',
        elevation: 2,
    },

    popularImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#FFE6EF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    popularProfileImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
        resizeMode: 'cover',
    },

    popularInitials: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FF4F87',
    },

    popularInfo: {
        flex: 1,
        marginLeft: 14,
    },

    popularName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    popularSpecChipRow: {
        flexDirection: 'row',
        marginTop: 4,
    },

    popularSpecChip: {
        backgroundColor: '#FFF0F5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },

    popularSpecChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FF4F87',
    },

    popularMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 2,
    },

    popularLocationText: {
        fontSize: 12,
        color: '#999',
        marginLeft: 2,
    },

    popularRatingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBF0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 3,
    },

    popularRatingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },

    bottomNav: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F1F1',
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
    },

    navText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },

    activeNavText: {
        fontSize: 12,
        color: '#FF4F87',
        marginTop: 4,
        fontWeight: '600',
    },
});
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';

const ClientHomeScreen = () => {
    const featuredArtists = [
        {
            id: 1,
            name: 'Priya Makeup Studio',
            role: 'Bridal Specialist',
            rating: '4.9',
            price: '₹2,999',
            image: require('../../assets/images/artist1.jpeg'),
        },
        {
            id: 2,
            name: 'Ananya Beauty',
            role: 'Party Makeup Artist',
            rating: '4.8',
            price: '₹2,499',
            image: require('../../assets/images/artist1.jpeg'),
        },
        {
            id: 3,
            name: 'Riya Makeovers',
            role: 'HD Makeup Expert',
            rating: '4.9',
            price: '₹3,499',
            image: require('../../assets/images/artist1.jpeg'),
        },
    ];

    const popularArtists = [
        {
            id: 1,
            name: 'Sophia Makeup Studio',
            speciality: 'Bridal Specialist',
            rating: '4.9',
            price: '₹2,500',
        },
        {
            id: 2,
            name: 'Ananya Beauty',
            speciality: 'Party Makeup',
            rating: '4.8',
            price: '₹1,999',
        },
        {
            id: 3,
            name: 'Riya Makeovers',
            speciality: 'HD Makeup Expert',
            rating: '4.9',
            price: '₹3,000',
        },
    ];
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
                                Hello, Tanuja! 👋
                            </Text>

                            <Text style={styles.subGreeting}>
                                What are we doing today?
                            </Text>
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

                            <TouchableOpacity style={styles.tryNowButton}>
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
                        <View style={styles.sectionHeader}>
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

                    {/* Featured Artists */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Trending Makeup Artists
                        </Text>

                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        {featuredArtists.map((artist) => (
                            <View
                                key={artist.id}
                                style={styles.artistCard}
                            >
                                <View>

                                    <Image
                                        source={artist.image}
                                        style={styles.artistImage}
                                    />

                                    <TouchableOpacity style={styles.favoriteButton}>
                                        <Ionicons
                                            name="heart-outline"
                                            size={22}
                                            color="#FF4F87"
                                        />
                                    </TouchableOpacity>

                                </View>

                                <View style={styles.artistInfo}>

                                    <Text style={styles.artistName}>
                                        {artist.name}
                                    </Text>

                                    <Text style={styles.artistLocation}>
                                        Pune • {artist.rating} ★
                                    </Text>

                                    <Text style={styles.artistSpeciality}>
                                        {artist.role}
                                    </Text>

                                    <Text style={styles.artistPrice}>
                                        From {artist.price}
                                    </Text>

                                </View>

                            </View>
                        ))}
                    </ScrollView>

                    {/* Popular Artists */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            Popular Near You
                        </Text>

                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>
                                See All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {popularArtists.map((artist) => (
                        <TouchableOpacity
                            key={artist.id}
                            style={styles.popularCard}
                        >

                            <View style={styles.popularImage}>
                                <Ionicons
                                    name="person"
                                    size={30}
                                    color="#FF4F87"
                                />
                            </View>

                            <View style={styles.popularInfo}>

                                <Text style={styles.popularName}>
                                    {artist.name}
                                </Text>

                                <Text style={styles.popularSpeciality}>
                                    {artist.speciality}
                                </Text>

                                <Text style={styles.popularRating}>
                                    ⭐ {artist.rating}
                                </Text>

                            </View>

                            <Text style={styles.popularPrice}>
                                {artist.price}
                            </Text>

                        </TouchableOpacity>
                    ))}

                    {/* Bottom Navigation */}


                </View>
            </ScrollView>
            <View style={styles.bottomNav}>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons
                        name="home"
                        size={24}
                        color="#FF4F87"
                    />
                    <Text style={styles.activeNavText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons
                        name="search-outline"
                        size={24}
                        color="#999"
                    />
                    <Text style={styles.navText}>Search</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons
                        name="calendar-outline"
                        size={24}
                        color="#999"
                    />
                    <Text style={styles.navText}>Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={24}
                        color="#999"
                    />
                    <Text style={styles.navText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <Ionicons
                        name="person-outline"
                        size={24}
                        color="#999"
                    />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>

            </View>
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
        fontSize: 15,
        color: '#777',
        marginTop: 4,
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

    sectionHeader: {
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
        borderWidth: 1,
        borderColor: '#F2F2F2',
        marginBottom: 20,
        elevation: 2,
        width: 260,
        marginRight: 16,
    },

    artistImagePlaceholder: {
        height: 180,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },

    placeholderText: {
        color: '#999',
    },

    artistImage: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
    },

    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    artistInfo: {
        padding: 16,
    },

    artistName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
    },

    artistPrice: {
        marginTop: 8,
        color: '#FF4F87',
        fontWeight: '700',
        fontSize: 16,
    },

    artistLocation: {
        marginTop: 6,
        color: '#666',
    },

    artistSpeciality: {
        marginTop: 8,
        color: '#888',
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
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFE6EF',
        justifyContent: 'center',
        alignItems: 'center',
    },

    popularInfo: {
        flex: 1,
        marginLeft: 14,
    },

    popularName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },

    popularSpeciality: {
        marginTop: 4,
        color: '#777',
    },

    popularRating: {
        marginTop: 6,
        color: '#666',
    },

    popularPrice: {
        color: '#FF4F87',
        fontWeight: '700',
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
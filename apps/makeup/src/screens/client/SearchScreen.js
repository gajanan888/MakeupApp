import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import BottomNavigation from '../../components/BottomNavigation';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';

const SearchScreen = ({ navigation }) => {

    const [searchText, setSearchText] = useState('');
    const [favorites, setFavorites] = useState([]);

    const artists = [
        {
            id: 1,
            name: 'Sophia Makeup Studio',
            location: 'Pune',
            rating: 4.9,
            speciality: 'Bridal Specialist',
            price: '₹2,999',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 2,
            name: 'Ananya Beauty',
            location: 'Mumbai',
            rating: 4.8,
            speciality: 'Party Makeup',
            price: '₹1,999',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 3,
            name: 'Riya Makeovers',
            location: 'Delhi',
            rating: 4.7,
            speciality: 'HD Makeup Expert',
            price: '₹3,499',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 4,
            name: 'Glow By Mehak',
            location: 'Pune',
            rating: 4.8,
            speciality: 'Airbrush Makeup',
            price: '₹4,299',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 5,
            name: 'Lavish Looks',
            location: 'Mumbai',
            rating: 4.6,
            speciality: 'Engagement Makeup',
            price: '₹2,499',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 6,
            name: 'Blush Studio',
            location: 'Bangalore',
            rating: 4.9,
            speciality: 'Celebrity Makeup',
            price: '₹5,999',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 7,
            name: 'Makeup By Ayesha',
            location: 'Hyderabad',
            rating: 4.7,
            speciality: 'Reception Makeup',
            price: '₹3,299',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 8,
            name: 'Elite Beauty Lounge',
            location: 'Pune',
            rating: 4.8,
            speciality: 'Photoshoot Makeup',
            price: '₹4,599',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 9,
            name: 'Noor Makeovers',
            location: 'Delhi',
            rating: 4.9,
            speciality: 'Traditional Bridal',
            price: '₹6,499',
            image: require('../../assets/images/artist1.jpeg'),
        },

        {
            id: 10,
            name: 'Beauty Canvas',
            location: 'Chennai',
            rating: 4.6,
            speciality: 'Minimal Makeup',
            price: '₹2,199',
            image: require('../../assets/images/artist1.jpeg'),
        },
    ];

    const toggleFavorite = (artistId) => {

        if (favorites.includes(artistId)) {
            setFavorites(
                favorites.filter(id => id !== artistId)
            );
        } else {
            setFavorites([...favorites, artistId]);
        }

    };

    return (
        <View style={styles.container}>

            {/* Header */}

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
                    Search
                </Text>

            </View>

            {/* Search Bar */}

            <View style={styles.searchWrapper}>

                <View style={styles.searchContainer}>

                    <Ionicons
                        name="search-outline"
                        size={20}
                        color="#999"
                    />

                    <TextInput
                        placeholder="Search artists, services..."
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                    />

                </View>

                <TouchableOpacity style={styles.filterButton}>

                    <Ionicons
                        name="options-outline"
                        size={20}
                        color="#444"
                    />

                </TouchableOpacity>

            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                {/* Filter Chips */}

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >

                    <TouchableOpacity style={styles.activeChip}>
                        <Text style={styles.activeChipText}>
                            All
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>
                            Bridal
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>
                            Party
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>
                            HD Makeup
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.chip}>
                        <Text style={styles.chipText}>
                            Photoshoot
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
                <View style={styles.artistSection}>

                    {artists.map((artist) => (

                        <TouchableOpacity
                            key={artist.id}
                            style={styles.artistCard}
                        >

                            <Image
                                source={artist.image}
                                style={styles.artistImage}
                            />

                            <View style={styles.artistInfo}>

                                <View style={styles.topRow}>

                                    <Text style={styles.artistName}>
                                        {artist.name}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => toggleFavorite(artist.id)}
                                    >
                                        <Ionicons
                                            name={
                                                favorites.includes(artist.id)
                                                    ? 'heart'
                                                    : 'heart-outline'
                                            }
                                            size={22}
                                            color={
                                                favorites.includes(artist.id)
                                                    ? '#FF4F87'
                                                    : '#999'
                                            }
                                        />
                                    </TouchableOpacity>

                                </View>

                                <Text style={styles.artistSpeciality}>
                                    {artist.speciality}
                                </Text>

                                <View style={styles.ratingRow}>

                                    <Ionicons
                                        name="star"
                                        size={14}
                                        color="#F5B301"
                                    />

                                    <Text style={styles.ratingText}>
                                        {artist.rating}
                                    </Text>

                                    <Text style={styles.distanceText}>
                                        • 5 km
                                    </Text>

                                </View>

                                <Text style={styles.artistPrice}>
                                    From {artist.price}
                                </Text>

                            </View>



                        </TouchableOpacity>

                    ))}

                </View>
            </ScrollView>
            <BottomNavigation
                navigation={navigation}
                activeTab="Search"
            />
        </View>
    );
};

export default SearchScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
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

    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 12,
    },

    filterButton: {
        width: 52,
        height: 48,

        borderRadius: 18,

        backgroundColor: '#FFFFFF',

        justifyContent: 'center',
        alignItems: 'center',

        marginLeft: 12,

        borderWidth: 1,
        borderColor: '#ECECEC',
    },

    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',


        borderRadius: 18,

        paddingHorizontal: 12,

        height: 48,

        borderWidth: 1,
        borderColor: '#ECECEC',
    },

    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },

    searchInput: {
        flex: 1,
        marginLeft: 10,

        fontSize: 14,
        color: '#222',
    },

    filterContainer: {
        paddingLeft: 12,
        paddingRight: 10,
        marginTop: 22,
    },

    activeChip: {
        backgroundColor: '#FF4F87',

        paddingHorizontal: 14,
        height: 34,

        borderRadius: 17,

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 12,
    },

    chip: {
        backgroundColor: '#FFFFFF',

        paddingHorizontal: 14,
        height: 34,

        borderRadius: 21,

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 12,

        borderWidth: 1,
        borderColor: '#ECECEC',
    },

    chipText: {
        color: '#444',
        fontWeight: '600',
        fontSize: 14,
    },
    artistSection: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 120,
    },

    artistCard: {
        flexDirection: 'row',

        alignItems: 'center',
        justifyContent: 'space-between',

        backgroundColor: '#FFFFFF',

        borderRadius: 18,

        padding: 10,

        marginBottom: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 4,

        elevation: 2,
    },

    artistImage: {
        width: 82,
        height: 100,

        borderRadius: 16,
    },

    artistInfo: {
        flex: 1,
        marginLeft: 10,
    },

    artistName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },

    artistSpeciality: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },

    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',

        marginTop: 8,
    },

    ratingText: {
        fontSize: 13,
        color: '#444',
        marginLeft: 4,
    },

    distanceText: {
        fontSize: 13,
        color: '#999',
        marginLeft: 6,
    },

    artistPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginTop: 6,
    },
});
import React from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import Ionicons from '@react-native-vector-icons/ionicons';

const BottomNavigation = ({
    navigation,
    activeTab,
}) => {

    return (

        <View style={styles.bottomNav}>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    navigation.navigate('ClientHome')
                }
            >
                <Ionicons
                    name={
                        activeTab === 'Home'
                            ? 'home'
                            : 'home-outline'
                    }
                    size={24}
                    color={
                        activeTab === 'Home'
                            ? '#FF4F87'
                            : '#999'
                    }
                />

                <Text
                    style={
                        activeTab === 'Home'
                            ? styles.activeNavText
                            : styles.navText
                    }
                >
                    Home
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={() =>
                    navigation.navigate('Search')
                }
            >
                <Ionicons
                    name={
                        activeTab === 'Search'
                            ? 'search'
                            : 'search-outline'
                    }
                    size={24}
                    color={
                        activeTab === 'Search'
                            ? '#FF4F87'
                            : '#999'
                    }
                />

                <Text
                    style={
                        activeTab === 'Search'
                            ? styles.activeNavText
                            : styles.navText
                    }
                >
                    Search
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
                <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#999"
                />

                <Text style={styles.navText}>
                    Bookings
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color="#999"
                />

                <Text style={styles.navText}>
                    Chat
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
                <Ionicons
                    name="person-outline"
                    size={24}
                    color="#999"
                />

                <Text style={styles.navText}>
                    Profile
                </Text>
            </TouchableOpacity>

        </View>

    );
};

export default BottomNavigation;

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',

        left: 0,
        right: 0,
        bottom: 0,

        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',

        paddingTop: 12,
        paddingBottom: 18,

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
        fontWeight: '700',
    },
});
import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'


const ArtistOTPVerificationScreen = ({ navigation }) => {
    return (
        <View>
            <Text>ArtistOTPVerificationScreen</Text>
            <Button
                title="Go to Details"
                onPress={() => navigation.navigate('ArtistRegister2')}
            />
        </View>
    )
}

export default ArtistOTPVerificationScreen

const styles = StyleSheet.create({})
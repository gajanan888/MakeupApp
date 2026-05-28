// ArtistSpecializationScreen.js

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StatusBar,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

const SPECIALIZATIONS = [
  'Bridal',
  'Party',
  'Fashion',
  'Photoshoot',
  'HD MakeUp',
  'Others',
];

const ArtistSpecializationScreen = () => {
  const [selectedSpecializations, setSelectedSpecializations] =
    useState([]);

  const toggleSpecialization = item => {
    if (selectedSpecializations.includes(item)) {
      setSelectedSpecializations(
        selectedSpecializations.filter(i => i !== item),
      );
    } else {
      setSelectedSpecializations([
        ...selectedSpecializations,
        item,
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#F7F7F7"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 40}}>
        {/* PROFILE IMAGE */}
        <View style={styles.imageSection}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
            }}
            style={styles.profileImage}
          />
        </View>

        {/* TITLE */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            Hey Mona{'\n'}
            Let’s Make you a Professional
          </Text>
        </View>

        {/* SPECIALIZATION INPUT */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Specialization
          </Text>

          <View style={styles.selectedBox}>
            {selectedSpecializations.length === 0 ? (
              <Text style={styles.placeholder}>
                Select your Specializations from below
              </Text>
            ) : (
              <View style={styles.selectedContainer}>
                {selectedSpecializations.map((item, index) => (
                  <View
                    key={index}
                    style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>
                      {item}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        toggleSpecialization(item)
                      }>
                      <Icon
                        name="x"
                        size={14}
                        color="#FF4F8F"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* OPTIONS */}
        <View style={styles.optionContainer}>
          {SPECIALIZATIONS.map((item, index) => {
            const isSelected =
              selectedSpecializations.includes(item);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected &&
                    styles.selectedOptionButton,
                ]}
                onPress={() =>
                  toggleSpecialization(item)
                }>
                <Icon
                  name={
                    isSelected ? 'check' : 'plus'
                  }
                  size={14}
                  color={
                    isSelected
                      ? '#FFF'
                      : '#FF4F8F'
                  }
                />

                <Text
                  style={[
                    styles.optionText,
                    isSelected &&
                      styles.selectedOptionText,
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CERTIFICATE */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Certificates
          </Text>

          <TouchableOpacity style={styles.uploadBox}>
            <Text style={styles.placeholder}>
              Add a file
            </Text>

            <Icon
              name="plus"
              size={20}
              color="#FF4F8F"
            />
          </TouchableOpacity>
        </View>

        {/* CERTIFICATE NUMBER */}
        <TextInput
          placeholder="Certificate Number"
          placeholderTextColor="#C7AAA0"
          style={styles.input}
        />

        {/* INSTITUTE */}
        <TextInput
          placeholder="Institute Name"
          placeholderTextColor="#C7AAA0"
          style={styles.input}
        />

        {/* SECOND CERTIFICATE */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Certificates
          </Text>

          <TouchableOpacity style={styles.uploadBox}>
            <Text style={styles.placeholder}>
              Add a file
            </Text>

            <Icon
              name="plus"
              size={20}
              color="#FF4F8F"
            />
          </TouchableOpacity>
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Let’s Make-up Profile
          </Text>

          <Icon
            name="arrow-right"
            size={22}
            color="#FFF"
            style={{marginLeft: 8}}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArtistSpecializationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 24,
  },

  imageSection: {
    alignItems: 'center',
    marginTop: 30,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#FFD1E1',
  },

  titleContainer: {
    marginTop: 20,
    backgroundColor: '#FFE4ED',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    color: '#111',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'serif',
  },

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
    fontFamily: 'serif',
  },

  selectedBox: {
    minHeight: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },

  placeholder: {
    color: '#C7AAA0',
    fontSize: 15,
    fontFamily: 'serif',
  },

  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  selectedChipText: {
    color: '#FF4F8F',
    marginRight: 6,
    fontWeight: '600',
    fontSize: 14,
  },

  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 14,
  },

  selectedOptionButton: {
    backgroundColor: '#FF4F8F',
  },

  optionText: {
    marginLeft: 6,
    color: '#C58B9C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'serif',
  },

  selectedOptionText: {
    color: '#FFF',
  },

  uploadBox: {
    height: 62,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    marginTop: 18,
    color: '#111',
    fontSize: 15,
    fontFamily: 'serif',
  },

  button: {
    height: 64,
    backgroundColor: '#FF4F8F',
    borderRadius: 32,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'serif',
  },
});
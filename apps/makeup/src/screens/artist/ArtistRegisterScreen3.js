// IMPORTANT FIXES DONE:
//
// 1. SafeArea + StatusBar overlap fixed
// 2. Added many makeup specialization options
// 3. "Others" now opens custom input
// 4. Icons visibility fixed
// 5. Better responsive spacing
// 6. Better chip system
// 7. Better selected specialization UI

// INSTALL ICONS IF NOT INSTALLED:
//
// npm install react-native-vector-icons
//
// Then:
//
// npx react-native-asset

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
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

const SPECIALIZATIONS = [
  'Bridal',
  'Party Makeup',
  'HD Makeup',
  'Fashion Makeup',
  'Editorial',
  'Airbrush',
  'Engagement',
  'Reception',
  'Haldi',
  'Sangeet',
  'Photoshoot',
  'Celebrity',
  'Matte Makeup',
  'Glam Makeup',
  'Natural Look',
  'Traditional',
  'Runway',
  'Others',
];

const ArtistRegisterScreen3 = ({ navigation }) => {
  const [selectedSpecializations, setSelectedSpecializations] =
    useState([]);

  const [showOtherInput, setShowOtherInput] =
    useState(false);

  const [otherSpecialization, setOtherSpecialization] =
    useState('');

  const toggleSpecialization = item => {
    if (item === 'Others') {
      setShowOtherInput(true);
      return;
    }

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

  const addOtherSpecialization = () => {
    if (
      otherSpecialization.trim() &&
      !selectedSpecializations.includes(
        otherSpecialization,
      )
    ) {
      setSelectedSpecializations([
        ...selectedSpecializations,
        otherSpecialization,
      ]);

      setOtherSpecialization('');
      setShowOtherInput(false);
    }
  };

  const removeSpecialization = item => {
    setSelectedSpecializations(
      selectedSpecializations.filter(i => i !== item),
    );
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

          {/* SPECIALIZATION */}
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
                  {selectedSpecializations.map(
                    (item, index) => (
                      <View
                        key={index}
                        style={styles.selectedChip}>
                        <Text
                          style={
                            styles.selectedChipText
                          }>
                          {item}
                        </Text>

                        <TouchableOpacity
                          onPress={() =>
                            removeSpecialization(
                              item,
                            )
                          }>
                          <Icon
                            name="x"
                            size={16}
                            color="#FF4F8F"
                          />
                        </TouchableOpacity>
                      </View>
                    ),
                  )}
                </View>
              )}
            </View>
          </View>

          {/* OTHER INPUT */}
          {showOtherInput && (
            <View style={styles.otherInputContainer}>
              <TextInput
                value={otherSpecialization}
                onChangeText={
                  setOtherSpecialization
                }
                placeholder="Enter your specialization"
                placeholderTextColor="#C7AAA0"
                style={styles.otherInput}
              />

              <TouchableOpacity
                style={styles.addOtherButton}
                onPress={addOtherSpecialization}>
                <Icon
                  name="plus"
                  size={18}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* SPECIALIZATION OPTIONS */}
          <View style={styles.optionContainer}>
            {SPECIALIZATIONS.map(
              (item, index) => {
                const isSelected =
                  selectedSpecializations.includes(
                    item,
                  );

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected &&
                        styles.selectedOptionButton,
                    ]}
                    onPress={() =>
                      toggleSpecialization(
                        item,
                      )
                    }>
                    <Icon
                      name={
                        isSelected
                          ? 'check'
                          : 'plus'
                      }
                      size={15}
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
              },
            )}
          </View>

          {/* CERTIFICATE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Certificates
            </Text>

            <TouchableOpacity
              style={styles.uploadBox}>
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

          {/* INSTITUTE NAME */}
          <TextInput
            placeholder="Institute Name"
            placeholderTextColor="#C7AAA0"
            style={styles.input}
          />

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ArtistRegister4')}>
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
      </View>
    </SafeAreaView>
  );
};

export default ArtistRegisterScreen3;

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

  imageSection: {
    alignItems: 'center',
    marginTop: 20,
  },

  profileImage: {
    width: 115,
    height: 115,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FFD1E1',
  },

  titleContainer: {
    marginTop: 22,
    backgroundColor: '#FFE4ED',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    color: '#111',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '700',
  },

  inputGroup: {
    marginTop: 30,
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

  selectedBox: {
    minHeight: 70,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  placeholder: {
    color: '#C7AAA0',
    fontSize: 15,
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
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD1E1',
  },

  selectedChipText: {
    color: '#FF4F8F',
    marginRight: 6,
    fontSize: 14,
    fontWeight: '600',
  },

  otherInputContainer: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'center',
  },

  otherInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    color: '#111',
    fontSize: 15,
  },

  addOtherButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FF4F8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 24,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  },

  selectedOptionText: {
    color: '#FFF',
  },

  uploadBox: {
    height: 64,
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
    height: 60,
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 22,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    marginTop: 18,
    color: '#111',
    fontSize: 15,
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
  },
});
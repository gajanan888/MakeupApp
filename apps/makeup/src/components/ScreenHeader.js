import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const ScreenHeader = ({ title, onBack, rightSlot = null }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#111" />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightSlot}>{rightSlot}</View>
    </View>
  );
};

export default ScreenHeader;

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 8,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
});

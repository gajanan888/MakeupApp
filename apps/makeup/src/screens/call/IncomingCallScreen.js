import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useCall } from '../../context/CallContext';

const { width, height } = Dimensions.get('window');

const IncomingCallScreen = () => {
  const { callData, acceptCall, rejectCall } = useCall();

  if (!callData) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Voice Call...</Text>
      </View>
      
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {callData.callerName ? callData.callerName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.callerName}>{callData.callerName || 'Unknown Caller'}</Text>
        <Text style={styles.callerRole}>{callData.callerRole === 'client' ? 'Client' : 'Artist'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={rejectCall}>
          <Icon name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={acceptCall}>
          <Icon name="call" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#1E1E1E',
    zIndex: 9999,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    opacity: 0.8,
  },
  callerInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ff4d6d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 50,
    fontWeight: 'bold',
  },
  callerName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callerRole: {
    color: '#aaa',
    fontSize: 18,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 50,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
});

export default IncomingCallScreen;

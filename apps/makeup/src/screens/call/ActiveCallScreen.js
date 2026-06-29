import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useCall, CALL_STATES } from '../../context/CallContext';

const { width, height } = Dimensions.get('window');

const ActiveCallScreen = () => {
  const { callState, callData, callDuration, endCall, toggleMute, toggleSpeaker } = useCall();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  // Safely format duration: 0 -> 00:00
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    toggleMute(!isMuted);
  };

  const handleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toggleSpeaker(!isSpeakerOn);
  };

  const getStatusText = () => {
    switch (callState) {
      case CALL_STATES.CALLING: return 'Calling...';
      case CALL_STATES.CONNECTING: return 'Connecting...';
      case CALL_STATES.CONNECTED: return formatTime(callDuration);
      case CALL_STATES.RECONNECTING: return 'Reconnecting...';
      case CALL_STATES.FAILED: return 'Call Failed';
      case CALL_STATES.ENDED: return 'Call Ended';
      default: return '';
    }
  };

  if (!callData || callState === CALL_STATES.IDLE || callState === CALL_STATES.RINGING) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {callData.callerName ? callData.callerName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.callerName}>{callData.callerName || 'Unknown'}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.controlButtonActive]} 
            onPress={handleMute}
          >
            <Icon name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} 
            onPress={handleSpeaker}
          >
            <Icon name="volume-high" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.endButton} onPress={endCall}>
          <Icon name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
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
  statusText: {
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
  controls: {
    alignItems: 'center',
    marginBottom: 50,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#fff',
  },
  endButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveCallScreen;

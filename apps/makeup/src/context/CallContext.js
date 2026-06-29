import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import SocketService from '../services/socketService';
import WebRTCService from '../services/webrtcService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CallContext = createContext(null);

// Finite State Machine States
export const CALL_STATES = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  RINGING: 'RINGING',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ENDED: 'ENDED',
  FAILED: 'FAILED',
};

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [callData, setCallData] = useState(null); // { bookingId, callerId, callerName, targetId, targetRole, isIncoming }
  const [remoteStream, setRemoteStream] = useState(null);
  
  // Timer for active call
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  // Initialize socket when user logs in (for simplicity, we assume token exists or check periodically)
  useEffect(() => {
    SocketService.connect();
    
    return () => {
      SocketService.disconnect();
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    const handleIncomingCall = async (payload) => {
      if (callState !== CALL_STATES.IDLE) {
        // User is busy
        const role = await AsyncStorage.getItem('userRole');
        const id = await AsyncStorage.getItem(role === 'client' ? 'customerId' : 'artistId');
        
        SocketService.emit('user-busy', { 
          targetId: payload.callerId, 
          targetRole: payload.callerRole,
          bookingId: payload.bookingId 
        });
        return;
      }

      setCallData({ ...payload, isIncoming: true });
      setCallState(CALL_STATES.RINGING);
    };

    const handleCallAccepted = async (payload) => {
      if (callState !== CALL_STATES.CALLING) return;
      setCallState(CALL_STATES.CONNECTING);
      
      try {
        // Caller initiates WebRTC offer
        await WebRTCService.initialize(
          (candidate) => {
            SocketService.emit('webrtc-ice-candidate', { 
              targetId: callData.targetId, 
              targetRole: callData.targetRole, 
              candidate 
            });
          },
          (stream) => setRemoteStream(stream)
        );

        const offer = await WebRTCService.createOffer();
        SocketService.emit('webrtc-offer', { 
          targetId: callData.targetId, 
          targetRole: callData.targetRole, 
          sdp: offer 
        });
      } catch (error) {
        console.error('[CallContext] Error creating offer:', error);
        resetCall(CALL_STATES.FAILED);
      }
    };

    const handleCallRejected = (payload) => {
      console.log('[CallContext] Call rejected. Reason:', payload.reason);
      resetCall(CALL_STATES.ENDED);
    };

    const handleCallFailed = (payload) => {
      console.error('[CallContext] Call failed:', payload.reason);
      resetCall(CALL_STATES.FAILED);
    };

    const handleCallEnded = () => {
      resetCall(CALL_STATES.ENDED);
    };

    // WebRTC Listeners
    const handleWebRTCOffer = async (payload) => {
      try {
        const answer = await WebRTCService.handleOfferAndCreateAnswer(payload.sdp);
        const role = await AsyncStorage.getItem('userRole');
        
        SocketService.emit('webrtc-answer', { 
          targetId: callData.callerId, 
          targetRole: callData.callerRole, 
          sdp: answer 
        });
        
        setCallState(CALL_STATES.CONNECTED);
        startTimer();
      } catch (error) {
        console.error('[CallContext] Error handling offer:', error);
        resetCall(CALL_STATES.FAILED);
      }
    };

    const handleWebRTCAnswer = async (payload) => {
      try {
        await WebRTCService.handleAnswer(payload.sdp);
        setCallState(CALL_STATES.CONNECTED);
        startTimer();
      } catch (error) {
        console.error('[CallContext] Error handling answer:', error);
        resetCall(CALL_STATES.FAILED);
      }
    };

    const handleIceCandidate = (payload) => {
      WebRTCService.addIceCandidate(payload.candidate);
    };

    SocketService.on('incoming-call', handleIncomingCall);
    SocketService.on('call-accepted', handleCallAccepted);
    SocketService.on('call-rejected', handleCallRejected);
    SocketService.on('call-failed', handleCallFailed);
    SocketService.on('call-ended', handleCallEnded);
    SocketService.on('webrtc-offer', handleWebRTCOffer);
    SocketService.on('webrtc-answer', handleWebRTCAnswer);
    SocketService.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      SocketService.off('incoming-call', handleIncomingCall);
      SocketService.off('call-accepted', handleCallAccepted);
      SocketService.off('call-rejected', handleCallRejected);
      SocketService.off('call-failed', handleCallFailed);
      SocketService.off('call-ended', handleCallEnded);
      SocketService.off('webrtc-offer', handleWebRTCOffer);
      SocketService.off('webrtc-answer', handleWebRTCAnswer);
      SocketService.off('webrtc-ice-candidate', handleIceCandidate);
    };
  }, [callState, callData]);

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetCall = (terminalState = CALL_STATES.IDLE) => {
    setCallState(terminalState);
    stopTimer();
    WebRTCService.cleanup();
    setRemoteStream(null);
    
    // After 2 seconds, reset to IDLE so UI dismisses
    if (terminalState !== CALL_STATES.IDLE) {
      setTimeout(() => {
        setCallState(CALL_STATES.IDLE);
        setCallData(null);
      }, 2000);
    } else {
      setCallData(null);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const initiateCall = async (bookingId, targetId, targetRole) => {
    if (callState !== CALL_STATES.IDLE) return;
    
    setCallData({ bookingId, targetId, targetRole, isIncoming: false });
    setCallState(CALL_STATES.CALLING);
    
    SocketService.emit('initiate-call', { bookingId, targetId, targetRole });
  };

  const acceptCall = async () => {
    if (callState !== CALL_STATES.RINGING) return;
    setCallState(CALL_STATES.CONNECTING);
    
    try {
      await WebRTCService.initialize(
        (candidate) => {
          SocketService.emit('webrtc-ice-candidate', { 
            targetId: callData.callerId, 
            targetRole: callData.callerRole, 
            candidate 
          });
        },
        (stream) => setRemoteStream(stream)
      );

      SocketService.emit('accept-call', { 
        targetId: callData.callerId, 
        targetRole: callData.callerRole, 
        bookingId: callData.bookingId 
      });
    } catch (error) {
      console.error('[CallContext] Error accepting call:', error);
      resetCall(CALL_STATES.FAILED);
    }
  };

  const rejectCall = () => {
    if (callState !== CALL_STATES.RINGING) return;
    SocketService.emit('reject-call', { 
      targetId: callData.callerId, 
      targetRole: callData.callerRole, 
      bookingId: callData.bookingId 
    });
    resetCall(CALL_STATES.IDLE);
  };

  const endCall = () => {
    const targetId = callData?.isIncoming ? callData.callerId : callData?.targetId;
    const targetRole = callData?.isIncoming ? callData.callerRole : callData?.targetRole;

    if (targetId && targetRole) {
      SocketService.emit('end-call', { targetId, targetRole, bookingId: callData?.bookingId });
    }
    resetCall(CALL_STATES.ENDED);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callData,
        remoteStream,
        callDuration,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute: WebRTCService.toggleMute.bind(WebRTCService),
        toggleSpeaker: WebRTCService.toggleSpeaker.bind(WebRTCService),
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);

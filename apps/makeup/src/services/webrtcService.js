import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    
    // Default STUN servers. TURN can be added here in Phase 2.
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  /**
   * Initializes the PeerConnection and local audio stream.
   * @param {Function} onIceCandidate - Callback when ICE candidate is generated
   * @param {Function} onTrack - Callback when remote stream is received
   */
  async initialize(onIceCandidate, onTrack) {
    try {
      this.peerConnection = new RTCPeerConnection(this.configuration);

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          onTrack(this.remoteStream);
        }
      };

      // Get local microphone stream
      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false, // Voice call only
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Start InCallManager
      InCallManager.start({ media: 'audio' });

    } catch (error) {
      console.error('[WebRTCService] Initialization error:', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) return null;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('[WebRTCService] Create Offer error:', error);
      throw error;
    }
  }

  async handleOfferAndCreateAnswer(offerSdp) {
    if (!this.peerConnection) return null;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('[WebRTCService] Handle Offer error:', error);
      throw error;
    }
  }

  async handleAnswer(answerSdp) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
    } catch (error) {
      console.error('[WebRTCService] Handle Answer error:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('[WebRTCService] Add ICE Candidate error:', error);
    }
  }

  toggleMute(isMuted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  toggleSpeaker(isSpeakerOn) {
    InCallManager.setForceSpeakerphoneOn(isSpeakerOn);
  }

  cleanup() {
    console.log('[WebRTCService] Cleaning up resources...');
    
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    
    InCallManager.stop();
  }
}

export default new WebRTCService();

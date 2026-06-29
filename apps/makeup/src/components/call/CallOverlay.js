import React from 'react';
import { useCall, CALL_STATES } from '../../context/CallContext';
import IncomingCallScreen from '../../screens/call/IncomingCallScreen';
import ActiveCallScreen from '../../screens/call/ActiveCallScreen';

const CallOverlay = () => {
  const { callState } = useCall();

  if (callState === CALL_STATES.IDLE) {
    return null;
  }

  if (callState === CALL_STATES.RINGING) {
    return <IncomingCallScreen />;
  }

  return <ActiveCallScreen />;
};

export default CallOverlay;

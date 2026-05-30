// // ArtistOTPVerificationScreen.js

// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   SafeAreaView,
//   StatusBar,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
// } from 'react-native';

// import Icon from 'react-native-vector-icons/Feather';
// import { registerArtist, sendOtp, verifyOtp } from '../../api/auth';

// const OTP_LENGTH = 6;
// const RESEND_SECONDS = 30;

// const ArtistOTPVerificationScreen = ({ navigation, route }) => {
//   const [mobileOtp, setMobileOtp] = useState(['', '', '', '', '', '']);
//   const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);

//   const mobileRefs = useRef([]);
//   const emailRefs = useRef([]);
//   const [otpSessionId, setOtpSessionId] = useState(route?.params?.sessionId);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [isResending, setIsResending] = useState(false);
//   const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

//   const { phone, email, fullName, password } = route?.params ?? {};

//   useEffect(() => {
//     if (secondsLeft <= 0) {
//       return undefined;
//     }

//     const timerId = setInterval(() => {
//       setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
//     }, 1000);

//     return () => clearInterval(timerId);
//   }, [secondsLeft]);

//   const handleOtpChange = (value, index, otp, setOtp, refs) => {
//     if (value.length > 1) {
//       value = value.slice(-1);
//     }

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < OTP_LENGTH - 1) {
//       refs.current[index + 1]?.focus();
//     }
//   };

//   const handleBackspace = (key, index, otp, refs) => {
//     if (key === 'Backspace' && !otp[index] && index > 0) {
//       refs.current[index - 1]?.focus();
//     }
//   };

//   const handleVerify = async () => {
//     const otpValue = mobileOtp.join('');

//     if (!otpSessionId) {
//       Alert.alert('OTP error', 'Session expired. Please resend OTP.');
//       return;
//     }

//     if (otpValue.length !== OTP_LENGTH || mobileOtp.some(d => !d)) {
//       Alert.alert('Invalid OTP', 'Enter the 6-digit OTP sent to your phone.');
//       return;
//     }

//     try {
//       setIsVerifying(true);
//       const verifyResponse = await verifyOtp(otpSessionId, otpValue);

//       if (
//         verifyResponse?.Status &&
//         String(verifyResponse.Status).toLowerCase() !== 'success'
//       ) {
//         throw new Error(verifyResponse?.Details || 'OTP verification failed');
//       }

//       if (!fullName || !email || !phone || !password) {
//         throw new Error(
//           'Registration details are missing. Go back and try again.',
//         );
//       }

//       await registerArtist({
//         name: fullName?.trim(),
//         email: email?.trim(),
//         phone: phone?.trim(),
//         password,
//       });

//       navigation.navigate('ArtistRegister2', {
//         fullName: fullName?.trim(),
//       });
//     } catch (error) {
//       const message = error?.response?.data?.message || error?.message;
//       Alert.alert('Verification error', message || 'OTP verification failed.');
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleResend = async () => {
//     if (!phone) {
//       Alert.alert('OTP error', 'Phone number is missing.');
//       return;
//     }

//     try {
//       setIsResending(true);
//       const otpResponse = await sendOtp(phone.trim());
//       const nextSessionId =
//         otpResponse?.Details ||
//         otpResponse?.details ||
//         otpResponse?.sessionId ||
//         otpResponse?.session_id;

//       if (!nextSessionId) {
//         throw new Error('Could not resend OTP. Try again.');
//       }

//       setOtpSessionId(nextSessionId);
//       setSecondsLeft(RESEND_SECONDS);
//       Alert.alert('OTP sent', 'A new OTP has been sent to your phone.');
//     } catch (error) {
//       const message = error?.response?.data?.message || error?.message;
//       Alert.alert('OTP error', message || 'Resend failed.');
//     } finally {
//       setIsResending(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#F7F7F7" barStyle="dark-content" />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         style={{ flex: 1 }}
//       >
//         {/* Back Button */}
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//           accessibilityRole="button"
//           accessibilityLabel="Go back"
//         >
//           <Icon name="chevron-left" size={28} color="#111" />
//         </TouchableOpacity>

//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.title}>Verify Account</Text>

//           <Text style={styles.subtitle}>
//             We’ve sent verification codes to your
//             {'\n'}
//             mobile number and email address
//           </Text>
//         </View>

//         {/* Mobile OTP Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Mobile Verification</Text>

//           <Text style={styles.infoText}>
//             {phone ? `+91 ${phone}` : '+91 ••••••4821'}
//           </Text>

//           <View style={styles.otpContainer}>
//             {mobileOtp.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={ref => (mobileRefs.current[index] = ref)}
//                 value={digit}
//                 autoFocus={index === 0}
//                 onChangeText={value =>
//                   handleOtpChange(
//                     value,
//                     index,
//                     mobileOtp,
//                     setMobileOtp,
//                     mobileRefs,
//                   )
//                 }
//                 onKeyPress={({ nativeEvent }) =>
//                   handleBackspace(nativeEvent.key, index, mobileOtp, mobileRefs)
//                 }
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 style={[styles.otpBox, digit && styles.activeOtpBox]}
//               />
//             ))}
//           </View>
//         </View>

//         {/* Email OTP Section */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Email Verification</Text>

//           <Text style={styles.infoText}>
//             {email ? email : 've****@gmail.com'}
//           </Text>

//           <View style={styles.otpContainer}>
//             {emailOtp.map((digit, index) => (
//               <TextInput
//                 key={index}
//                 ref={ref => (emailRefs.current[index] = ref)}
//                 value={digit}
//                 onChangeText={value =>
//                   handleOtpChange(
//                     value,
//                     index,
//                     emailOtp,
//                     setEmailOtp,
//                     emailRefs,
//                   )
//                 }
//                 onKeyPress={({ nativeEvent }) =>
//                   handleBackspace(nativeEvent.key, index, emailOtp, emailRefs)
//                 }
//                 keyboardType="number-pad"
//                 maxLength={1}
//                 style={[styles.otpBox, digit && styles.activeOtpBox]}
//               />
//             ))}
//           </View>
//         </View>

//         {/* Timer */}
//         <Text style={styles.timerText}>
//           Resend available in{' '}
//           <Text style={styles.timer}>
//             {`00:${String(secondsLeft).padStart(2, '0')}`}
//           </Text>
//         </Text>

//         {/* Verify Button */}
//         <TouchableOpacity
//           style={[styles.verifyButton, isVerifying && styles.disabledButton]}
//           onPress={handleVerify}
//           disabled={isVerifying}
//         >
//           <Text style={styles.verifyButtonText}>
//             {isVerifying ? 'Verifying...' : 'Verify Account'}
//           </Text>
//         </TouchableOpacity>

//         {/* Resend */}
//         <TouchableOpacity
//           onPress={handleResend}
//           disabled={isResending || secondsLeft > 0}
//         >
//           <Text style={styles.resendText}>
//             Didn't receive code?{' '}
//             <Text style={styles.resend}>
//               {isResending
//                 ? 'Sending...'
//                 : secondsLeft > 0
//                 ? 'Resend (wait)'
//                 : 'Resend'}
//             </Text>
//           </Text>
//         </TouchableOpacity>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default ArtistOTPVerificationScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F7F7F7',
//     paddingHorizontal: 24,
//   },

//   backButton: {
//     marginTop: 10,
//     width: 40,
//   },

//   header: {
//     alignItems: 'center',
//     marginTop: 20,
//     marginBottom: 40,
//   },

//   title: {
//     fontSize: 40,
//     fontWeight: '900',
//     color: '#111',
//     marginBottom: 16,
//     fontFamily: 'serif',
//   },

//   subtitle: {
//     fontSize: 18,
//     color: '#7A7A7A',
//     textAlign: 'center',
//     lineHeight: 28,
//     fontFamily: 'serif',
//   },

//   section: {
//     marginBottom: 35,
//   },

//   sectionTitle: {
//     fontSize: 22,
//     color: '#111',
//     fontWeight: '700',
//     marginBottom: 8,
//     fontFamily: 'serif',
//   },

//   infoText: {
//     fontSize: 16,
//     color: '#7A7A7A',
//     marginBottom: 22,
//     fontFamily: 'serif',
//   },

//   otpContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   otpBox: {
//     width: 52,
//     height: 60,
//     borderRadius: 18,
//     borderWidth: 1.5,
//     borderColor: '#E5E5E5',
//     backgroundColor: '#FFFFFF',
//     textAlign: 'center',
//     fontSize: 22,
//     color: '#111',
//     fontWeight: '700',
//   },

//   activeOtpBox: {
//     borderColor: '#FF4F8F',
//   },

//   timerText: {
//     textAlign: 'center',
//     color: '#7A7A7A',
//     fontSize: 16,
//     marginBottom: 28,
//     fontFamily: 'serif',
//   },

//   timer: {
//     color: '#FF4F8F',
//     fontWeight: '700',
//   },

//   verifyButton: {
//     height: 60,
//     backgroundColor: '#FF4F8F',
//     borderRadius: 22,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 28,
//   },

//   verifyButtonText: {
//     color: '#FFFFFF',
//     fontSize: 22,
//     fontWeight: '800',
//     fontFamily: 'serif',
//   },

//   disabledButton: {
//     opacity: 0.6,
//   },

//   resendText: {
//     textAlign: 'center',
//     fontSize: 18,
//     color: '#7A7A7A',
//     fontFamily: 'serif',
//   },

//   resend: {
//     color: '#FF4F8F',
//     fontWeight: '700',
//   },
// });


import { StyleSheet, Text, View, Button } from 'react-native';
import React from 'react';

const ArtistOTPVerificationScreen = ({ navigation }) => {
  return (
    <View>
      <Text>ArtistOTPVerificationScreen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('ArtistRegister2')}
      />
    </View>
  );
};

export default ArtistOTPVerificationScreen;

const styles = StyleSheet.create({});
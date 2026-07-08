import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  SafeAreaView,
  PermissionsAndroid,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  BackHandler,
  Keyboard,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { getCustomerConversations, sendCustomerMessage, getCustomerBookings } from '../../api/auth';
import BottomNavigation from '../../components/BottomNavigation';
import { useCall } from '../../context/CallContext';

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return cameraGranted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  }
  return true;
};

const CustomerMessageScreen = ({ isTab = false, activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [activeArtistId, setActiveArtistId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isTab && activeTab === 'Chat') {
      setActiveArtistId(null);
    }
  }, [activeTab, isTab]);

  const scrollViewRef = useRef();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const { initiateCall } = useCall();

  const handleCallArtist = async () => {
    if (!activeContact) return;
    try {
      // Find a confirmed or in_progress booking with this artist
      const bookingsList = await getCustomerBookings();
      const activeBooking = bookingsList.find(
        b => String(b.artistId || b.artist?.id) === String(activeContact.id) &&
             ['confirmed', 'in_progress'].includes(b.status)
      );

      if (!activeBooking) {
        Alert.alert(
          'Cannot Call',
          'You can only call this artist if you have an active, confirmed booking.'
        );
        return;
      }

      initiateCall(
        activeBooking.id,
        activeContact.id,
        'artist',
        activeContact.name
      );
    } catch (error) {
      console.warn('Failed to initiate call:', error);
      Alert.alert('Error', 'Failed to place call. Please try again.');
    }
  };

  useEffect(() => {
    if (route.params && route.params.artistId) {
      setActiveArtistId(String(route.params.artistId));
    }
  }, [route.params]);

  const fetchConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getCustomerConversations();
      setConversations(data);
    } catch (error) {
      console.warn('Failed to fetch customer conversations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);

    const interval = setInterval(() => {
      fetchConversations(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (activeArtistId !== null) {
        if (isTab) {
          setActiveArtistId(null);
        } else {
          navigation.goBack();
        }
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeArtistId, isTab, navigation]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: activeArtistId === null,
    });
  }, [navigation, activeArtistId]);

  const handleSendImage = async (uri) => {
    if (!activeArtistId) return;

    // Optimistically update the UI locally
    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempMsgId = 'm_new_' + Date.now();
    const optimisticMsg = {
      id: tempMsgId,
      image: uri,
      time: localTime,
      sender: 'client',
    };

    setConversations(prevConvs =>
      prevConvs.map(c => {
        if (c.id === activeArtistId) {
          return {
            ...c,
            lastMsg: 'Sent a photo',
            time: localTime,
            isTyping: false,
            messages: [...(c.messages || []), optimisticMsg],
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await sendCustomerMessage({
        artistId: parseInt(activeArtistId, 10),
        image: uri,
      });
      fetchConversations(false);
    } catch (err) {
      console.warn('Failed to send image message:', err);
      Alert.alert('Send Error', 'Could not send photo. Please try again.');
    }
  };

  const openCamera = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission is needed');
      return;
    }
    setImagePickerVisible(false);

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        };

        try {
          const url = await uploadFile(file);
          if (url) {
            handleSendImage(url);
          } else {
            handleSendImage(asset.uri);
          }
        } catch (err) {
          console.warn('Upload failed, sending local image', err);
          handleSendImage(asset.uri);
        }
      }
    } catch (error) {
      console.warn('Camera error', error);
      Alert.alert('Error', 'Could not open camera');
    }
  };

  const openGallery = async () => {
    setImagePickerVisible(false);

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.didCancel) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        };

        try {
          const url = await uploadFile(file);
          if (url) {
            handleSendImage(url);
          } else {
            handleSendImage(asset.uri);
          }
        } catch (err) {
          console.warn('Upload failed, sending local image', err);
          handleSendImage(asset.uri);
        }
      }
    } catch (error) {
      console.warn('Gallery error', error);
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activeArtistId) return;

    const textToSend = inputText.trim();
    setInputText('');

    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempMsgId = 'm_new_' + Date.now();
    const optimisticMsg = {
      id: tempMsgId,
      text: textToSend,
      time: localTime,
      sender: 'client',
    };

    setConversations(prevConvs =>
      prevConvs.map(c => {
        if (c.id === activeArtistId) {
          return {
            ...c,
            lastMsg: textToSend,
            time: localTime,
            isTyping: false,
            messages: [...(c.messages || []), optimisticMsg],
          };
        }
        return c;
      })
    );

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await sendCustomerMessage({
        artistId: parseInt(activeArtistId, 10),
        text: textToSend,
      });
      fetchConversations(false);
    } catch (err) {
      console.warn('Failed to send text message:', err);
      Alert.alert('Send Error', 'Could not send message. Please try again.');
    }
  };

  const activeContact = conversations.find(c => c.id === activeArtistId) || (activeArtistId ? {
    id: activeArtistId,
    name: route.params?.artistName || "Makeup Artist",
    avatar: route.params?.artistAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
    messages: [],
    isChatEnabled: true,
  } : null);

  const renderContactItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => setActiveArtistId(item.id)}
      >
        <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
        <View style={styles.contactInfo}>
          <View style={styles.contactMeta}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.contactTime}>{item.time}</Text>
          </View>
          <Text style={styles.contactLastMsg} numberOfLines={1}>
            {item.lastMsg || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isTab && { paddingTop: 0 }]}>
      <View
        style={[
          styles.container,
          isTab && {
            paddingBottom: isKeyboardVisible
              ? 0
              : 56 + (insets.bottom || 8),
          },
        ]}
      >
        {activeArtistId === null ? (
          /* CONVERSATION LIST VIEW */
          <View style={styles.listContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Messages</Text>
            </View>

            {loading && conversations.length === 0 ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF4F87" />
              </View>
            ) : (
              <FlatList
                data={conversations}
                renderItem={renderContactItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={60} color="#FFCDDF" />
                    <Text style={styles.emptyText}>No conversations yet</Text>
                    <Text style={styles.emptySubtext}>Find a makeup artist and start a chat!</Text>
                  </View>
                }
              />
            )}

            {!isTab && <BottomNavigation navigation={navigation} activeTab="Chat" />}
          </View>
        ) : !activeContact ? (
          /* PRE-RESOLVING DOCK OVERLAY */
          <View style={[styles.chatRoomContainer, styles.centered]}>
            <ActivityIndicator size="large" color="#FF4F87" />
          </View>
        ) : (
          /* ACTIVE CHAT VIEW */
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.chatRoomContainer}
          >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    if (isTab) {
                      setActiveArtistId(null);
                    } else {
                      navigation.goBack();
                    }
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Image source={{ uri: activeContact.avatar }} style={styles.chatAvatarHeader} />
                <View style={styles.chatHeaderMeta}>
                  <Text style={styles.chatHeaderName} numberOfLines={1}>{activeContact.name}</Text>
                  <Text style={[styles.chatHeaderStatus, activeContact.isChatEnabled === false && { color: '#8E8E93' }]}>
                    {activeContact.isChatEnabled === false ? 'Chat Locked' : 'Online'}
                  </Text>
                </View>
              </View>
              <View style={styles.chatHeaderRight}>
                {activeContact.isChatEnabled !== false && (
                  <TouchableOpacity style={styles.callHeaderBtn} onPress={handleCallArtist}>
                    <Ionicons name="call-outline" size={20} color="#FF4F87" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.moreBtn}>
                  <Ionicons name="ellipsis-vertical" size={22} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages Flow Scroll */}
            <ScrollView
              ref={scrollViewRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={[
                styles.messagesFlow,
                { flexGrow: 1 }
              ]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {(activeContact.messages || []).map((msg, index) => {
                const isClient = msg.sender === 'client';
                const hasText = !!msg.text;
                const hasImage = !!msg.image;
                const images = msg.image ? msg.image.split(',') : [];

                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.messageRow,
                      isClient ? styles.messageRowClient : styles.messageRowArtist,
                    ]}
                  >
                    {/* Render Artist Avatar next to their bubble */}
                    {!isClient && (
                      <Image
                        source={{ uri: activeContact.avatar }}
                        style={styles.messageAvatar}
                      />
                    )}

                    <View style={[styles.messageContentCol, isClient ? styles.contentAlignRight : styles.contentAlignLeft]}>
                      {/* Text Bubble */}
                      {hasText && (
                        <View
                          style={[
                            styles.messageBubble,
                            isClient ? styles.bubbleClient : styles.bubbleArtist,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              isClient ? styles.textClient : styles.textArtist,
                            ]}
                          >
                            {msg.text}
                          </Text>
                          <Text
                            style={[
                              styles.messageTime,
                              isClient ? styles.timeClient : styles.timeArtist,
                            ]}
                          >
                            {msg.time}
                          </Text>
                        </View>
                      )}

                      {/* Image Attachments */}
                      {hasImage && (
                        <View style={[styles.imageContainerRow, isClient ? styles.imagesAlignRight : styles.imagesAlignLeft]}>
                          {images.map((imgUri, imgIdx) => {
                            const isMultiple = images.length > 1;
                            return (
                              <Image
                                key={imgIdx}
                                source={{ uri: imgUri.trim() }}
                                style={[
                                  styles.messageImage,
                                  isMultiple ? styles.messageImageMultiple : styles.messageImageSingle,
                                  imgIdx > 0 && { marginLeft: 8 }
                                ]}
                              />
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Bar */}
            {activeContact.isChatEnabled === false ? (
              <View style={[styles.disabledInputBar, { paddingBottom: insets.bottom || 12 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8A7D77" style={{ marginBottom: 4 }} />
                <Text style={styles.disabledInputText}>
                  {activeContact.chatDisabledReason || "Chat is disabled because there is no active, confirmed booking."}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.inputBar,
                  {
                    paddingBottom:
                      Platform.OS === 'ios'
                        ? insets.bottom
                        : 8,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => setImagePickerVisible(true)}
                >
                  <Ionicons name="add" size={26} color="#8E8E93" />
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                    <Ionicons name="send" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </View>

      {/* Image Picker BottomSheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imagePickerVisible}
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setImagePickerVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Send Attachment</Text>

            <TouchableOpacity style={styles.sheetBtn} onPress={openCamera}>
              <Ionicons name="camera-outline" size={22} color="#FF4F87" />
              <Text style={styles.sheetBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetBtn} onPress={openGallery}>
              <Ionicons name="image-outline" size={22} color="#FF4F87" />
              <Text style={styles.sheetBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default CustomerMessageScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 110,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE6EF',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  contactTime: {
    fontSize: 12,
    color: '#999',
  },
  contactLastMsg: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
    marginTop: 8,
    textAlign: 'center',
  },

  /* CHAT ROOM VIEW */
  chatRoomContainer: {
    flex: 1,
    backgroundColor: '#F6F6F9',
  },
  chatHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moreBtn: {
    padding: 4,
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callHeaderBtn: {
    padding: 4,
    marginRight: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  chatAvatarHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE6EF',
  },
  chatHeaderMeta: {
    marginLeft: 10,
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#4CD964',
    fontWeight: '600',
    marginTop: 1,
  },
  messagesFlow: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
    alignItems: 'flex-start',
  },
  messageRowClient: {
    justifyContent: 'flex-end',
  },
  messageRowArtist: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE6EF',
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  messageContentCol: {
    maxWidth: '80%',
  },
  contentAlignLeft: {
    alignItems: 'flex-start',
  },
  contentAlignRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleClient: {
    backgroundColor: '#FF4F87',
    borderBottomRightRadius: 4,
  },
  bubbleArtist: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  textClient: {
    color: '#FFF',
  },
  textArtist: {
    color: '#1C1C1E',
  },
  messageTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeClient: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeArtist: {
    color: '#8E8E93',
  },
  imageContainerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  imagesAlignLeft: {
    justifyContent: 'flex-start',
  },
  imagesAlignRight: {
    justifyContent: 'flex-end',
  },
  messageImage: {
    borderRadius: 12,
  },
  messageImageSingle: {
    width: 200,
    height: 150,
  },
  messageImageMultiple: {
    width: 110,
    height: 110,
  },

  /* INPUT BAR */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F2F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C2C2E',
    paddingVertical: 0,
  },
  sendBtn: {
    backgroundColor: '#FF4F87',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#FF4F87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  /* BOTTOM SHEET MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
  },
  sheetBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 14,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    height: 48,
    marginTop: 18,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  disabledInputBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledInputText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});

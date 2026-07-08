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
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { getArtistConversations, sendArtistMessage } from '../../api/auth';

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

const ArtistMessageScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  useEffect(() => {
    if (route.params && route.params.customerId) {
      setActiveContactId(String(route.params.customerId));
    }
  }, [route.params]);

  const fetchConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getArtistConversations();
      setContacts(data);
    } catch (error) {
      console.warn('Failed to fetch conversations:', error);
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
      if (activeContactId !== null) {
        setActiveContactId(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeContactId]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: activeContactId === null,
    });
  }, [navigation, activeContactId]);

  const handleSendImage = async (uri) => {
    if (!activeContactId) return;

    // Optimistically update the UI
    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempMsgId = 'm_new_' + Date.now();
    const optimisticMsg = {
      id: tempMsgId,
      image: uri,
      time: localTime,
      sender: 'artist',
    };

    setContacts(prevContacts =>
      prevContacts.map(c => {
        if (c.id === activeContactId) {
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

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await sendArtistMessage({
        customerId: parseInt(activeContactId),
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

  const activeContact = contacts.find(c => c.id === activeContactId) || (activeContactId ? {
    id: activeContactId,
    name: route.params?.customerName || "Client",
    avatar: route.params?.customerAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
    messages: [],
    isChatEnabled: true,
  } : null);

  const handleSend = async () => {
    if (!inputText.trim() || !activeContactId) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Optimistically update the UI
    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempMsgId = 'm_new_' + Date.now();
    const optimisticMsg = {
      id: tempMsgId,
      text: textToSend,
      time: localTime,
      sender: 'artist',
    };

    setContacts(prevContacts =>
      prevContacts.map(c => {
        if (c.id === activeContactId) {
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

    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await sendArtistMessage({
        customerId: parseInt(activeContactId),
        text: textToSend,
      });
      fetchConversations(false);
    } catch (err) {
      console.warn('Failed to send text message:', err);
      Alert.alert('Send Error', 'Could not send message. Please try again.');
    }
  };

  const renderContactItem = ({ item }) => {
    const isActive = item.id === activeContactId;
    return (
      <TouchableOpacity
        style={[styles.contactItem, isActive && styles.activeContactItem]}
        onPress={() => setActiveContactId(item.id)}
      >
        <Image source={{ uri: item.avatar }} style={styles.contactAvatar} />
        <View style={styles.contactInfo}>
          <View style={styles.contactMeta}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.contactTime}>{item.time}</Text>
          </View>
          <Text
            style={[
              styles.contactLastMsg,
              item.isTyping && styles.typingText,
            ]}
            numberOfLines={1}
          >
            {item.lastMsg}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {activeContactId === null ? (
          /* LEFT COLUMN: CONVERSATION LIST */
          <View style={styles.leftColumn}>
            {/* LEFT HEADER */}
            <View style={styles.leftHeader}>
              <TouchableOpacity style={styles.menuButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back-outline" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.leftTitle}>Messages</Text>
            </View>

            {/* CONTACTS LIST */}
            {loading && contacts.length === 0 ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF4F8F" />
              </View>
            ) : (
              <FlatList
                data={contacts}
                renderItem={renderContactItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contactsList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#FFCDDF" />
                    <Text style={styles.emptyText}>No messages yet</Text>
                  </View>
                }
              />
            )}
          </View>
        ) : !activeContact ? (
          /* ACTIVE CONTACT NOT FOUND YET / LOADING */
          <View style={[styles.rightColumn, styles.centered]}>
            <ActivityIndicator size="large" color="#FF4F8F" />
          </View>
        ) : (
          /* RIGHT COLUMN: ACTIVE CHAT VIEW */
          <View style={styles.rightColumn}>
            {/* CHAT HEADER */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setActiveContactId(null)}
                >
                  <Ionicons name="chevron-back-outline" size={24} color="#555" />
                </TouchableOpacity>
                <Image source={{ uri: activeContact.avatar }} style={styles.chatAvatar} />
                <View style={styles.chatUserMeta}>
                  <Text style={styles.chatUserName}>{activeContact.name}</Text>
                  <Text style={[
                    styles.chatUserStatus,
                    activeContact.isTyping && styles.typingStatusText,
                    activeContact.isChatEnabled === false && { color: '#8E8E93' }
                  ]}>
                    {activeContact.isChatEnabled === false
                      ? 'Chat Locked'
                      : activeContact.isTyping
                      ? 'Typing...'
                      : 'Online'}
                  </Text>
                </View>
              </View>

              <View style={styles.chatHeaderRight}>
                <TouchableOpacity style={styles.headerIconBtn}>
                  <Ionicons name="call-outline" size={22} color="#5E1735" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconBtn}>
                  <Ionicons name="videocam-outline" size={22} color="#5E1735" />
                </TouchableOpacity>
              </View>
            </View>

            {/* MESSAGE FLOW */}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.messagesFlow}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {(activeContact.messages || []).map((msg, index) => {
                const isArtist = msg.sender === 'artist';
                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.messageRow,
                      isArtist ? styles.messageRowArtist : styles.messageRowClient,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isArtist ? styles.bubbleArtist : styles.bubbleClient,
                        msg.image && { padding: 4 }
                      ]}
                    >
                      {msg.image ? (
                        <Image source={{ uri: msg.image }} style={styles.messageImage} />
                      ) : (
                        <Text
                          style={[
                            styles.messageText,
                            isArtist ? styles.textArtist : styles.textClient,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.messageTime,
                          isArtist ? styles.timeArtist : styles.timeClient,
                        ]}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* INPUT BAR */}
            {activeContact.isChatEnabled === false ? (
              <View style={[styles.disabledInputBar, { paddingBottom: insets.bottom || 12 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#8A7D77" style={{ marginBottom: 4 }} />
                <Text style={styles.disabledInputText}>
                  {activeContact.chatDisabledReason || "Chat is disabled because there is no active, confirmed booking."}
                </Text>
              </View>
            ) : (
              <View style={[styles.inputBarContainer, { paddingBottom: insets.bottom || 12 }]}>
                <TouchableOpacity style={styles.attachBtn} onPress={() => setImagePickerVisible(true)}>
                  <Ionicons name="add-circle-outline" size={24} color="#8A7D77" />
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#A39691"
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
          </View>
        )}
      </KeyboardAvoidingView>

      {/* IMAGE PICKER MODAL */}
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
            <Text style={styles.sheetTitle}>Choose Option</Text>

            {/* CAMERA */}
            <TouchableOpacity style={styles.sheetButton} onPress={openCamera}>
              <Ionicons name="camera" size={22} color="#FF4F8F" />
              <Text style={styles.sheetButtonText}>Open Camera</Text>
            </TouchableOpacity>

            {/* GALLERY */}
            <TouchableOpacity style={styles.sheetButton} onPress={openGallery}>
              <Ionicons name="image" size={22} color="#FF4F8F" />
              <Text style={styles.sheetButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {/* CANCEL */}
            <TouchableOpacity
              style={styles.cancelButton}
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

export default ArtistMessageScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },

  container: {
    flex: 1,
    flexDirection: 'row',
  },

  // LEFT COLUMN
  leftColumn: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },

  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
  },

  menuButton: {
    marginRight: 10,
  },

  leftTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  contactsList: {
    paddingVertical: 8,
  },

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCFCFC',
  },

  activeContactItem: {
    backgroundColor: '#FFF0F5',
  },

  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4ED',
  },

  contactInfo: {
    flex: 1,
    marginLeft: 10,
  },

  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  contactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
    flex: 1,
    marginRight: 4,
  },

  contactTime: {
    fontSize: 10,
    color: '#8A7D77',
    fontFamily: 'serif',
  },

  contactLastMsg: {
    fontSize: 11,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 2,
  },

  typingText: {
    color: '#FF4F8F',
    fontWeight: '600',
  },

  // RIGHT COLUMN
  rightColumn: {
    flex: 1,
    backgroundColor: '#F6F6F9',
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: 6,
    padding: 2,
  },

  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFE4ED',
  },

  chatUserMeta: {
    marginLeft: 10,
  },

  chatUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'serif',
  },

  chatUserStatus: {
    fontSize: 11,
    color: '#4CD964',
    fontWeight: '600',
    fontFamily: 'serif',
    marginTop: 1,
  },

  typingStatusText: {
    color: '#FF4F8F',
  },

  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconBtn: {
    marginLeft: 14,
    padding: 4,
  },

  messagesFlow: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },

  messageRowClient: {
    justifyContent: 'flex-start',
  },

  messageRowArtist: {
    justifyContent: 'flex-end',
  },

  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  bubbleClient: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },

  bubbleArtist: {
    backgroundColor: '#FF4F8F',
    borderBottomRightRadius: 4,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'serif',
  },

  textClient: {
    color: '#1C1C1E',
  },

  textArtist: {
    color: '#FFF',
  },

  messageTime: {
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
    fontFamily: 'serif',
  },

  timeClient: {
    color: '#8E8E93',
  },

  timeArtist: {
    color: 'rgba(255, 255, 255, 0.75)',
  },

  inputBarContainer: {
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
    fontSize: 13,
    color: '#2C2C2E',
    fontFamily: 'serif',
    paddingVertical: 0,
  },

  sendBtn: {
    backgroundColor: '#FF4F8F',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#FF4F8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: '#FFF',
    padding: 25,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'serif',
  },

  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4ED',
  },

  sheetButtonText: {
    fontSize: 16,
    color: '#111',
    marginLeft: 15,
    fontFamily: 'serif',
  },

  cancelButton: {
    marginTop: 15,
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 16,
    color: '#FF4F8F',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#8A7D77',
    fontFamily: 'serif',
    marginTop: 10,
    fontWeight: '500',
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

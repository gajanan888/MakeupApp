import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';

const CONTACTS_DATA = [
  {
    id: '1',
    name: 'Sophia Laurent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
    time: '10:30 AM',
    isTyping: true,
    lastMsg: 'Typing...',
    messages: [
      { id: 'm1', text: 'Hi Priya! I wanted to ask if you\'re available on 25 May for a bridal booking?', time: '10:30 AM', sender: 'client' },
      { id: 'm2', text: 'Hi Sophia! Yes, I am available on 25 May.', time: '10:31 AM', sender: 'artist' },
      { id: 'm3', text: 'Great! Also, do you provide HD makeup?', time: '10:32 AM', sender: 'client' },
      { id: 'm4', text: 'Yes, HD makeup is included in the package.', time: '10:32 AM', sender: 'artist' },
      { id: 'm5', text: 'Perfect! Let\'s confirm the booking then.', time: '10:33 AM', sender: 'client' },
    ],
  },
  {
    id: '2',
    name: 'Anastasia Beverly',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
    time: 'Yesterday',
    isTyping: false,
    lastMsg: 'Sure, see you then!',
    messages: [
      { id: 'm1', text: 'Hey Priya, can we check the timing?', time: '04:00 PM', sender: 'client' },
      { id: 'm2', text: 'Sure, does 11 AM work?', time: '04:05 PM', sender: 'artist' },
      { id: 'm3', text: 'Sure, see you then!', time: 'Yesterday', sender: 'client' },
    ],
  },
  {
    id: '3',
    name: 'Mia Makeup',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200',
    time: '12 May',
    isTyping: false,
    lastMsg: 'Thank you so much!',
    messages: [
      { id: 'm1', text: 'Here are the inspiration images.', time: '12 May', sender: 'client' },
      { id: 'm2', text: 'Thank you so much!', time: '12 May', sender: 'artist' },
    ],
  },
  {
    id: '4',
    name: 'Daniela Rose',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
    time: '12 May',
    isTyping: false,
    lastMsg: 'Can we reschedule?',
    messages: [
      { id: 'm1', text: 'Can we reschedule?', time: '12 May', sender: 'client' },
    ],
  },
  {
    id: '5',
    name: 'Luna Glam',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200',
    time: '10 May',
    isTyping: false,
    lastMsg: 'Okay perfect',
    messages: [
      { id: 'm1', text: 'Okay perfect', time: '10 May', sender: 'client' },
    ],
  },
];

const ArtistMessageScreen = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState(CONTACTS_DATA);
  const [activeContactId, setActiveContactId] = useState('1');
  const [inputText, setInputText] = useState('');
  
  const scrollViewRef = useRef();

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg = {
      id: 'm_new_' + Date.now(),
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'artist',
    };

    setContacts(prevContacts =>
      prevContacts.map(c => {
        if (c.id === activeContactId) {
          return {
            ...c,
            lastMsg: newMsg.text,
            time: newMsg.time,
            isTyping: false,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');
    
    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <View style={styles.leftColumn}>
          {/* LEFT HEADER */}
          <View style={styles.leftHeader}>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="menu-outline" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.leftTitle}>Messages</Text>
          </View>

          {/* CONTACTS LIST */}
          <FlatList
            data={contacts}
            renderItem={renderContactItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contactsList}
          />
        </View>

        {/* RIGHT COLUMN: ACTIVE CHAT VIEW */}
        <View style={styles.rightColumn}>
          {/* CHAT HEADER */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back-outline" size={24} color="#555" />
              </TouchableOpacity>
              <Image source={{ uri: activeContact.avatar }} style={styles.chatAvatar} />
              <View style={styles.chatUserMeta}>
                <Text style={styles.chatUserName}>{activeContact.name}</Text>
                <Text style={[styles.chatUserStatus, activeContact.isTyping && styles.typingStatusText]}>
                  {activeContact.isTyping ? 'Typing...' : 'Online'}
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
            {activeContact.messages.map((msg, index) => {
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
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isArtist ? styles.textArtist : styles.textClient,
                      ]}
                    >
                      {msg.text}
                    </Text>
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
          <View style={styles.inputBarContainer}>
            <TouchableOpacity style={styles.attachBtn}>
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
        </View>
      </KeyboardAvoidingView>
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
    width: '38%',
    borderRightWidth: 1,
    borderRightColor: '#F3ECF0',
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
    backgroundColor: '#FFF',
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECF0',
    backgroundColor: '#FFF',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4ED',
  },

  chatUserMeta: {
    marginLeft: 10,
  },

  chatUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    fontFamily: 'serif',
  },

  chatUserStatus: {
    fontSize: 11,
    color: '#389E0D',
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
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },

  bubbleArtist: {
    backgroundColor: '#FF4F8F',
    borderTopRightRadius: 4,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'serif',
  },

  textClient: {
    color: '#111',
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
    color: '#8A7D77',
  },

  timeArtist: {
    color: '#FFE4ED',
  },

  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3ECF0',
    backgroundColor: '#FFF',
  },

  attachBtn: {
    padding: 6,
    marginRight: 6,
  },

  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    borderWidth: 1,
    borderColor: '#F3ECF0',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },

  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#111',
    fontFamily: 'serif',
    paddingVertical: 0,
  },

  sendBtn: {
    backgroundColor: '#FF4F8F',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});

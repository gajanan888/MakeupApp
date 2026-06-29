import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ScreenHeader from '../../components/ScreenHeader';
import { sendPreviewChatMessage, generatePreviewPrompt, generatePreview } from '../../api/aiClient';

const QUICK_REPLIES = [
  { trigger: 'occasion', options: ['💍 Wedding', '🥂 Reception', '💕 Engagement', '🎉 Party', '🎂 Birthday', '💼 Office', '🎓 College', '📸 Photoshoot', '🌸 Festival', '❤️ Date Night', '😊 Casual Outing', '✨ Other'] },
  { trigger: 'where is the event', options: ['🏛 Indoor', '🌳 Outdoor', '🔄 Both'] },
  { trigger: 'what time', options: ['🌅 Morning', '☀️ Afternoon', '🌇 Evening', '🌙 Night'] },
  { trigger: 'what outfit', options: ['Saree', 'Lehenga', 'Gown', 'Salwar Suit', 'Western Dress', 'Formal Wear', 'Casual Wear', 'Other'] },
  { trigger: 'color of your outfit', options: ['❤️ Red', '💗 Pink', '💙 Blue', '💚 Green', '💛 Gold', '🖤 Black', '🤍 White', '💜 Purple', '🤎 Brown', '❤️🔥 Maroon', '🧡 Orange', '🌸 Peach'] },
  { trigger: 'overall look', options: ['🌿 Natural', '✨ Soft Glam', '💄 Glamorous', '👑 Luxury Bridal', '🌸 Korean Glass Skin', '⭐ Celebrity Inspired', '🤖 Surprise Me'] },
  { trigger: 'how bold', options: ['1 = Barely Visible', '2 = Light', '3 = Medium', '4 = Glam', '5 = Full Glam'] },
  { trigger: 'accessories', options: ['Hairstyle', 'Earrings', 'Necklace', 'Bindi', 'Dupatta', 'Veil', 'None'] },
];

const VirtualPreviewChatScreen = ({ navigation, route }) => {
  const { selfie_id, chat_session_id, first_reply, image } = route?.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(first_reply || '');
  
  const flatListRef = useRef(null);

  useEffect(() => {
    if (first_reply) {
      setMessages([
        {
          id: '1',
          role: 'model',
          content: first_reply,
          timestamp: new Date(),
        },
      ]);
    }
  }, [first_reply]);

  const getActiveOptions = () => {
    const text = currentQuestion.toLowerCase();
    for (const item of QUICK_REPLIES) {
      if (text.includes(item.trigger)) {
        return item.options;
      }
    }
    return [];
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Send to API
      const data = await sendPreviewChatMessage(selfie_id, chat_session_id, text);

      if (data && data.chat_session_id) {
        // Add AI reply
        const aiMsg = {
          id: Math.random().toString(),
          role: 'model',
          content: data.reply,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setCurrentQuestion(data.reply);

        // If preference collection is complete, trigger generation
        if (data.is_complete) {
          setLoading(false);
          await triggerPreviewGeneration(data.chat_session_id);
          return;
        }
      }
    } catch (err) {
      console.error('[ChatScreen] Error sending message:', err);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          content: 'Sorry, I encountered an issue. Please try sending that again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const triggerPreviewGeneration = async (sessionId) => {
    setGenerating(true);
    try {
      console.log('[ChatScreen] Fetching prompt...');
      const promptData = await generatePreviewPrompt(sessionId);
      
      console.log('[ChatScreen] Generating preview with prompt:', promptData.prompt);
      const previewData = await generatePreview(selfie_id, promptData.prompt, sessionId);

      if (previewData && previewData.id) {
        setGenerating(false);
        navigation.replace('VirtualPreviewResult', {
          preview_id: previewData.id,
          selfie_id: selfie_id,
          chat_session_id: sessionId,
          image: image,
        });
      } else {
        throw new Error('Failed to generate preview.');
      }
    } catch (err) {
      console.error('[ChatScreen] Generation failed:', err);
      setGenerating(false);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          content: 'Failed to generate your preview. Please try restarting the session.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isAi = item.role === 'model';
    return (
      <View style={[styles.messageRow, isAi ? styles.messageRowAi : styles.messageRowUser]}>
        {isAi && (
          <View style={styles.avatarIcon}>
            <Ionicons name="sparkles" size={14} color="#FFF" />
          </View>
        )}
        <View style={[styles.bubble, isAi ? styles.bubbleAi : styles.bubbleUser]}>
          <Text style={[styles.messageText, isAi ? styles.messageTextAi : styles.messageTextUser]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const options = getActiveOptions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7FA" />
      <View style={styles.shell}>
        <ScreenHeader title="AI Beauty Advisor" onBack={() => navigation.goBack()} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Typing Indicator */}
          {loading && (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color="#FF4F87" style={{ marginRight: 8 }} />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          )}

          {/* Quick Replies / Choice Chips */}
          {options.length > 0 && !loading && (
            <View style={styles.quickReplyContainer}>
              <Text style={styles.quickReplyTitle}>Choose an option:</Text>
              <FlatList
                horizontal
                data={options}
                keyExtractor={item => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickReplyList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionChip}
                    activeOpacity={0.8}
                    onPress={() => handleSendMessage(item)}
                  >
                    <Text style={styles.optionChipText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#A88B98"
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              activeOpacity={0.8}
              onPress={() => handleSendMessage()}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Loading overlay for generating preview */}
      <Modal visible={generating} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF4F87" />
            <Text style={styles.loadingTitle}>Creating Your Preview...</Text>
            <Text style={styles.loadingSub}>Applying custom makeup, hair, and jewelry...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VirtualPreviewChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: {
    flex: 1,
    margin: 10,
    borderRadius: 28,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFD9E6',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAi: {
    backgroundColor: '#FFF4F7',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE3EE',
  },
  bubbleUser: {
    backgroundColor: '#FF4F87',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextAi: {
    color: '#333',
  },
  messageTextUser: {
    color: '#FFF',
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#AA8899',
    fontWeight: '600',
  },
  quickReplyContainer: {
    backgroundColor: '#FFF8FA',
    borderTopWidth: 1,
    borderTopColor: '#FFE0EC',
    paddingVertical: 10,
  },
  quickReplyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AA8899',
    paddingHorizontal: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  quickReplyList: {
    paddingHorizontal: 12,
  },
  optionChip: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFD1E1',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#FFD1E1',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  optionChipText: {
    fontSize: 13,
    color: '#FF4F87',
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFE0EC',
    backgroundColor: '#FFF',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFF5F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#FFE0EC',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF4F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9E6',
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 14,
  },
  loadingSub: {
    fontSize: 12,
    color: '#8A5D6D',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const ChatWindow = ({ 
  conversation, 
  messages, 
  currentUserId,
  onSendMessage,
  onClose,
  loading 
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = parseISO(timestamp);
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'HH:mm')}`;
      } else {
        return format(date, 'MMM dd, HH:mm');
      }
    } catch (err) {
      return '';
    }
  };

  const getConversationName = () => {
    return conversation?.other_participant?.name || 'Unknown';
  };

  const getConversationSubtext = () => {
    if (conversation?.other_participant?.type === 'business') {
      return conversation?.businesses?.type?.replace('_', ' ') || 'Business';
    }
    return 'Customer';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await onSendMessage(conversation.id, messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending fails
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <svg className="w-20 h-20 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
        <p className="text-center">Select a conversation from the list to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          {/* Back button (mobile) */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Avatar */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
            ${conversation.other_participant?.type === 'business' 
              ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
              : 'bg-gradient-to-br from-green-500 to-teal-600'}
          `}>
            {getConversationName().charAt(0).toUpperCase()}
          </div>

          {/* Name and status */}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {getConversationName()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {getConversationSubtext()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-8 h-8">
                    {showAvatar && !isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                        {(message.sender?.full_name || message.users?.full_name)?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`
                    max-w-xs lg:max-w-md px-4 py-2 rounded-2xl
                    ${isOwnMessage 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm'}
                  `}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {/* Time and read status */}
                    <div className={`
                      flex items-center justify-end space-x-1 mt-1
                      ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}
                    `}>
                      <span className="text-xs">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {isOwnMessage && (
                        <span className="text-xs">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sending Indicator */}
      {isSending && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            <span>Sending...</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-full 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                       resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className={`
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
              transition-all duration-200 transform hover:scale-105
              ${inputValue.trim() && !isSending
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}
            `}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-4">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};

export default ChatWindow;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ 
  conversations, 
  activeConversation, 
  onSelectConversation,
  onDeleteConversation,
  loading 
}) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      return '';
    }
  };

  const getConversationName = (conversation) => {
    return conversation.other_participant?.name || 'Unknown';
  };

  const getConversationAvatar = (conversation) => {
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };

  const getConversationSubtext = (conversation) => {
    if (conversation.other_participant?.type === 'business') {
      return `${conversation.businesses?.type?.replace('_', ' ') || 'Business'} • ${conversation.businesses?.location || 'No location'}`;
    }
    return 'Customer';
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 px-4">
        <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-center font-medium">No conversations yet</p>
        <p className="text-sm text-center mt-2">Start a conversation by contacting a business</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectConversation(conversation)}
              className={`
                relative p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer
                transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800
                ${activeConversation?.id === conversation.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600' 
                  : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${conversation.other_participant?.type === 'business' 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600' 
                    : 'bg-gradient-to-br from-green-500 to-teal-600'}
                `}>
                  {getConversationAvatar(conversation)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {getConversationSubtext(conversation)}
                  </p>
                  
                  <p className={`
                    text-sm truncate
                    ${conversation.unread_count > 0 
                      ? 'text-gray-900 dark:text-white font-semibold' 
                      : 'text-gray-600 dark:text-gray-400'}
                  `}>
                    {truncateMessage(conversation.last_message)}
                  </p>
                </div>

                {/* Unread Badge */}
                {conversation.unread_count > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Delete button (on hover) */}
              {onDeleteConversation && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this conversation?')) {
                      onDeleteConversation(conversation.id);
                    }
                  }}
                  className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationList;

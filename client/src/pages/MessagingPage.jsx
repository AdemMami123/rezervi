import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnimatedLayout from '../components/AnimatedLayout';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import useMessaging from '../hooks/useMessaging';
import API from '../utils/api';
import toast from 'react-hot-toast';

const MessagingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    deleteConversation,
    setActiveConversation,
  } = useMessaging();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get('/auth/me');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching user:', err);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  // Initial data fetch
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  // Handle businessId from URL (when redirected from business detail page)
  useEffect(() => {
    const businessId = searchParams.get('businessId');
    if (businessId && currentUser) {
      handleCreateConversation(businessId);
    }
  }, [searchParams, currentUser]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markAsRead(activeConversation.id);
      setShowMobileChat(true);
    }
  }, [activeConversation?.id]);

  const handleCreateConversation = async (businessId) => {
    try {
      const conversation = await createConversation(businessId);
      setActiveConversation(conversation);
      toast.success('Conversation started!');
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    markAsRead(conversation.id);
  };

  const handleSendMessage = async (conversationId, content) => {
    try {
      await sendMessage(conversationId, content);
    } catch (err) {
      toast.error('Failed to send message');
      throw err;
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleCloseMobileChat = () => {
    setShowMobileChat(false);
    setActiveConversation(null);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AnimatedLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Chat with businesses and customers
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full overflow-hidden"
            >
              {/* Desktop Layout */}
              <div className="hidden md:grid md:grid-cols-3 h-full">
                {/* Conversation List */}
                <div className="col-span-1 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                  <ConversationList
                    conversations={conversations}
                    activeConversation={activeConversation}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                    loading={loading}
                  />
                </div>

                {/* Chat Window */}
                <div className="col-span-2 overflow-hidden">
                  <ChatWindow
                    conversation={activeConversation}
                    messages={messages}
                    currentUserId={currentUser?.id}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden h-full">
                {!showMobileChat ? (
                  <ConversationList
                    conversations={conversations}
                    activeConversation={activeConversation}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                    loading={loading}
                  />
                ) : (
                  <ChatWindow
                    conversation={activeConversation}
                    messages={messages}
                    currentUserId={currentUser?.id}
                    onSendMessage={handleSendMessage}
                    onClose={handleCloseMobileChat}
                    loading={loading}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </div>
    </AnimatedLayout>
  );
};

export default MessagingPage;

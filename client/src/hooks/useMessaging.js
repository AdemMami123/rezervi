import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseConfig';
import API from '../utils/api';

/**
 * Custom hook for real-time messaging functionality
 * Handles conversations, messages, and real-time updates via Supabase Realtime
 */
export const useMessaging = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const subscriptionRef = useRef(null);
  const messageSubscriptionRef = useRef(null);

  /**
   * Fetch all conversations for the user
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching conversations...');
      const response = await API.get('/api/messages/conversations');
      console.log('✅ Conversations fetched:', response.data);
      setConversations(response.data.conversations || []);
      
      // Calculate total unread count
      const total = (response.data.conversations || []).reduce(
        (sum, conv) => sum + (conv.unread_count || 0), 
        0
      );
      setUnreadCount(total);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching conversations:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch messages for a specific conversation
   */
  const fetchMessages = useCallback(async (conversationId, options = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.before) params.append('before', options.before);

      const response = await API.get(
        `/api/messages/conversations/${conversationId}/messages?${params}`
      );
      setMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create or get a conversation with a business
   */
  const createConversation = useCallback(async (businessId) => {
    try {
      setLoading(true);
      const response = await API.post('/api/messages/conversations', {
        businessId
      });
      
      const conversation = response.data.conversation;
      
      // Add to conversations list if it's new
      if (response.data.isNew) {
        await fetchConversations();
      }
      
      setActiveConversation(conversation);
      setError(null);
      return conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.response?.data?.error || 'Failed to create conversation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchConversations]);

  /**
   * Send a message in the active conversation
   */
  const sendMessage = useCallback(async (conversationId, content) => {
    try {
      const response = await API.post(
        `/api/messages/conversations/${conversationId}/messages`,
        { content }
      );
      
      const newMessage = response.data.message;
      
      // Optimistically add message to list
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, last_message: content, last_message_at: newMessage.created_at }
            : conv
        )
      );
      
      setError(null);
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message');
      throw err;
    }
  }, []);

  /**
   * Mark all messages in a conversation as read
   */
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await API.put(`/api/messages/conversations/${conversationId}/read`);
      
      // Update local state
      setMessages(prev => 
        prev.map(msg => ({ ...msg, is_read: true, read_at: new Date().toISOString() }))
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
      // Update total unread count
      setUnreadCount(prev => Math.max(0, prev - conversations.find(c => c.id === conversationId)?.unread_count || 0));
      
      setError(null);
    } catch (err) {
      console.error('Error marking messages as read:', err);
      setError(err.response?.data?.error || 'Failed to mark messages as read');
    }
  }, [conversations]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await API.delete(`/api/messages/conversations/${conversationId}`);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err.response?.data?.error || 'Failed to delete conversation');
      throw err;
    }
  }, [activeConversation]);

  /**
   * Set up real-time subscription for new messages in active conversation
   */
  useEffect(() => {
    if (!activeConversation?.id) {
      // Clean up subscription if no active conversation
      if (messageSubscriptionRef.current) {
        supabase.removeChannel(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to new messages in the active conversation
    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        async (payload) => {
          console.log('🔔 New message received:', payload.new);
          
          // Fetch full message with sender information
          try {
            const response = await API.get(
              `/api/messages/conversations/${activeConversation.id}/messages?limit=1`
            );
            const latestMessage = response.data.messages[response.data.messages.length - 1];
            
            // Add new message to the list if not already there
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === latestMessage.id);
              if (exists) return prev;
              console.log('✅ Adding message to list:', latestMessage);
              return [...prev, latestMessage];
            });
            
            // Update conversation
            setConversations(prev =>
              prev.map(conv =>
                conv.id === activeConversation.id
                  ? { 
                      ...conv, 
                      last_message: payload.new.content, 
                      last_message_at: payload.new.created_at 
                    }
                  : conv
              )
            );
          } catch (error) {
            console.error('Error fetching message details:', error);
            // Fallback: add message without sender info
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    messageSubscriptionRef.current = channel;

    return () => {
      if (messageSubscriptionRef.current) {
        supabase.removeChannel(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      }
    };
  }, [activeConversation?.id]);

  /**
   * Set up real-time subscription for conversation updates
   */
  useEffect(() => {
    // Subscribe to conversation updates (new conversations, updates, etc.)
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          console.log('🔔 Conversation update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            // New conversation created - fetch all conversations to get complete data
            console.log('📝 New conversation created, refreshing list...');
            await fetchConversations();
          } else if (payload.eventType === 'UPDATE') {
            // Conversation updated (e.g., new message)
            console.log('📝 Conversation updated:', payload.new);
            setConversations(prev => {
              const updated = prev.map(conv =>
                conv.id === payload.new.id
                  ? { 
                      ...conv, 
                      last_message: payload.new.last_message,
                      last_message_at: payload.new.last_message_at,
                      updated_at: payload.new.updated_at
                    }
                  : conv
              );
              // Sort by most recent
              return updated.sort((a, b) => 
                new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
              );
            });
            
            // If this is not the active conversation, increment unread count
            if (activeConversation?.id !== payload.new.id) {
              console.log('🔔 Updating unread count for conversation:', payload.new.id);
              await fetchConversations(); // Refresh to get accurate unread counts
            }
          } else if (payload.eventType === 'DELETE') {
            // Conversation deleted
            console.log('🗑️ Conversation deleted:', payload.old.id);
            setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [fetchConversations]);

  /**
   * Fetch unread count periodically
   */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await API.get('/api/messages/unread-count');
        setUnreadCount(response.data.unread_count || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    messages,
    unreadCount,
    loading,
    error,
    
    // Actions
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    deleteConversation,
    setActiveConversation,
  };
};

export default useMessaging;

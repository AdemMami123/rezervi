// Message Controller - Handles all messaging operations
// Uses req.supabase (user-scoped) for RLS-protected operations

/**
 * Get all conversations for the authenticated user
 * Returns conversations with last message, participant info, and unread count
 */
const getUserConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    // First, check if user owns a business
    const { data: userBusiness } = await req.supabase
      .from('businesses')
      .select('id, name, user_id')
      .eq('user_id', userId)
      .single();

    // Get conversations where user is the customer
    let { data: customerConvos, error: customerError } = await req.supabase
      .from('conversations')
      .select(`
        id,
        customer_id,
        business_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        businesses (
          id,
          name,
          type,
          location,
          user_id
        )
      `)
      .eq('customer_id', userId)
      .order('updated_at', { ascending: false });

    if (customerError) {
      console.error('Error fetching customer conversations:', customerError);
      throw customerError;
    }

    // Get conversations where user owns the business
    let businessConvos = [];
    if (userBusiness) {
      const { data, error: businessError } = await req.supabase
        .from('conversations')
        .select(`
          id,
          customer_id,
          business_id,
          last_message,
          last_message_at,
          created_at,
          updated_at,
          businesses (
            id,
            name,
            type,
            location,
            user_id
          )
        `)
        .eq('business_id', userBusiness.id)
        .order('updated_at', { ascending: false });

      if (businessError) {
        console.error('Error fetching business conversations:', businessError);
        throw businessError;
      }
      businessConvos = data || [];
    }

    // Combine and deduplicate conversations
    const allConversations = [...(customerConvos || []), ...businessConvos];
    const uniqueConversations = Array.from(
      new Map(allConversations.map(conv => [conv.id, conv])).values()
    );

    // Get unread counts and participant info for each conversation
    const conversationsWithUnread = await Promise.all(
      uniqueConversations.map(async (conv) => {
        const { data: participant } = await req.supabase
          .from('conversation_participants')
          .select('unread_count')
          .eq('conversation_id', conv.id)
          .eq('user_id', userId)
          .single();

        // Determine the other participant
        let otherParticipant;
        if (conv.customer_id === userId) {
          // User is customer, other is business
          otherParticipant = { 
            name: conv.businesses?.name || 'Business', 
            type: 'business', 
            business_id: conv.business_id 
          };
        } else {
          // User is business owner, other is customer
          const { data: customerData } = await req.supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', conv.customer_id)
            .single();
          
          otherParticipant = { 
            name: customerData?.full_name || customerData?.email || 'Customer', 
            type: 'customer', 
            user_id: conv.customer_id 
          };
        }

        return {
          ...conv,
          unread_count: participant?.unread_count || 0,
          other_participant: otherParticipant
        };
      })
    );

    res.status(200).json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get messages for a specific conversation
 */
const getConversationMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  const { limit = 50, before } = req.query;

  try {
    console.log(`📨 Fetching messages for conversation ${conversationId}, user: ${userId}`);

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Error verifying conversation access:', convError);
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log(`✅ Conversation found, fetching messages...`);

    // Build query - ensure limit is a number
    const messageLimit = parseInt(limit) || 50;
    let query = req.supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        read_at,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(messageLimit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages from DB:', error);
      throw error;
    }

    // If no messages, return empty array
    if (!messages || messages.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    // Fetch sender information for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (msg) => {
        try {
          const { data: sender, error: senderError } = await req.supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', msg.sender_id)
            .single();
          
          if (senderError) {
            console.error(`Error fetching sender for message ${msg.id}:`, senderError);
          }

          return {
            ...msg,
            sender: {
              id: sender?.id || msg.sender_id,
              full_name: sender?.full_name || sender?.email || 'User'
            }
          };
        } catch (err) {
          console.error(`Failed to fetch sender for message ${msg.id}:`, err);
          // Return message without sender info if fetch fails
          return {
            ...msg,
            sender: {
              id: msg.sender_id,
              full_name: 'User'
            }
          };
        }
      })
    );

    res.status(200).json({ messages: messagesWithSender.reverse() }); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new conversation or get existing one
 */
const createOrGetConversation = async (req, res) => {
  const userId = req.user.id;
  const { businessId } = req.body;

  try {
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // Check if conversation already exists
    const { data: existing, error: existingError } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', userId)
      .eq('business_id', businessId)
      .single();

    if (existing) {
      return res.status(200).json({ conversation: existing, isNew: false });
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await req.supabase
      .from('conversations')
      .insert([
        {
          customer_id: userId,
          business_id: businessId
        }
      ])
      .select()
      .single();

    if (createError) throw createError;

    // Create participant records for both parties
    const { data: business } = await req.supabase
      .from('businesses')
      .select('user_id')
      .eq('id', businessId)
      .single();

    if (business) {
      // Insert participant records
      const { error: participantError } = await req.supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: userId, unread_count: 0 },
          { conversation_id: newConversation.id, user_id: business.user_id, unread_count: 0 }
        ]);

      if (participantError) {
        console.error('Error creating participants:', participantError);
        // Don't fail the request, participants can be created by trigger
      }
    }

    // Fetch the full conversation with related data
    const { data: fullConversation } = await req.supabase
      .from('conversations')
      .select(`
        id,
        customer_id,
        business_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        businesses (
          id,
          name,
          type,
          location
        )
      `)
      .eq('id', newConversation.id)
      .single();

    res.status(201).json({ conversation: fullConversation || newConversation, isNew: true });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send a message in a conversation
 */
const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;
  const { content } = req.body;

  try {
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create the message
    const { data: message, error } = await req.supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          content: content.trim()
        }
      ])
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        read_at,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      throw error;
    }

    if (!message) {
      throw new Error('Message was not created');
    }

    // Fetch sender information
    const { data: sender, error: senderError } = await req.supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (senderError) {
      console.error('Error fetching sender info:', senderError);
    }

    const messageWithSender = {
      ...message,
      sender: {
        id: sender?.id || userId,
        full_name: sender?.full_name || sender?.email || 'User'
      }
    };

    res.status(201).json({ message: messageWithSender });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark messages as read
 */
const markMessagesAsRead = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    // Update all unread messages in this conversation that were sent to the user
    const { data, error } = await req.supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false)
      .select();

    if (error) throw error;

    // Reset unread count for this user in this conversation
    await req.supabase
      .from('conversation_participants')
      .update({ unread_count: 0, last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    res.status(200).json({ 
      message: 'Messages marked as read', 
      count: data?.length || 0 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get total unread message count for user
 */
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await req.supabase
      .from('conversation_participants')
      .select('unread_count')
      .eq('user_id', userId);

    if (error) throw error;

    const totalUnread = data.reduce((sum, participant) => sum + (participant.unread_count || 0), 0);

    res.status(200).json({ unread_count: totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a conversation (soft delete - just for the current user)
 */
const deleteConversation = async (req, res) => {
  const userId = req.user.id;
  const { conversationId } = req.params;

  try {
    // For now, we'll just remove the participant record
    // In a production app, you might want to keep a "deleted_at" timestamp
    const { error } = await req.supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ message: 'Conversation removed' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserConversations,
  getConversationMessages,
  createOrGetConversation,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteConversation
};

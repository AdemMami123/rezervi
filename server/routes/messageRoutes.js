const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/messages/health
 * @desc    Health check for messaging system
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Messaging System',
    timestamp: new Date().toISOString() 
  });
});

// All routes below require authentication
router.use(protect);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations', messageController.getUserConversations);

/**
 * @route   GET /api/messages/conversations/:conversationId
 * @desc    Get messages for a specific conversation
 * @access  Private
 */
router.get('/conversations/:conversationId/messages', messageController.getConversationMessages);

/**
 * @route   POST /api/messages/conversations
 * @desc    Create a new conversation or get existing one
 * @access  Private
 */
router.post('/conversations', messageController.createOrGetConversation);

/**
 * @route   POST /api/messages/conversations/:conversationId/messages
 * @desc    Send a message in a conversation
 * @access  Private
 */
router.post('/conversations/:conversationId/messages', messageController.sendMessage);

/**
 * @route   PUT /api/messages/conversations/:conversationId/read
 * @desc    Mark all messages in a conversation as read
 * @access  Private
 */
router.put('/conversations/:conversationId/read', messageController.markMessagesAsRead);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get total unread message count for user
 * @access  Private
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * @route   DELETE /api/messages/conversations/:conversationId
 * @desc    Delete/remove a conversation
 * @access  Private
 */
router.delete('/conversations/:conversationId', messageController.deleteConversation);

module.exports = router;

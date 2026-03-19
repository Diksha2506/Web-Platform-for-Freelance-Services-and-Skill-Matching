import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMessageCircle, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatPanel = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convoId) => {
    try {
      const res = await chatAPI.getMessages(convoId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);
  useEffect(() => {
    if (activeConvo) {
      fetchMessages(activeConvo.id);
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(activeConvo.id);
        fetchConversations(); // refresh unread counts
      }, 5000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeConvo, fetchMessages, fetchConversations]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || sending) return;
    setSending(true);
    try {
      const res = await chatAPI.sendMessage(activeConvo.id, newMessage.trim());
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const openConvo = (convo) => {
    setActiveConvo(convo);
    setMessages([]);
  };

  const filteredConversations = conversations.filter(c =>
    c.other_user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-container">
        <div className="chat-loading">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="chat-container"
    >
      {/* Conversation List (Left Panel) */}
      <div className={`chat-sidebar ${activeConvo ? 'chat-sidebar-hidden-mobile' : ''}`}>
        <div className="chat-sidebar-header">
          <h3><FiMessageCircle style={{ marginRight: 8 }} /> Messages</h3>
          <span className="chat-count">{conversations.length}</span>
        </div>

        <div className="chat-search">
          <FiSearch className="chat-search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="chat-list">
          {filteredConversations.length === 0 ? (
            <div className="chat-empty-list">
              <FiMessageCircle size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No conversations yet</p>
              <span>Messages will appear here after applying to jobs</span>
            </div>
          ) : (
            filteredConversations.map((convo) => (
              <motion.div
                key={convo.id}
                className={`chat-list-item ${activeConvo?.id === convo.id ? 'active' : ''}`}
                onClick={() => openConvo(convo)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="chat-list-avatar">
                  {getInitials(convo.other_user_name)}
                </div>
                <div className="chat-list-info">
                  <div className="chat-list-top">
                    <h4>{convo.other_user_name}</h4>
                    {convo.last_message && (
                      <span className="chat-time">{formatTime(convo.last_message.created_at)}</span>
                    )}
                  </div>
                  <p className="chat-list-job">{convo.job_title}</p>
                  <p className="chat-list-preview">
                    {convo.last_message ? convo.last_message.content : 'No messages yet'}
                  </p>
                </div>
                {convo.unread_count > 0 && (
                  <span className="chat-unread-badge">{convo.unread_count}</span>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area (Right Panel) */}
      <div className={`chat-main ${!activeConvo ? 'chat-main-hidden-mobile' : ''}`}>
        {!activeConvo ? (
          <div className="chat-placeholder">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <FiMessageCircle size={64} style={{ opacity: 0.15, marginBottom: 16 }} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the left to start chatting</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => setActiveConvo(null)}>
                <FiArrowLeft />
              </button>
              <div className="chat-header-avatar">
                {getInitials(activeConvo.other_user_name)}
              </div>
              <div className="chat-header-info">
                <h4>{activeConvo.other_user_name}</h4>
                <span className="chat-header-role">
                  {activeConvo.other_user_role === 'recruiter' ? '🏢 Recruiter' : '💻 Freelancer'}
                  {' • '}{activeConvo.job_title}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              <AnimatePresence>
                {messages.map((msg, index) => {
                  const isMine = msg.sender === user?.id;
                  const showAvatar = index === 0 || messages[index - 1]?.sender !== msg.sender;
                  return (
                    <motion.div
                      key={msg.id}
                      className={`chat-message ${isMine ? 'mine' : 'theirs'}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                    >
                      {!isMine && showAvatar && (
                        <div className="chat-msg-avatar">{getInitials(msg.sender_name)}</div>
                      )}
                      {!isMine && !showAvatar && <div className="chat-msg-avatar-spacer" />}
                      <div className="chat-bubble-wrapper">
                        {showAvatar && !isMine && (
                          <span className="chat-msg-name">{msg.sender_name}</span>
                        )}
                        <div className={`chat-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                          {msg.content}
                        </div>
                        <span className="chat-msg-time">{formatTime(msg.created_at)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="chat-input"
                autoFocus
              />
              <motion.button
                type="submit"
                className="chat-send-btn"
                disabled={!newMessage.trim() || sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSend />
              </motion.button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatPanel;

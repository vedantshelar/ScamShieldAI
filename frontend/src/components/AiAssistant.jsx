// src/components/AiAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiCpu, FiUser, FiShield, FiLifeBuoy, FiMessageSquare } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import styles from './AiAssistant.module.css';

export default function AiAssistant() {
  const [mode, setMode] = useState('pre'); // 'pre' or 'post'
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  const initialMessages = {
    pre: [{ sender: 'ai', text: 'Hello! I am your Pre-Scam Shield. Paste a suspicious message, link, or describe a weird phone call, and I will tell you if it is safe to engage.' }],
    post: [{ sender: 'ai', text: 'I am here to help you recover. Have you lost money, clicked a malicious link, or shared sensitive information? Tell me what happened so we can secure your accounts immediately.' }]
  };

  const [messages, setMessages] = useState(initialMessages.pre);

  const quickPrompts = {
    pre: [
      "Is this FedEx tracking link safe?",
      "Someone claiming to be CBI called me.",
      "Got a WhatsApp job offer for ₹5000/day."
    ],
    post: [
      "I accidentally shared my OTP!",
      "I clicked a fake bank link, what now?",
      "I paid a customs fine to a scammer."
    ]
  };

// ==========================================
  // DYNAMIC HISTORY FETCHING
  // ==========================================
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        // 🌟 Add ?type=${mode} to the URL so Node knows which tab is active!
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chat/history?type=${mode}`, {
          withCredentials: true 
        });

        if (response.data && response.data.length > 0) {
          const dbHistory = response.data.map(chat => ({
            sender: chat.role === 'ai' ? 'ai' : 'user',
            text: chat.message 
          }));
          setMessages(dbHistory);
        } else {
          // If the database is empty for this specific tab, show the default greeting
          setMessages(initialMessages[mode]);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchChatHistory();
  }, [mode]); // 🌟 CRITICAL: Adding 'mode' here means this runs every time the tab changes!

  // Switch modes
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setInputText('');
    // Notice we removed setMessages() from here, because the useEffect above 
    // will automatically handle fetching and setting the correct messages!
  };

  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      if (mode === 'pre') {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/chat/pre-scam`,
          { message: text },
          { withCredentials: true } 
        );

        setMessages([...newMessages, { sender: 'ai', text: response.data.reply }]);

      } else {
        // --- REAL BACKEND CONNECTION FOR POST-SCAM ---
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/chat/post-scam`,
          { message: text },
          { withCredentials: true } 
        );

        setMessages([...newMessages, { sender: 'ai', text: response.data.reply }]);
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      const errorMsg = error.response?.data?.error || "I'm having trouble connecting to the security server right now.";
      setMessages([...newMessages, { sender: 'ai', text: `❌ ${errorMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>AI Help Desk</h2>
          <p className={styles.subtitle}>Context-aware assistance for prevention and recovery.</p>
        </div>

        <div className={styles.modeToggle}>
          <button
            className={mode === 'pre' ? styles.activeTogglePre : styles.inactiveToggle}
            onClick={() => handleModeSwitch('pre')}
          >
            <FiShield className={styles.toggleIcon} /> Pre-Scam Shield
          </button>
          <button
            className={mode === 'post' ? styles.activeTogglePost : styles.inactiveToggle}
            onClick={() => handleModeSwitch('post')}
          >
            <FiLifeBuoy className={styles.toggleIcon} /> Post-Scam Recovery
          </button>
        </div>
      </div>

      <div className={styles.chatWindow}>
        <div className={styles.messageArea}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender === 'user' ? styles.messageRowUser : styles.messageRowAi}>

              {msg.sender === 'ai' && (
                <div className={styles.avatarAi}>
                  <FiCpu />
                </div>
              )}

              <div className={msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi}>
                {msg.sender === 'ai' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className={styles.avatarUser}>
                  <FiUser />
                </div>
              )}

            </div>
          ))}

          {isTyping && (
            <div className={styles.messageRowAi}>
              <div className={styles.avatarAi}><FiCpu /></div>
              <div className={styles.bubbleAi}>
                <div className={styles.typingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.quickPrompts}>
            {quickPrompts[mode].map((prompt, index) => (
              <button
                key={index}
                className={styles.promptChip}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
              >
                <FiMessageSquare className={styles.chipIcon} /> {prompt}
              </button>
            ))}
          </div>

          <div className={styles.inputBox}>
            <input
              type="text"
              className={styles.textInput}
              placeholder={mode === 'pre' ? "Ask about a suspicious message..." : "Describe what happened..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button
              className={styles.sendButton}
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
            >
              <FiSend />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
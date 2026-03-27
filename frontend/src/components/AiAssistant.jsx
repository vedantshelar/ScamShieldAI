// src/components/AiAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios'; // 🌟 Add Axios
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

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setMessages(initialMessages[newMode]);
    setInputText('');
  };

  // 🌟 Upgraded to async function
  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;

    // 1. Instantly show the user's message on the screen
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      if (mode === 'pre') {
        // 2. REAL BACKEND CONNECTION FOR PRE-SCAM
        const response = await axios.post(
          'http://localhost:4000/api/chat/pre-scam',
          { message: text },
          { withCredentials: true } // CRITICAL: Sends the JWT cookie so Node knows who is chatting!
        );

        // Append Groq's real answer to the chat
        setMessages([...newMessages, { sender: 'ai', text: response.data.reply }]);

      } else {
        // 3. PLACEHOLDER FOR POST-SCAM (Until we build the next route!)
        setTimeout(() => {
          setMessages([...newMessages, {
            sender: 'ai',
            text: "⚠️ I am the Post-Scam bot. My backend route hasn't been built yet, but I'll be ready soon!"
          }]);
          setIsTyping(false);
        }, 1000);
        return; // Exit early so we don't hit the finally block for the timeout
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      // If they aren't logged in, or the server crashes, show the error right in the chat!
      const errorMsg = error.response?.data?.error || "I'm having trouble connecting to the security server right now.";
      setMessages([...newMessages, { sender: 'ai', text: `❌ ${errorMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

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

              {/* <div className={msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi}>
                {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div> */}
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
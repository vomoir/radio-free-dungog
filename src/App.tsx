import React, { useEffect, useState, useRef } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { useMessageStore, initMessageListener } from './store/useMessageStore';
import type { MessageType } from './store/useMessageStore';
import { LogOut, Send, Music, HelpCircle, MessageSquare, Trash2, ShieldOff, Radio, Eye, EyeOff } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const { user, isAdmin, loading } = useAuthStore();
  const { 
    messages, 
    sendMessage, 
    deleteMessage, 
    blockUser, 
    fetchBlockedUsers,
    blockedUsers,
    clearAllMessages
  } = useMessageStore();
  
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (user) {
      requestNotificationPermission();
      
      const unsubscribe = initMessageListener();
      fetchBlockedUsers();

      // We need to handle notifications inside the store or a separate effect
      // but for simplicity, we'll monitor the messages here
      return () => unsubscribe();
    }
  }, [user, fetchBlockedUsers]);

  // Handle Notifications for new messages
  useEffect(() => {
    if (messages.length > 0) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      const lastMessage = messages[messages.length - 1];
      
      // Notify if:
      // 1. Message is not from current user
      // 2. Browser supports Notifications and permission is granted
      // 3. Document is hidden (user is in another app/tab)
      if (
        lastMessage.userId !== user?.uid && 
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        new Notification(`RFD: ${lastMessage.userName}`, {
          body: lastMessage.text,
          icon: lastMessage.userPhoto || '/pwa-192x192.png'
        });
      }
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    
    try {
      await sendMessage(inputText, messageType, user);
      setInputText('');
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="login-container">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="login-container">
        <img src="/che_tony.png" alt="Radio Free Dungog" className="login-logo" />
        <h1>Radio Free Dungog</h1>
        <p>Connect with your local host in real-time.</p>
        
        <form onSubmit={handleEmailAuth} style={{ width: '100%', maxWidth: '300px', marginTop: '2rem' }}>
          <input 
            type="email" 
            placeholder="Email" 
            className="btn btn-outline"
            style={{ marginBottom: '0.5rem', textAlign: 'left' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-container" style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="btn btn-outline"
              style={{ textAlign: 'left', marginBottom: 0, paddingRight: '2.5rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary">
            {isSignUp ? 'Create Account' : 'Login'}
          </button>
          
          <p 
            style={{ fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Login' : 'New here? Create an account'}
          </p>
        </form>

        <div style={{ margin: '1rem 0' }}>OR</div>

        <button onClick={handleGoogleLogin} className="btn btn-outline" style={{ maxWidth: '300px' }}>
          Sign in with Google
        </button>
        
        {authError && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.8rem' }}>{authError}</p>}
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={24} />
          <strong>Radio Free Dungog</strong>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && (
            <button 
              onClick={() => {
                if (window.confirm('Delete all messages? This cannot be undone.')) {
                  clearAllMessages();
                }
              }}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Clear All Messages"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={() => signOut(auth)} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.userId === user.uid;
          const isBlocked = blockedUsers.includes(msg.userId);

          if (isBlocked && !isAdmin) return null;

          return (
            <div key={msg.id} className={`message ${isOwn ? 'own' : ''}`}>
              {!isOwn && (
                <img 
                  src={msg.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} 
                  alt="avatar" 
                  className="avatar" 
                />
              )}
              <div className="message-bubble">
                <span className="message-type">
                  {msg.type === 'question' && <HelpCircle size={10} />}
                  {msg.type === 'request' && <Music size={10} />}
                  {msg.type === 'general' && <MessageSquare size={10} />}
                  {` ${msg.type}`}
                </span>
                {!isOwn && <span className="message-sender">{msg.userName}</span>}
                <div>{msg.text}</div>
                
                {isAdmin && !isOwn && (
                  <div className="admin-actions">
                    <span className="admin-action-btn" onClick={() => deleteMessage(msg.id)}>
                      <Trash2 size={12} /> Delete
                    </span>
                    {!isBlocked && (
                      <span className="admin-action-btn" onClick={() => blockUser(msg.userId)}>
                        <ShieldOff size={12} /> Block User
                      </span>
                    )}
                    {isBlocked && <span style={{ color: 'var(--danger)' }}>(Blocked)</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="type-selector">
          {(['general', 'question', 'request'] as MessageType[]).map((t) => (
            <button
              key={t}
              className={`type-btn ${messageType === t ? 'active' : ''}`}
              onClick={() => setMessageType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="btn btn-outline"
            style={{ flex: 1, textAlign: 'left', marginBottom: 0 }}
            placeholder={
              messageType === 'question' ? 'Ask a question...' :
              messageType === 'request' ? 'Request a song...' : 'Say something...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', marginBottom: 0 }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;

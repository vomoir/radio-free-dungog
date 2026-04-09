import React, { useEffect, useState, useRef } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { useMessageStore, initMessageListener, MessageType } from './store/useMessageStore';
import { LogOut, Send, Music, HelpCircle, MessageSquare, Trash2, ShieldOff, Radio } from 'lucide-react';
import './App.css';

const App: React.FC = () => {
  const { user, isAdmin, loading } = useAuthStore();
  const { 
    messages, 
    sendMessage, 
    deleteMessage, 
    blockUser, 
    fetchBlockedUsers,
    blockedUsers 
  } = useMessageStore();
  
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('general');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = initMessageListener();
      fetchBlockedUsers();
      return () => unsubscribe();
    }
  }, [user, fetchBlockedUsers]);

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If user doesn't exist, create them (simple flow for this app)
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createErr: any) {
          setAuthError(createErr.message);
        }
      } else {
        setAuthError(error.message);
      }
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
        <Radio size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h1>Radio Free Dungog</h1>
        <p>Connect with your local host in real-time.</p>
        
        <form onSubmit={handleEmailLogin} style={{ width: '100%', maxWidth: '300px', marginTop: '2rem' }}>
          <input 
            type="email" 
            placeholder="Email" 
            className="btn btn-outline"
            style={{ marginBottom: '0.5rem', textAlign: 'left' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="btn btn-outline"
            style={{ marginBottom: '1rem', textAlign: 'left' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Login / Sign Up</button>
        </form>

        <div style={{ margin: '1rem 0' }}>OR</div>

        <button onClick={handleGoogleLogin} className="btn btn-outline" style={{ maxWidth: '300px' }}>
          Sign in with Google
        </button>
        
        {authError && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{authError}</p>}
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
        <button 
          onClick={() => signOut(auth)} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          <LogOut size={20} />
        </button>
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
                  {msg.type === 'question' && <HelpCircle size={10} inline />}
                  {msg.type === 'request' && <Music size={10} inline />}
                  {msg.type === 'general' && <MessageSquare size={10} inline />}
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

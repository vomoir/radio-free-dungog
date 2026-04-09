import { create } from 'zustand';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type MessageType = 'general' | 'question' | 'request';

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  type: MessageType;
  createdAt: any;
}

interface MessageState {
  messages: Message[];
  blockedUsers: string[];
  setMessages: (messages: Message[]) => void;
  sendMessage: (text: string, type: MessageType, user: any) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'rfd_interaction_log';

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  blockedUsers: [],

  setMessages: (messages) => {
    set({ messages });
    // Persistence: Log of interactions in localstorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  },

  sendMessage: async (text, type, user) => {
    if (get().blockedUsers.includes(user.uid)) {
      throw new Error('You are blocked from sending messages.');
    }

    await addDoc(collection(db, 'messages'), {
      text,
      type,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      createdAt: serverTimestamp(),
    });
  },

  deleteMessage: async (messageId) => {
    await deleteDoc(doc(db, 'messages', messageId));
  },

  blockUser: async (userId) => {
    await setDoc(doc(db, 'blocked_users', userId), {
      blockedAt: serverTimestamp(),
    });
    set((state) => ({ blockedUsers: [...state.blockedUsers, userId] }));
  },

  fetchBlockedUsers: async () => {
    const querySnapshot = await getDocs(collection(db, 'blocked_users'));
    const blockedIds = querySnapshot.docs.map((doc) => doc.id);
    set({ blockedUsers: blockedIds });
  },
}));

// Initialize real-time listener for messages
export const initMessageListener = () => {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    useMessageStore.getState().setMessages(messages);
  });
};

import { create } from 'zustand'
import axios from "axios"
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent?: string
  createdAt: Date
}

interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

interface ConversationStore {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  addMessage: (conversationId: string, message: Message) => void
  setCurrentConversation: (id: string | null) => void
  createConversation: (userId: string, title: string) => Promise<Conversation>
  loadConversations: (userId: string) => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],

  addMessage: (convId, message) =>
    set(state => ({
      messages: state.messages.some(m => m.id === message.id)
        ? state.messages.map(m =>
            m.id === message.id ? message : m
          )
        : [...state.messages, message],
    })
  )
,

  setCurrentConversation: (id) => {
    set({ currentConversationId: id, messages: [] })
    if (id) {
      // Load messages for this conversation
    }
  },

  createConversation: async (userId, title) => {
    // Mock implementation - normally would call API
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      userId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    set((state) => ({
      conversations: [conv, ...state.conversations],
      currentConversationId: conv.id,
      messages: []
    }))
    
    return conv
  },

  loadConversations: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/chat/conversations?userId=${userId}`
      )
      set({ conversations: response.data })
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  },

  loadMessages: async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/chat/conversations/${conversationId}`
      )
      set({ messages: response.data.messages })
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  },
}))

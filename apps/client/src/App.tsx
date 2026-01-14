import { useEffect, useRef, useState } from 'react'
import { useConversationStore } from './store/conversation'

export default function App() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    conversations, 
    currentConversationId, 
    messages, 
    addMessage,
    setCurrentConversation,
    createConversation 
  } = useConversationStore()

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    e.preventDefault()
    if (!input.trim()) return

    const userId = 'user-1'
    
    // Create conversation if needed
    let convId = currentConversationId
    if (!convId) {
      const conv = await createConversation(userId, input.substring(0, 50))
      convId = conv.id
    }

    // Add user message
    addMessage(convId, {
      id: userMessageId,
      role: 'user',
      content: input,
      agent: 'user',
      createdAt: new Date(),
    });


    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chat/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: convId,
            userId,
            content: input,
          }),
        }
      )

      if (!res.body) {
        throw new Error('No response body')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let fullResponse = ''

  // insert placeholder assistant message
    addMessage(convId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      agent: 'ai',
      createdAt: new Date(),
    });


      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          const payload = line.replace('data:', '').trim()
          if (!payload) continue

          const data = JSON.parse(payload)

          if (data.text) {
            fullResponse += data.text;

            addMessage(convId, {
            id: assistantMessageId, // ✅ UNIQUE
            role: 'assistant',
            content: fullResponse,
            agent: 'ai',
            createdAt: new Date(),
            });
          }


          if (data.done) {
            setIsTyping(false)
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage(convId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error: Could not process your request.',
        agent: 'error',
        createdAt: new Date(),
      })
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }


  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🤖 AI Support</h1>
          <button 
            className="new-chat-btn"
            onClick={() => setCurrentConversation(null)}
          >
            + New Chat
          </button>
        </div>

        <div className="conversations">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => setCurrentConversation(conv.id)}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <h2>{currentConversation?.title || 'New Conversation'}</h2>
        </div>

        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
              <div className="message-meta">
                {msg.agent && <span className="agent-badge">{msg.agent}</span>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

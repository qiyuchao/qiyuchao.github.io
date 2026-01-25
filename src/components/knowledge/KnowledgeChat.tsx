import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function KnowledgeChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load conversation history from localStorage
    const saved = localStorage.getItem('knowledge-chat-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        )
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Save conversation history to localStorage
    if (messages.length > 0) {
      localStorage.setItem('knowledge-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          history: messages.slice(-5), // Send last 5 messages for context
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        toast.error('查询失败，请重试')
      }
    } catch (error) {
      console.error('Query error:', error)
      toast.error('查询出错，请重试')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem('knowledge-chat-history')
    toast.success('对话历史已清除')
  }

  return (
    <div className="bg-bg-secondary rounded-lg border border-primary h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-primary flex justify-between items-center">
        <h3 className="font-semibold">知识问答</h3>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-secondary hover:text-primary"
          >
            清除历史
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-secondary py-8">
            <p>向知识库提问，获取答案</p>
            <p className="text-sm mt-2">例如：什么是知识库？</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-primary border border-primary'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('zh-CN')}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-primary border border-primary px-4 py-2 rounded-lg">
              <p className="animate-pulse">思考中...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-primary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 px-3 py-2 border border-primary rounded-lg bg-bg-primary"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  )
}

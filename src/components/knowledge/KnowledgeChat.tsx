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
      // For static sites, we perform client-side search
      // In a server environment, this would call the API
      
      // Simple keyword-based search
      const keywords = input.toLowerCase().split(/\s+/).filter((k) => k.length > 1)
      
      // Get knowledge from page metadata (would need to be passed as prop)
      // For now, provide a helpful response
      let answer = ''
      
      if (input.toLowerCase().includes('什么') || input.toLowerCase().includes('介绍')) {
        answer = '知识库是一个私人的知识管理系统，您可以：\n\n' +
          '1. 上传和存储各种知识文档\n' +
          '2. 通过搜索快速找到所需信息\n' +
          '3. 向知识库提问并获取答案\n' +
          '4. 系统会从对话中学习改进\n\n' +
          '当前您的知识库中有相关内容，请查看知识条目列表。'
      } else if (input.toLowerCase().includes('如何') || input.toLowerCase().includes('怎么')) {
        answer = '使用知识库很简单：\n\n' +
          '1. **上传知识**：点击"上传知识"按钮，填写标题和内容\n' +
          '2. **浏览知识**：在知识条目列表中查看所有已保存的知识\n' +
          '3. **搜索查询**：使用关键词搜索相关内容\n' +
          '4. **提问交流**：在这里提出问题，获取答案\n\n' +
          '系统会记住对话历史，提供更好的服务。'
      } else {
        // Generic search response
        answer = `我理解您在询问关于"${input}"的问题。\n\n` +
          '由于这是静态站点的演示版本，搜索功能有限。建议：\n\n' +
          '1. 查看知识库中的所有条目\n' +
          '2. 使用更具体的关键词\n' +
          '3. 浏览相关分类和标签\n\n' +
          '如果需要更强大的搜索和问答功能，可以考虑集成服务器端 API 或 AI 服务。'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
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

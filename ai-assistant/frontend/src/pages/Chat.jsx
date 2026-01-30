import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationService } from '../services/api';
import { Send, Plus, Trash2, Loader } from 'lucide-react';

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (id) {
      loadConversation(id);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationService.getAll(1, 50);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (convId) => {
    try {
      setLoading(true);
      const response = await conversationService.getById(convId);
      setCurrentConversation(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await conversationService.create({
        title: '新对话',
        source: 'web',
      });
      await loadConversations();
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const deleteConversation = async (convId) => {
    if (!confirm('确定要删除这个对话吗？')) return;

    try {
      await conversationService.delete(convId);
      await loadConversations();
      if (id === convId) {
        navigate('/chat');
        setMessages([]);
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // 添加用户消息到UI
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      created_at: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await conversationService.sendMessage({
        conversationId: id,
        message: userMessage,
      });

      // 如果是新对话，导航到该对话
      if (!id) {
        navigate(`/chat/${response.data.conversationId}`);
      }

      // 更新消息列表
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...filtered,
          { ...tempUserMsg, id: tempUserMsg.id.replace('temp-', 'user-') },
          response.data.message,
        ];
      });

      // 刷新对话列表
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('发送消息失败: ' + error.message);
      // 移除临时消息
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conversation list */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>新对话</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                id === conv.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => navigate(`/chat/${conv.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{conv.title}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{conv.last_message}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(conv.updated_at * 1000).toLocaleString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {id ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-gray-400" size={32} />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 shadow'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg px-4 py-3 shadow">
                        <Loader className="animate-spin text-gray-400" size={20} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={sendMessage} className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">选择或创建对话</h2>
              <p className="text-gray-500">从左侧列表选择对话，或创建新对话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;

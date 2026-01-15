import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  storePDF,
  getAllPDFs,
  deletePDF,
  storeConversation,
  getConversations,
  searchInText,
  generateAnswer,
  getPDF,
} from '@/utils/pdfMemory'
import { extractTextFromPDF, validatePDFFile } from '@/utils/pdfProcessor'

interface PDF {
  id: string
  name: string
  content: string
  uploadDate: number
  chunks: string[]
}

interface Conversation {
  id: number
  pdfId: string
  question: string
  answer: string
  timestamp: number
}

export default function PDFQAPanel() {
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [question, setQuestion] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPDFs()
  }, [])

  useEffect(() => {
    if (selectedPDF) {
      loadConversations(selectedPDF)
    } else {
      setConversations([])
    }
  }, [selectedPDF])

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadPDFs = async () => {
    try {
      const allPDFs = await getAllPDFs()
      setPdfs(allPDFs)
    } catch (error) {
      console.error('Error loading PDFs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadConversations = async (pdfId: string) => {
    try {
      const convs = await getConversations(pdfId)
      setConversations(convs)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!validatePDFFile(file)) {
      toast.error('请上传有效的PDF文件（最大10MB）')
      return
    }

    setIsProcessing(true)
    try {
      const text = await extractTextFromPDF(file)
      const id = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      await storePDF(id, file.name, text)
      await loadPDFs()
      setSelectedPDF(id)
      toast.success('PDF上传成功！')
    } catch (error) {
      console.error('Error uploading PDF:', error)
      toast.error('PDF上传失败，请重试')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePDF = async (id: string) => {
    if (!confirm('确定要删除这个PDF吗？相关的对话记录也会被删除。')) return

    try {
      await deletePDF(id)
      await loadPDFs()
      if (selectedPDF === id) {
        setSelectedPDF(null)
      }
      toast.success('PDF已删除')
    } catch (error) {
      console.error('Error deleting PDF:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedPDF) return

    setIsProcessing(true)
    try {
      const pdf = await getPDF(selectedPDF)
      if (!pdf) {
        toast.error('找不到选定的PDF')
        return
      }

      const relevantChunks = searchInText(pdf.content, question)
      const answer = generateAnswer(relevantChunks, question)

      await storeConversation(selectedPDF, question, answer)
      await loadConversations(selectedPDF)
      setQuestion('')
    } catch (error) {
      console.error('Error processing question:', error)
      toast.error('处理问题时出错，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-text-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: PDF List */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">PDF文档</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3 py-1 bg-[var(--color-accent)] text-white rounded hover:opacity-80 disabled:opacity-50 text-sm"
              >
                上传
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {pdfs.length === 0 ? (
                <p className="text-[var(--color-text-secondary)] text-sm text-center py-8">
                  还没有上传任何PDF文档
                </p>
              ) : (
                pdfs.map((pdf) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedPDF === pdf.id
                        ? 'bg-[var(--color-accent)] bg-opacity-20 border-2 border-[var(--color-accent)]'
                        : 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                    onClick={() => setSelectedPDF(pdf.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {pdf.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {new Date(pdf.uploadDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePDF(pdf.id)
                        }}
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Q&A Interface */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm h-[700px] flex flex-col">
            {!selectedPDF ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-[var(--color-text-secondary)]">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg mb-2">请选择或上传一个PDF文档</p>
                  <p className="text-sm">选择PDF后，您可以向其提问并获得基于内容的回答</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversations.length === 0 ? (
                    <div className="text-center text-[var(--color-text-secondary)] py-12">
                      <p>开始提问吧！我会根据PDF内容为您解答。</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {conversations.map((conv) => (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="space-y-2"
                        >
                          {/* Question */}
                          <div className="flex justify-end">
                            <div className="bg-[var(--color-accent)] bg-opacity-20 rounded-lg p-3 max-w-[80%]">
                              <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                                {conv.question}
                              </p>
                            </div>
                          </div>

                          {/* Answer */}
                          <div className="flex justify-start">
                            <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 max-w-[80%]">
                              <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                                {conv.answer}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                                {new Date(conv.timestamp).toLocaleTimeString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-[var(--color-border-primary)] p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入您的问题..."
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                    />
                    <button
                      onClick={handleAskQuestion}
                      disabled={!question.trim() || isProcessing}
                      className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity"
                    >
                      {isProcessing ? '处理中...' : '发送'}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    提示：按Enter发送，Shift+Enter换行
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-[var(--color-bg-secondary)] rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">功能说明</h3>
        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <li>• 上传PDF文档后，系统会自动提取文本内容并存储在浏览器本地数据库中</li>
          <li>• 所有数据保存在您的浏览器中，具有长期记忆能力，不会丢失</li>
          <li>• 提问时，系统会在PDF内容中搜索相关段落，并生成回答</li>
          <li>• 所有对话历史都会被保存，方便日后查阅</li>
          <li>• 支持上传多个PDF文档，可以分别进行问答</li>
        </ul>
      </div>
    </div>
  )
}

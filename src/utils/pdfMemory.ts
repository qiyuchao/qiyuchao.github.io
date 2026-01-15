import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

interface PDFMemoryDB extends DBSchema {
  pdfs: {
    key: string
    value: {
      id: string
      name: string
      content: string
      uploadDate: number
      chunks: string[]
    }
  }
  conversations: {
    key: number
    value: {
      id: number
      pdfId: string
      question: string
      answer: string
      timestamp: number
    }
    indexes: { 'by-pdf': string }
  }
}

let db: IDBPDatabase<PDFMemoryDB> | null = null

export async function initDB() {
  if (db) return db

  db = await openDB<PDFMemoryDB>('pdf-memory-db', 1, {
    upgrade(db) {
      // Create PDFs store
      if (!db.objectStoreNames.contains('pdfs')) {
        db.createObjectStore('pdfs', { keyPath: 'id' })
      }

      // Create conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        const conversationStore = db.createObjectStore('conversations', {
          keyPath: 'id',
          autoIncrement: true,
        })
        conversationStore.createIndex('by-pdf', 'pdfId')
      }
    },
  })

  return db
}

export async function storePDF(id: string, name: string, content: string) {
  const database = await initDB()
  const chunks = chunkText(content, 1000) // Split into chunks of ~1000 characters

  await database.put('pdfs', {
    id,
    name,
    content,
    uploadDate: Date.now(),
    chunks,
  })

  return id
}

export async function getPDF(id: string) {
  const database = await initDB()
  return await database.get('pdfs', id)
}

export async function getAllPDFs() {
  const database = await initDB()
  return await database.getAll('pdfs')
}

export async function deletePDF(id: string) {
  const database = await initDB()
  await database.delete('pdfs', id)

  // Delete associated conversations
  const conversations = await database.getAllFromIndex('conversations', 'by-pdf', id)
  for (const conv of conversations) {
    await database.delete('conversations', conv.id)
  }
}

export async function storeConversation(pdfId: string, question: string, answer: string) {
  const database = await initDB()
  const conversation = {
    pdfId,
    question,
    answer,
    timestamp: Date.now(),
  }
  await database.add('conversations', conversation)
}

export async function getConversations(pdfId: string) {
  const database = await initDB()
  return await database.getAllFromIndex('conversations', 'by-pdf', pdfId)
}

export async function getAllConversations() {
  const database = await initDB()
  return await database.getAll('conversations')
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  let currentChunk = ''
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += sentence
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

export function searchInText(text: string, query: string): string[] {
  const queryLower = query.toLowerCase()
  const chunks = chunkText(text, 500)
  const relevantChunks: { chunk: string; score: number }[] = []

  for (const chunk of chunks) {
    const chunkLower = chunk.toLowerCase()
    const words = queryLower.split(/\s+/)
    let score = 0

    for (const word of words) {
      if (chunkLower.includes(word)) {
        score += 1
      }
    }

    if (score > 0) {
      relevantChunks.push({ chunk, score })
    }
  }

  // Sort by relevance score
  relevantChunks.sort((a, b) => b.score - a.score)

  return relevantChunks.slice(0, 5).map((item) => item.chunk)
}

export function generateAnswer(relevantChunks: string[], question: string): string {
  if (relevantChunks.length === 0) {
    return '抱歉，我在PDF中找不到与您的问题相关的内容。请尝试用不同的方式提问。'
  }

  const context = relevantChunks.join('\n\n')
  const answer = `根据PDF内容，以下是相关信息：\n\n${context}\n\n注：以上内容摘自PDF文档中与"${question}"相关的部分。`

  return answer
}

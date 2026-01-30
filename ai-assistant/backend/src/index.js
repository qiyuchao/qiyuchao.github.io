import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';

// Import routes
import conversationRoutes from './routes/conversations.js';
import documentRoutes from './routes/documents.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';

// Import services
import { initTelegramBot } from './services/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
const dbPath = process.env.DATABASE_PATH || './data/assistant.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    source TEXT DEFAULT 'web',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    content TEXT,
    page_count INTEGER,
    file_size INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
`);

// Initialize default settings
const defaultSettings = {
  ai_provider: process.env.AI_PROVIDER || 'iflow',
  ai_model: 'gpt-3.5-turbo',
  telegram_enabled: process.env.TELEGRAM_ENABLED === 'true',
  max_context_messages: '10',
  system_prompt:
    '你是一个智能的个人助理，可以学习用户的对话历史和上传的文档。请尽可能提供有帮助、准确和友好的回答。',
};

for (const [key, value] of Object.entries(defaultSettings)) {
  const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!existing) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

// Create uploads directory
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'AI Personal Assistant API',
    version: '1.0.0',
    endpoints: {
      conversations: {
        'GET /api/conversations': '获取对话列表',
        'POST /api/conversations': '创建新对话',
        'GET /api/conversations/:id': '获取对话详情',
        'DELETE /api/conversations/:id': '删除对话',
        'POST /api/conversations/message': '发送消息并获取AI回复',
      },
      documents: {
        'GET /api/documents': '获取文档列表',
        'POST /api/documents/upload': '上传PDF文档',
        'DELETE /api/documents/:id': '删除文档',
      },
      settings: {
        'GET /api/settings': '获取设置',
        'PUT /api/settings': '更新设置',
      },
      stats: {
        'GET /api/stats': '获取统计信息',
      },
    },
  });
});

// Initialize Telegram bot if enabled
if (process.env.TELEGRAM_ENABLED === 'true' && process.env.TELEGRAM_BOT_TOKEN) {
  initTelegramBot();
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Assistant Backend running on http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'iflow'}`);
  console.log(
    `📱 Telegram Bot: ${process.env.TELEGRAM_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`
  );
});

export default app;

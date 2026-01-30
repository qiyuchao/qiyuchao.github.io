import express from 'express';
import { db } from '../index.js';
import aiService from '../services/ai.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * GET /api/conversations
 * 获取对话列表
 */
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conversations = db
      .prepare(
        `
      SELECT 
        c.*,
        COUNT(m.id) as message_count,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM conversations').get();

    res.json({
      conversations,
      pagination: {
        page,
        limit,
        total: total.count,
        pages: Math.ceil(total.count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations
 * 创建新对话
 */
router.post('/', (req, res) => {
  try {
    const { title, source } = req.body;
    const id = uuidv4();
    const now = Date.now();

    db.prepare(
      'INSERT INTO conversations (id, title, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, title || '新对话', source || 'web', now, now);

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id
 * 获取对话详情（包含所有消息）
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(id);

    res.json({
      ...conversation,
      messages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/conversations/:id
 * 删除对话
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 删除对话（消息会因为外键约束自动删除）
    const result = db.prepare('DELETE FROM conversations WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/message
 * 发送消息并获取AI回复
 */
router.post('/message', async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 如果没有提供conversationId，创建新对话
    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      db.prepare(
        'INSERT INTO conversations (id, title, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(convId, '新对话', 'web', Date.now(), Date.now());
    }

    // 保存用户消息
    const userMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userMessageId, convId, 'user', message, Date.now());

    // 获取对话历史（最近10条消息）
    const maxContextMessages = parseInt(
      db.prepare("SELECT value FROM settings WHERE key = 'max_context_messages'").get()?.value ||
        '10'
    );

    const historyMessages = db
      .prepare(
        `SELECT role, content FROM messages 
         WHERE conversation_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`
      )
      .all(convId, maxContextMessages)
      .reverse();

    // 获取系统提示
    const systemPromptRow = db
      .prepare("SELECT value FROM settings WHERE key = 'system_prompt'")
      .get();
    const systemPrompt =
      systemPromptRow?.value || '你是一个智能的个人助理，请提供有帮助的回答。';

    // 获取所有文档内容作为上下文
    const documents = db.prepare('SELECT filename, content FROM documents').all();

    // 构建消息数组
    let messages = [{ role: 'system', content: systemPrompt }];

    // 如果有文档，添加文档上下文
    if (documents.length > 0) {
      const docContext = documents
        .map((doc, idx) => `文档${idx + 1} (${doc.filename}):\n${doc.content?.substring(0, 1000)}`)
        .join('\n\n');
      messages.push({
        role: 'system',
        content: `以下是用户上传的文档内容，你可以参考这些内容来回答问题：\n\n${docContext}`,
      });
    }

    messages = [...messages, ...historyMessages];

    // 获取AI回复
    const aiResponse = await aiService.chat(messages);

    // 保存AI回复
    const aiMessageId = uuidv4();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(aiMessageId, convId, 'assistant', aiResponse, Date.now());

    // 更新对话标题（使用第一条用户消息的前50个字符）
    const conversation = db.prepare('SELECT title FROM conversations WHERE id = ?').get(convId);
    if (conversation.title === '新对话') {
      const newTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(newTitle, convId);
    }

    // 更新对话时间
    db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), convId);

    res.json({
      conversationId: convId,
      message: {
        id: aiMessageId,
        role: 'assistant',
        content: aiResponse,
        created_at: Date.now(),
      },
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import { db } from '../index.js';

const router = express.Router();

/**
 * GET /api/stats
 * 获取系统统计信息
 */
router.get('/', (req, res) => {
  try {
    const stats = {
      conversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
      messages: db.prepare('SELECT COUNT(*) as count FROM messages').get().count,
      documents: db.prepare('SELECT COUNT(*) as count FROM documents').get().count,
      totalDocumentSize: db.prepare('SELECT SUM(file_size) as size FROM documents').get().size || 0,
      recentConversations: db
        .prepare('SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 5')
        .all(),
      messagesToday: db
        .prepare(
          `SELECT COUNT(*) as count FROM messages 
           WHERE created_at >= ?`
        )
        .get(Math.floor(Date.now() / 1000) - 86400).count,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

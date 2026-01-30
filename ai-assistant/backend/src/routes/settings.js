import express from 'express';
import { db } from '../index.js';

const router = express.Router();

/**
 * GET /api/settings
 * 获取所有设置
 */
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();

    const settingsObj = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/settings
 * 更新设置
 */
router.put('/', (req, res) => {
  try {
    const updates = req.body;

    const updateStmt = db.prepare(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
    );

    const updateTransaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        updateStmt.run(key, value, Date.now());
      }
    });

    updateTransaction(updates);

    res.json({ message: 'Settings updated successfully', settings: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/settings/:key
 * 获取单个设置
 */
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

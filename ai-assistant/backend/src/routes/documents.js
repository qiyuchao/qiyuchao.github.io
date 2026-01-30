import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../index.js';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只支持PDF文件'));
    }
  },
});

/**
 * GET /api/documents
 * 获取文档列表
 */
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const documents = db
      .prepare(
        `
      SELECT id, filename, original_name, page_count, file_size, created_at
      FROM documents
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM documents').get();

    res.json({
      documents,
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
 * POST /api/documents/upload
 * 上传PDF文档
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // 解析PDF
    const pdfData = await pdfParse(fileBuffer);

    // 保存到数据库
    const id = uuidv4();
    db.prepare(
      `INSERT INTO documents (id, filename, original_name, content, page_count, file_size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.file.filename,
      req.file.originalname,
      pdfData.text,
      pdfData.numpages,
      req.file.size,
      Date.now()
    );

    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

    res.status(201).json({
      message: '文档上传成功',
      document: {
        ...document,
        content: undefined, // 不返回完整内容
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: `上传失败: ${error.message}` });
  }
});

/**
 * GET /api/documents/:id
 * 获取文档详情（包含内容）
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/documents/:id
 * 删除文档
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // 获取文档信息
    const document = db.prepare('SELECT filename FROM documents WHERE id = ?').get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // 删除数据库记录
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    // 删除文件
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { db } from '../index.js';
import aiService from './ai.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

let bot = null;

/**
 * 初始化Telegram机器人
 */
export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('⚠️  Telegram bot token not found. Telegram integration disabled.');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    // 处理 /start 命令
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(
        chatId,
        '👋 你好！我是你的个人AI助理。\n\n' +
          '你可以直接向我提问，我会记录所有对话并不断学习。\n\n' +
          '可用命令：\n' +
          '/start - 开始使用\n' +
          '/new - 开始新对话\n' +
          '/help - 获取帮助'
      );
    });

    // 处理 /help 命令
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(
        chatId,
        '📖 帮助信息\n\n' +
          '直接发送消息给我，我会回答你的问题。\n' +
          '所有对话都会被记录和学习。\n\n' +
          '你也可以在Web界面管理对话和上传文档：\n' +
          'http://localhost:3000'
      );
    });

    // 处理 /new 命令 - 开始新对话
    bot.onText(/\/new/, (msg) => {
      const chatId = msg.chat.id;
      const conversationId = uuidv4();

      // 创建新对话
      db.prepare(
        'INSERT INTO conversations (id, title, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(
        conversationId,
        `Telegram Chat - ${new Date().toLocaleString('zh-CN')}`,
        `telegram_${chatId}`,
        Date.now(),
        Date.now()
      );

      bot.sendMessage(chatId, '✨ 已开始新对话！请继续提问。');
    });

    // 处理普通消息
    bot.on('message', async (msg) => {
      // 忽略命令
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) {
        return;
      }

      try {
        // 发送"正在输入"状态
        bot.sendChatAction(chatId, 'typing');

        // 获取或创建对话
        const source = `telegram_${chatId}`;
        let conversation = db
          .prepare('SELECT * FROM conversations WHERE source = ? ORDER BY updated_at DESC LIMIT 1')
          .get(source);

        if (!conversation) {
          const conversationId = uuidv4();
          db.prepare(
            'INSERT INTO conversations (id, title, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
          ).run(
            conversationId,
            `Telegram Chat - ${new Date().toLocaleString('zh-CN')}`,
            source,
            Date.now(),
            Date.now()
          );
          conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
        }

        // 保存用户消息
        const userMessageId = uuidv4();
        db.prepare(
          'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(userMessageId, conversation.id, 'user', text, Date.now());

        // 获取对话历史
        const historyMessages = db
          .prepare(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 10'
          )
          .all(conversation.id)
          .reverse();

        // 获取系统提示
        const systemPromptRow = db
          .prepare("SELECT value FROM settings WHERE key = 'system_prompt'")
          .get();
        const systemPrompt =
          systemPromptRow?.value || '你是一个智能的个人助理，请提供有帮助的回答。';

        // 构建消息数组
        const messages = [{ role: 'system', content: systemPrompt }, ...historyMessages];

        // 获取AI回复
        const aiResponse = await aiService.chat(messages);

        // 保存AI回复
        const aiMessageId = uuidv4();
        db.prepare(
          'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(aiMessageId, conversation.id, 'assistant', aiResponse, Date.now());

        // 更新对话时间
        db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(
          Date.now(),
          conversation.id
        );

        // 发送回复
        bot.sendMessage(chatId, aiResponse);
      } catch (error) {
        console.error('Telegram bot error:', error);
        bot.sendMessage(chatId, `❌ 抱歉，处理消息时出错了：${error.message}`);
      }
    });

    console.log('✅ Telegram bot initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error);
  }
}

/**
 * 获取机器人实例
 */
export function getBot() {
  return bot;
}

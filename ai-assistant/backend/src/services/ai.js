import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AI Service - 统一的AI API调用接口
 * 支持多种AI提供商：iFlow, OpenAI, Groq等
 */

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'iflow';
    this.apiKey = this.getApiKey();
    this.apiUrl = this.getApiUrl();
  }

  getApiKey() {
    switch (this.provider) {
      case 'iflow':
        return process.env.IFLOW_API_KEY;
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'groq':
        return process.env.GROQ_API_KEY;
      default:
        return process.env.IFLOW_API_KEY;
    }
  }

  getApiUrl() {
    switch (this.provider) {
      case 'iflow':
        return process.env.IFLOW_API_URL || 'https://api.iflow.com/v1/chat/completions';
      case 'openai':
        return process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
      case 'groq':
        return process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
      default:
        return process.env.IFLOW_API_URL || 'https://api.iflow.com/v1/chat/completions';
    }
  }

  /**
   * 调用AI API获取回复
   * @param {Array} messages - 消息历史数组
   * @param {Object} options - 额外选项（模型、温度等）
   * @returns {Promise<string>} AI回复内容
   */
  async chat(messages, options = {}) {
    const model = options.model || process.env.AI_MODEL || 'gpt-3.5-turbo';
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 2000;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000, // 30秒超时
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('Invalid response from AI API');
    } catch (error) {
      console.error('AI API Error:', error.response?.status, error.message);

      // 如果是API错误，提供友好的错误信息
      if (error.response?.status === 401) {
        throw new Error('AI API认证失败，请检查API密钥');
      } else if (error.response?.status === 429) {
        throw new Error('AI API请求过于频繁，请稍后再试');
      } else if (error.response?.status === 500) {
        throw new Error('AI API服务器错误，请稍后再试');
      }

      throw new Error(`AI API调用失败: ${error.message}`);
    }
  }

  /**
   * 使用文档上下文生成回复
   * @param {string} query - 用户查询
   * @param {Array} documents - 相关文档内容
   * @param {Array} conversationHistory - 对话历史
   * @returns {Promise<string>} AI回复
   */
  async chatWithContext(query, documents = [], conversationHistory = []) {
    // 构建系统提示，包含文档上下文
    let systemPrompt =
      '你是一个智能的个人助理。你可以访问用户上传的文档内容，请基于这些内容和对话历史来回答问题。';

    if (documents.length > 0) {
      systemPrompt += '\n\n以下是相关的文档内容：\n';
      documents.forEach((doc, index) => {
        systemPrompt += `\n文档 ${index + 1}: ${doc.filename}\n${doc.content}\n`;
      });
    }

    // 构建消息数组
    const messages = [{ role: 'system', content: systemPrompt }, ...conversationHistory];

    return await this.chat(messages);
  }
}

export default new AIService();

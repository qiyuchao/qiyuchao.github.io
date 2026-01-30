# AI Personal Assistant

这是一个功能完整的个人AI助理系统，具有以下特性：

## 功能特性

- 📝 **对话记录与学习**: 自动记录所有对话并进行学习
- 🤖 **Telegram集成**: 通过Telegram与助理进行交互
- 🧠 **AI驱动**: 支持多种AI API（iFlow、OpenAI兼容API等）
- 📚 **PDF学习**: 上传PDF书籍供AI学习和理解
- 🎨 **后台管理界面**: 友好的Web界面进行调试和配置
- 💾 **数据持久化**: 所有对话和文档都被安全存储

## 项目结构

```
ai-assistant/
├── backend/          # Node.js/Express后端服务
│   ├── src/
│   │   ├── routes/   # API路由
│   │   ├── services/ # 业务逻辑
│   │   ├── models/   # 数据模型
│   │   └── utils/    # 工具函数
│   └── package.json
├── frontend/         # React前端界面
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── shared/          # 共享类型和配置
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 安装

```bash
# 安装后端依赖
cd ai-assistant/backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

1. 复制环境变量模板：
```bash
cp ai-assistant/backend/.env.example ai-assistant/backend/.env
```

2. 编辑 `.env` 文件，填入必要的配置：
   - AI API密钥（iFlow或其他）
   - Telegram Bot Token
   - 其他配置项

### 运行

```bash
# 启动后端服务
cd ai-assistant/backend
npm run dev

# 启动前端服务（新终端）
cd ai-assistant/frontend
npm run dev
```

### 访问

- 前端界面: http://localhost:3000
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/api-docs

## 使用指南

### 1. 配置Telegram Bot

1. 在Telegram中找到 @BotFather
2. 创建新机器人并获取Token
3. 将Token添加到 `.env` 文件
4. 在管理界面中激活Telegram集成

### 2. 上传PDF文档

1. 登录管理界面
2. 进入"文档管理"页面
3. 上传PDF文件
4. 系统会自动提取文本并学习

### 3. 开始对话

- 通过Telegram直接与机器人对话
- 或在Web界面的"对话"页面进行交互
- 所有对话都会被记录和学习

## API文档

### 对话API

```
POST /api/conversations
获取对话列表

POST /api/conversations/message
发送消息并获取AI回复

GET /api/conversations/:id
获取特定对话详情
```

### 文档API

```
POST /api/documents/upload
上传PDF文档

GET /api/documents
获取文档列表

DELETE /api/documents/:id
删除文档
```

### 设置API

```
GET /api/settings
获取系统设置

PUT /api/settings
更新系统设置
```

## 技术栈

### 后端
- Node.js + Express
- SQLite（数据存储）
- PDF-Parse（PDF处理）
- node-telegram-bot-api（Telegram集成）
- Axios（API调用）

### 前端
- React
- Tailwind CSS
- Axios（API客户端）
- React Router（路由）

## 部署

### 使用Docker

```bash
docker-compose up -d
```

### 手动部署

```bash
# 构建前端
cd ai-assistant/frontend
npm run build

# 启动后端（生产模式）
cd ../backend
npm start
```

## 免费AI API推荐

1. **iFlow API** - 推荐使用
2. **Ollama** - 本地部署，完全免费
3. **Groq** - 快速且有免费额度
4. **Together.ai** - 支持多种模型
5. **DeepSeek** - 中文友好

## 故障排除

### Telegram连接失败
- 检查Token是否正确
- 确保网络可以访问Telegram API
- 查看后端日志获取详细错误

### PDF上传失败
- 检查文件大小限制
- 确保PDF格式正确
- 查看存储空间是否充足

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

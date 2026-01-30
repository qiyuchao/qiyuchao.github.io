# AI Personal Assistant 部署指南

本指南将帮助你部署和配置AI个人助理系统。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [部署方式](#部署方式)
- [Telegram Bot设置](#telegram-bot设置)
- [AI API配置](#ai-api配置)
- [故障排除](#故障排除)

## 系统要求

- Node.js 18 或更高版本
- npm 或 pnpm
- （可选）Docker 和 Docker Compose

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd ai-assistant/backend
npm install

# 前端
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，至少配置以下项：

```env
# AI API配置（选择一个）
AI_PROVIDER=iflow
IFLOW_API_KEY=your_api_key_here
```

### 3. 启动服务

```bash
# 启动后端（在 backend 目录）
npm run dev

# 启动前端（在 frontend 目录，新终端）
cd ../frontend
npm run dev
```

### 4. 访问应用

- 前端界面: http://localhost:3000
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/api-docs

## 详细配置

### 环境变量说明

#### 后端配置 (backend/.env)

```env
# 服务器配置
PORT=5000                    # 后端服务端口
NODE_ENV=development         # 环境：development 或 production

# AI API配置
AI_PROVIDER=iflow            # AI提供商：iflow, openai, groq
IFLOW_API_KEY=your_key       # iFlow API密钥
IFLOW_API_URL=https://...    # API地址（可选）

# Telegram配置
TELEGRAM_BOT_TOKEN=your_token           # Telegram Bot Token
TELEGRAM_ENABLED=false                  # 是否启用Telegram

# 数据库
DATABASE_PATH=./data/assistant.db       # SQLite数据库路径

# 上传设置
UPLOAD_DIR=./uploads                    # 文件上传目录
MAX_FILE_SIZE=50MB                      # 最大文件大小
```

## 部署方式

### 方式一：使用 Docker Compose（推荐）

最简单的部署方式，自动处理所有依赖。

```bash
cd ai-assistant

# 1. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件

# 2. 启动所有服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

访问 http://localhost:3000

### 方式二：手动部署

#### 生产环境部署

```bash
# 1. 构建前端
cd ai-assistant/frontend
npm install
npm run build

# 2. 配置后端
cd ../backend
npm install --production

# 3. 启动后端
NODE_ENV=production npm start
```

#### 使用 PM2（推荐用于生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动后端
cd ai-assistant/backend
pm2 start src/index.js --name ai-assistant-backend

# 配置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs ai-assistant-backend
```

#### 配置 Nginx（前端）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/ai-assistant/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 代理后端API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Telegram Bot设置

### 1. 创建Telegram Bot

1. 在Telegram中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示输入机器人名称和用户名
4. 获取Bot Token（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 2. 配置Bot Token

在 `backend/.env` 文件中：

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ENABLED=true
```

### 3. 启动并测试

重启后端服务，然后在Telegram中：

1. 搜索你的机器人
2. 发送 `/start` 开始使用
3. 直接发送消息与AI对话

### Bot命令

- `/start` - 开始使用
- `/new` - 开始新对话
- `/help` - 获取帮助

## AI API配置

### 选项一：iFlow API（推荐）

```env
AI_PROVIDER=iflow
IFLOW_API_KEY=your_iflow_api_key
IFLOW_API_URL=https://api.iflow.com/v1/chat/completions
```

### 选项二：Groq（免费，速度快）

1. 访问 https://console.groq.com
2. 注册并获取API密钥
3. 配置：

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
```

### 选项三：Ollama（本地部署，完全免费）

1. 安装Ollama: https://ollama.ai
2. 下载模型: `ollama pull llama2`
3. 配置：

```env
AI_PROVIDER=openai
OPENAI_API_KEY=dummy
OPENAI_API_URL=http://localhost:11434/v1/chat/completions
```

### 选项四：OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
```

## 使用指南

### 上传PDF文档

1. 登录Web界面
2. 进入"文档"页面
3. 点击上传区域选择PDF文件
4. 点击"上传"按钮
5. 系统会自动提取并学习文档内容

### 开始对话

#### 通过Web界面

1. 进入"对话"页面
2. 点击"新对话"按钮
3. 输入消息并发送
4. AI会基于历史对话和上传的文档回答

#### 通过Telegram

1. 在Telegram中找到你的机器人
2. 发送 `/start` 激活
3. 直接发送消息即可

### 调整AI行为

1. 进入"设置"页面
2. 修改"系统提示词"来定义AI的行为
3. 调整"最大上下文消息数"控制对话记忆长度
4. 点击"保存设置"

## 故障排除

### 后端无法启动

**问题**: `Error: Cannot find module 'better-sqlite3'`

**解决**:
```bash
cd ai-assistant/backend
npm install
```

### Telegram Bot无法连接

**问题**: Bot不回复消息

**检查**:
1. Token是否正确配置
2. TELEGRAM_ENABLED是否为true
3. 检查后端日志：`pm2 logs ai-assistant-backend`
4. 确认网络可以访问Telegram API

### PDF上传失败

**问题**: 上传时报错

**检查**:
1. 文件是否为PDF格式
2. 文件大小是否超过50MB
3. uploads目录是否有写入权限
4. 检查后端日志获取详细错误

### AI回复很慢或失败

**问题**: AI回复超时或报错

**检查**:
1. AI API密钥是否正确
2. 网络是否可以访问AI API
3. API是否有额度限制
4. 查看后端日志：`Error: AI API调用失败`

### 前端无法连接后端

**问题**: 前端显示网络错误

**检查**:
1. 后端是否正在运行：`curl http://localhost:5000/api/health`
2. 端口是否被占用
3. 防火墙设置

## 数据备份

### 备份数据库和文件

```bash
cd ai-assistant/backend

# 备份数据库
cp data/assistant.db data/assistant.db.backup

# 备份上传的文件
tar -czf uploads_backup.tar.gz uploads/

# 恢复
cp data/assistant.db.backup data/assistant.db
tar -xzf uploads_backup.tar.gz
```

## 安全建议

1. **不要提交 .env 文件到Git**
   - .env文件已在 .gitignore 中

2. **使用强密钥**
   - SESSION_SECRET应该是随机字符串

3. **限制文件上传**
   - 已限制50MB，可在 .env 中调整

4. **HTTPS部署**
   - 生产环境建议使用HTTPS
   - 可以使用Let's Encrypt免费证书

5. **定期备份**
   - 设置定时任务备份数据库和上传文件

## 性能优化

### 数据库优化

```bash
# 定期清理旧对话
sqlite3 data/assistant.db "DELETE FROM conversations WHERE updated_at < strftime('%s', 'now', '-30 days');"
```

### 日志管理

```bash
# PM2日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 更新升级

```bash
# 1. 备份数据
cp backend/data/assistant.db backend/data/assistant.db.backup

# 2. 拉取最新代码
git pull

# 3. 更新依赖
cd ai-assistant/backend
npm install

cd ../frontend
npm install

# 4. 重启服务
pm2 restart ai-assistant-backend

# 或使用Docker
docker-compose down
docker-compose up -d --build
```

## 获取帮助

如有问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 参考本文档的故障排除部分
4. 提交Issue到GitHub仓库

## 许可证

MIT License

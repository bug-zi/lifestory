# 人生副本 — 你想活出怎样的人生

每天体验一段截然不同的人生。从 500+ 份精选人生副本中，发现你从未想象过的可能。

## 功能概览

### 每日副本
- 每天随机推送一份精选人生故事（6000-8000 字）
- 8-12 个人生阶段，沉浸式阅读体验
- 阅读进度追踪

### DIY 人生创作
- 输入自我介绍后，AI 动态生成个性化问卷（4 道题）
- 基于回答生成独一无二的 6000-8000 字人生故事
- 支持 5 家 AI 提供商：DeepSeek、豆包、智谱、千问、ChatGPT
- 创作完成后可保存至个人库

### 名人堂
- 古今中外约 200 位名人的精彩人生
- 支持分类筛选和搜索

### 个人库
- 收藏喜欢的副本，随时重温
- 查看字数、生成时间等详情
- "稍后再读"功能

### 代币 & 会员
- 双代币体系：阅读代币 + DIY 创作代币
- 终身会员 ¥28，无限畅享全部功能
- 微信支付集成

### 用户系统
- 微信登录 / 邮箱注册
- 个人资料 & 头像上传
- 每日签到领代币

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 后端/数据库 | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI API 兼容接口（多提供商） |
| 部署 | Vercel |

## 项目结构

```
src/
├── app/
│   ├── api/           # API 路由（auth, scripts, diy, library...）
│   ├── (auth)/        # 登录、注册页
│   ├── diy/           # DIY 人生创作
│   ├── hall-of-fame/  # 名人堂
│   ├── library/       # 个人库
│   ├── profile/       # 个人资料
│   ├── read-later/    # 稍后再读
│   └── scripts/       # 副本阅读 & 每日副本
├── components/        # UI 组件（NavBar, ScriptReader, shadcn/ui）
├── hooks/             # 自定义 hooks（useAuth）
├── lib/               # 工具库（supabase, ai-providers, utils）
└── types/             # TypeScript 类型定义

supabase/
├── config.toml
└── migrations/        # 数据库迁移脚本
```

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入真实的 key

# 启动开发服务器
npm run dev
```

### 环境变量

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 |
| `NEXT_PUBLIC_URL` | 应用 URL（本地: http://localhost:3000） |
| `OPENAI_API_KEY` | OpenAI API 密钥（或兼容接口） |
| `ANTHROPIC_API_KEY` | Anthropic API 密钥（可选） |

## 部署

### Vercel（推荐）

1. 将代码推送到 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 导入仓库
3. 在 Settings → Environment Variables 中配置所有环境变量
4. 将 `NEXT_PUBLIC_URL` 改为 Vercel 分配的域名
5. 在 Supabase 中添加回调 URL 到 Redirect URLs

### 数据库

```bash
# 使用 Supabase CLI 应用迁移
supabase db push
```

## License

Private — All rights reserved.

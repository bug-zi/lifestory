# 人生副本

人生副本是一个中文沉浸式人生故事体验应用。用户可以每天抽取一段不同的人生，也可以用 AI 定制属于自己的长篇人生副本，在阅读、收藏、追问、明信片与命运图谱中重新观看另一种可能。

当前项目基于 Next.js App Router、Supabase 和多提供商 AI 接口构建，包含阅读、生成、账户、印记、会员、签到、名人堂、浮生记、文学库等完整业务模块。

## 核心功能

### 每日副本

- 每天随机解锁官方人生故事
- 登录用户会自动避开已读完的副本
- 非会员阅读会消耗「副本印记」，会员可无限阅读
- 支持副本详情页、阅读完成记录和故事追问

### DIY 人生

- 用户输入想体验的人生方向后，AI 生成个性化问题
- 基于用户回答生成 6000-8000 字沉浸式人生故事
- 支持用户自定义 AI 配置，也支持系统默认 OpenAI 配置
- 非会员生成会消耗「DIY 印记」，生成结果可写入个人人生库

### 名人堂

- 提供名人故事浏览、搜索、探索和分类能力
- 支持围绕名人生成问题与人生副本
- 覆盖文学、商业、音乐、虚构人物等迁移数据内容

### 浮生记

- 面向现代言情、文学经典、民间传说与 AI 原创故事的独立阅读区
- 支持故事生成、归档、阅读统计和详情页
- 内置多批次种子内容与迁移脚本

### 个人系统

- Supabase Auth 登录/注册
- 微信登录回调接口
- 个人资料、头像上传、AI 配置管理
- 人生库、稍后再读、文学库、阅读完成记录
- 每日签到与印记奖励

### 扩展体验

- 命运星图：基于 D3 force 的关系图谱体验
- 灵魂镜像：AI 生成个人化镜像内容
- 人生明信片：从副本中提取高光句子生成分享内容
- 今日命运签、主题切换、阅读字体设置

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 16.2.4 App Router |
| UI | React 19.2.4、TypeScript、Tailwind CSS 4 |
| 组件 | shadcn/ui、Base UI、lucide-react、sonner |
| 数据与认证 | Supabase Auth、PostgreSQL、Storage、RLS |
| AI | OpenAI 兼容 Chat Completions 接口 |
| 可视化 | d3-force |
| 部署 | Vercel |

支持的 AI 提供商：

- DeepSeek
- 豆包
- 智谱 GLM
- 通义千问
- ChatGPT / OpenAI

## 项目结构

```text
src/
├─ app/
│  ├─ api/                 # API 路由：auth、scripts、diy、library、profile 等
│  ├─ (auth)/              # 登录与注册页面
│  ├─ scripts/             # 副本阅读与每日副本
│  ├─ diy/                 # DIY 人生生成
│  ├─ hall-of-fame/        # 名人堂
│  ├─ floating-life/       # 浮生记
│  ├─ library/             # 人生库
│  ├─ literary-library/    # 文学库
│  ├─ read-later/          # 稍后再读
│  ├─ constellation/       # 命运星图
│  ├─ soul-mirror/         # 灵魂镜像
│  ├─ postcard/            # 人生明信片
│  ├─ profile/             # 个人资料
│  ├─ tokens/              # 印记商店
│  └─ membership/          # 会员页
├─ components/             # 导航、阅读器、聊天、图谱、UI 组件
├─ hooks/                  # 客户端 hooks
├─ lib/                    # Supabase、AI、图谱、字体与工具函数
└─ types/                  # TypeScript 类型定义

supabase/
├─ config.toml             # Supabase 本地配置
├─ seed.sql                # 初始种子数据
└─ migrations/             # 数据库迁移脚本

scripts/
└─ batch/                  # 内容批量生成与导入脚本
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`，按需填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_URL=http://localhost:3000
WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

必填变量：

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端管理 Supabase 数据所需密钥 |
| `OPENAI_API_KEY` | 系统默认 AI 生成能力使用的 API Key |

可选变量：

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_URL` | 应用公开访问地址，微信登录回调用 |
| `WECHAT_APP_ID` | 微信登录 App ID |
| `WECHAT_APP_SECRET` | 微信登录 App Secret |

### 3. 准备数据库

如果已经连接 Supabase CLI：

```bash
supabase db push
```

也可以在 Supabase 控制台按顺序执行 `supabase/migrations/` 中的 SQL 迁移，并根据需要导入 `supabase/seed.sql`。

### 4. 启动开发服务

```bash
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

## 部署

推荐部署到 Vercel：

1. 将仓库导入 Vercel
2. 在 Vercel 项目中配置与 `.env.local` 对应的环境变量
3. 将 `NEXT_PUBLIC_URL` 设置为线上域名
4. 在 Supabase Auth 中配置站点 URL 与 Redirect URLs
5. 确认 Supabase 数据库迁移和 Storage 配置已完成

## License

Private. All rights reserved.

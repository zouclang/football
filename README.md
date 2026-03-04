# ⚽ 校友会球队管理系统

一个为高校校友足球队量身打造的全栈管理平台，支持球员档案、赛事记录、考勤统计、财务管理等核心功能。

## ✨ 功能特性

| 模块 | 功能描述 |
|------|----------|
| 🏠 **仪表盘** | 团队概览、财务状况、出勤排行榜、年度数据切换 |
| 👥 **球员管理** | 球员档案（头像/号码/位置）、出勤率统计、个人账户余额 |
| ⚽ **考勤管理** | 比赛记录、出勤点名、进球/助攻统计、热身赛/联赛分类 |
| 🏆 **赛事管理** | 大型杯赛/联赛建档、报名费/保证金/扣费追踪、球员白名单 |
| 💰 **财务管理** | 团队账户收支、个人账户余额、餐饮分摊、会员基金 |
| 👤 **球员主页** | 个人详细档案、证明材料上传、历史战绩 |

## 🛠 技术栈

- **框架**：[Next.js 16](https://nextjs.org) (App Router, Server Components)
- **数据库**：SQLite + [Prisma ORM](https://www.prisma.io)
- **样式**：TailwindCSS v4
- **图表**：Recharts
- **运行时**：Node.js 18+

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
npx prisma generate
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
DATABASE_URL="file:/你的绝对路径/football/data/dev.db"
ADMIN_PASSWORD=你的管理员密码
PLAYER_PASSWORD=球员通用密码
```

> ⚠️ **重要**：`DATABASE_URL` 必须使用绝对路径，相对路径在 standalone 模式下会报错。

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📦 生产部署

```bash
# 构建（自动将静态资源复制到 standalone 目录）
npm run build

# 启动生产服务器
npm start
```

### 使用 PM2 后台运行（推荐）

```bash
pm2 start npm --name "football" -- start
pm2 save
pm2 startup   # 开机自启
```

### 使用 Docker 部署（NAS/服务器）

参见 [NAS_DEPLOY_GUIDE.md](./NAS_DEPLOY_GUIDE.md) 获取 Synology NAS + Docker 的详细部署步骤。

## 🗂 项目结构

```
football/
├── src/
│   ├── app/                    # Next.js 页面 (Server Components)
│   │   ├── page.tsx            # 仪表盘
│   │   ├── players/            # 球员管理
│   │   ├── matches/            # 考勤管理
│   │   ├── finance/            # 财务管理
│   │   ├── tournaments/        # 赛事管理
│   │   └── team/               # 队伍信息
│   ├── components/             # React 客户端组件
│   ├── lib/
│   │   ├── actions/            # Next.js Server Actions
│   │   ├── auth.ts             # Cookie-based 鉴权
│   │   └── prisma.ts           # Prisma 客户端单例
│   └── middleware.ts           # 路由鉴权中间件
├── prisma/
│   └── schema.prisma           # 数据库模型定义
├── public/
│   └── uploads/                # 球员头像等图片
└── data/
    └── dev.db                  # SQLite 数据库（不入 git）
```

## 🔐 权限说明

系统分两种角色：

| 角色 | 登录方式 | 权限 |
|------|----------|------|
| **管理员** | 管理员密码 | 全部读写权限 |
| **球员** | 姓名 + 球员密码 | 只读，可查看个人数据 |

## ⚡ 性能优化

项目针对 SQLite 小型部署场景进行了多项优化：

- **数据库索引**：`Attendance.userId/matchId`、`Match.date` 等关键字段建立索引
- **SQLite WAL 模式**：并发读性能提升，减少锁竞争
- **Server-side 分页**：考勤管理页 DB 级 `take/skip`，每次只取10条
- **聚合 SQL**：球员出勤统计用单条 JOIN SQL，而非 N+1 查询
- **懒加载**：财务页、赛事球员白名单按需加载，不阻塞首屏

## 📄 License

MIT

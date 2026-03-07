# ⚽ 校友会球队管理系统

一个为高校校友足球队量身打造的全栈管理平台，支持球员档案、赛事记录、考勤统计、财务管理等核心功能。

## 📖 页面功能详解

### 🏠 仪表盘 (Dashboard)
- **数据汇总**：一屏掌握“在职球员数”、“赞助费余额”、“会员费余额”、“个人账户总留存”及“累计比赛场次”。
- **财务看板**：可视化展示近期收支走势，快速对账。
- **荣誉榜单**：展示本年度及生涯累计的“出勤王”、“射手榜”、“助攻榜”。
- **年度筛选**：支持按 2026、2027 等自然年或“2026 之前”历史存量数据进行全站维度切换。

### 👥 球员管理 (Player Management)
- **全量名单**：支持按姓名、球衣号码实时搜索。
- **状态过滤**：一键切换“活跃”、“隐退（休假）”、“挂靴（封存）”名单。
- **档案编辑**：深度管理球衣尺码、入学级别、学院专业、场上位置等 15+ 项维度。
- **头像系统**：**[核心优化]** 采用物理文件存储 + 动态接口转发，解决了 Next.js 生产环境下新上传图片无法即时显示的 404 顽疾。

### ⚽ 考勤管理 (Match Management)
- **分类记账**：支持“高校联赛（LEAGUE）”、“队内热身（INTERNAL）”、“外部友谊赛（FRIENDLY）”三种模式。
- **点名系统**：勾选上场球员，实时填写进球、助攻、分摊费用。
- **财务联动**：热身赛超支时，系统会自动从“会员费池”进行兜底划转，并联动取消相关人员的会员身份（根据余额触发）。

### 🏆 赛事管理 (Tournament Management)
- **锦标赛机制**：针对长周期的联赛或杯赛，管理独立的报名费、保证金。
- **白名单模式**：针对特定赛事固定参赛球员名单，简化每次比赛的点名流程。

### 💰 财务管理 (Finance Management)
- **三方账户**：
  1. **赞助费**：公共资产，用于买球、买水、参赛费。
  2. **会员费**：专项资金，用于日常比赛场地费扣除。
  3. **个人账户**：球员预存或欠费金额。
- **聚餐分摊**：支持输入总价、选择参与者，自动计算人均并从个人账户划扣，支持“人均上限”设定，超出部分可由球队补贴。

### 👤 球员档案 (Player Profile)
- **生涯履历**：横向上线前（2026之前）和上线后的完整比赛足迹。
- **统计图表**：分赛季展示出勤率演变。
- **财务流水**：每一笔个人转账、聚餐划扣的具体时间与摘要均可溯源。

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

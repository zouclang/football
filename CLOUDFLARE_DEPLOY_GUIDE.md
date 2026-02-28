# Cloudflare 部署指南 (环境变量与配置清单)

项目已完成 Cloudflare 适配改造。在 Cloudflare Pages 面板部署时，请参考以下配置：

---

## 1. 环境变量 (Environment Variables)

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `DATABASE_URL` | (构建时需要) 临时占位符 | `file:./dev.db` |
| `NODE_VERSION` | 锁定 Node 版本 | `20` |

---

## 2. 构建命令 (Build Settings)

- **Framework Preset**: `Next.js`
- **Build Command**: `npx @cloudflare/next-on-pages`
- **Build Output Directory**: `.next`

---

## 3. 资源绑定 (Bindings)

在 Cloudflare Pages 的 **Settings -> Functions -> Compatibility Flags** 中，确保 `nodejs_compat` 已启用。

在 **Settings -> Functions -> Variable Bindings** 中添加：
1. **D1 Database Binding**: 
   - Variable name: `DB`
   - Database: `football-db`

---

## 4. 数据库初始化 (D1 Setup)

部署前，请在本地运行以下命令将 Schema 推送到云端 D1：
```bash
# 获取 D1 数据库 ID 后填入 wrangler.toml，然后执行：
npx wrangler d1 execute football-db --remote --file=./prisma/migrations/xxxx_init.sql
# 或者直接使用 prisma 命令（需配置好环境）：
npx prisma db push
```

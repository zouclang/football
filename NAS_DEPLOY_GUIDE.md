# 群晖 NAS Docker 正式版部署指南

本指南将指导您如何使用群晖的 **Container Manager** (原 Docker) 将系统部署为稳定运行的正式版。

## 1. 准备工作

1.  **创建文件夹**：在群晖的 `docker` 共享目录下创建 `football` 文件夹。
2.  **创建子文件夹**：在 `football` 目录下手动创建 `data` 和 `public/uploads` 两个子文件夹（用于存放数据库和球员照片）。
3.  **上传代码**：将项目的所有文件（特别是 `Dockerfile` 和 `docker-compose.yml`）上传到 `football` 目录下。

## 2. 使用 Container Manager 部署 (推荐)

1.  打开群晖 **Container Manager**。
2.  点击左侧 **“项目 (Project)”** -> **“新增”**。
3.  **项目名称**：填入 `football`。
4.  **路径**：选择您刚才创建的 `/docker/football` 文件夹。
5.  **来源**：选择 **“使用 docker-compose.yaml 创建项目”**。
6.  点击 **“下一步”**，确认配置无误后点击 **“完成”**。群晖会自动开始构建镜像并启动。

## 3. 持久化与备份

项目已配置好自动持久化：
*   **数据库**：位于 `/docker/football/data/dev.db`。
*   **球员头像**：位于 `/docker/football/public/uploads/`。
> [!IMPORTANT]
> 只要保持这两个文件夹不动，即使您删除容器、更新镜像，所有的队员资料和财务数据都会安全无损。

## 4. 远程访问设置 (域名访问)

如果您想通过 `http://godii.top` 访问：
1.  **控制面板** -> **登录门户** -> **反向代理服务器**。
2.  新增规则：
    *   **来源**：协议 HTTPS / 域名 `godii.top` / 端口 443 (或自定义)。
    *   **目的地**：协议 HTTP / 主机名 `localhost` / 端口 `3000`。
3.  在大名单/详情页保存报错？请确保反向代理设置中开启了 **“WebSocket”** 或在 Header 中透传了原始 Host。

## 5. 更新系统

以后代码更新后：
1. 请将新代码覆盖上传到 NAS 文件夹。
2. 在 **Container Manager** -> **项目** 中找到 `football`，点击 **“构建”** 或 **“操作” -> “清理” -> “启动”** 即可完成自动更新。

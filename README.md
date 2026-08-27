# GitHub Accelerator API

GitHub 加速镜像站聚合 API，收录全球 100+ 个 GitHub 加速节点，提供统一的查询接口。

## 功能特性

- 聚合 100+ 个 GitHub 加速镜像站
- 支持按类型筛选（文件加速 / 直接访问 / Clone加速 / 学术源）
- 支持搜索、随机获取节点
- 自动从源站抓取更新镜像列表
- 提供简洁的 REST API

## 快速开始

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 访问文档页面
open http://localhost:3000
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/mirrors` | GET | 获取所有镜像 |
| `/api/mirrors/:type` | GET | 按类型筛选 |
| `/api/random` | GET | 随机获取一个镜像 |
| `/api/search?q=关键词` | GET | 搜索镜像 |
| `/api/stats` | GET | 获取统计信息 |

## 镜像类型

| 类型 | 说明 |
|------|------|
| `file-download` | 文件下载加速（Releases/Raw/Archive） |
| `direct-access` | 直接访问 GitHub 仓库 |
| `clone` | Git Clone 加速 |
| `academic` | 学术镜像源 |

## 自动更新

```bash
# 手动触发更新
npm run update
```

## 部署

支持部署到 Vercel、Render、Railway 等平台。

## License

MIT
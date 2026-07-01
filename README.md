# 个人网站项目

一个集博客和应用于一体的个人网站，使用 React + Vite 构建前端，Node.js + WebSocket 构建信令服务器。

## 功能特性

- **首页**：网站介绍、关于本站、最新文章列表
- **应用中心**：各种实用工具的入口
- **P2P 文件传输**：基于 WebRTC 的浏览器端对端文件传输工具

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Router v6
- WebRTC (P2P 通信)

### 后端
- Node.js
- WebSocket (ws 库)
- TypeScript

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 启动开发服务器

#### 方法一：分别启动

```bash
# 启动后端信令服务器
cd server
npm start

# 新开一个终端，启动前端开发服务器
cd client
npm run dev
```

#### 方法二：同时启动（需要安装 concurrently）

```bash
# 在项目根目录安装 concurrently
npm install

# 同时启动前端和后端
npm run dev
```

### 构建生产版本

```bash
# 构建前端
cd client
npm run build

# 构建后端
cd ../server
npm run build
```

## 使用说明

### P2P 文件传输

1. 打开应用中心页面（`/apps`）
2. 点击 "P2P 文件传输" 卡片
3. 输入房间号（或点击 "生成随机房间号"）
4. 让对方输入相同的房间号加入
5. 连接建立后，选择文件发送给对方
6. 对方会看到文件确认请求，可以选择接受或拒绝
7. 对方接受后，文件开始传输
8. 传输完成后，对方可以下载文件

## 项目结构

```
personal_web/
├── client/                # 前端项目
│   ├── src/
│   │   ├── components/   # 通用组件（Navbar 等）
│   │   ├── pages/        # 页面组件（Home、Apps、P2PTransfer）
│   │   ├── services/     # 业务服务（WebRTC、信令）
│   │   └── types/        # TypeScript 类型定义
│   └── ...
├── server/                # 后端信令服务器
│   ├── src/
│   │   ├── index.ts     # 服务器入口
│   │   ├── room-manager.ts  # 房间管理
│   │   └── types.ts     # 类型定义
│   └── ...
└── README.md
```

## 注意事项

- 信令服务器默认监听 `3001` 端口
- 前端开发服务器默认监听 `5173` 端口
- P2P 文件传输使用公共 STUN 服务器（`stun:stun.l.google.com:19302`）
- 如需部署到生产环境，请修改 WebSocket 服务器地址

## 许可证

ISC

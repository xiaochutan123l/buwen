# 步纹 (Buwen) - 减压项目管理应用

> 随心而动，顺流而行

步纹是一个专注于减轻焦虑的个人项目管理 Web 应用。它采用"反生产力"设计理念，让用户感受到进展而非压力。

![步纹截图](./docs/screenshot.png)

## ✨ 特性

- 🎨 **柔和视觉设计** - 可自定义主题色，营造舒适的视觉体验
- 📦 **项目卡片** - 支持嵌套子任务，自动计算进度
- 📅 **日历规划** - 横向滚动日历，拖拽任务到指定日期
- 🔍 **快速搜索** - 按名称搜索项目和任务
- 🏷️ **标签过滤** - 自定义标签，快速筛选项目
- 🌍 **双语支持** - 中文/英文自动切换
- 💾 **本地存储** - 数据保存在浏览器中，隐私安全
- 📱 **响应式设计** - 支持桌面和移动端

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 使用 docker-compose
docker-compose up -d

# 或手动构建
docker build -t buwen .
docker run -p 3000:3000 buwen
```

## 📖 使用说明

详见 [用户手册](./docs/USER_GUIDE.md)

## 🛠️ 开发指南

详见 [开发文档](./docs/DEV_GUIDE.md)

## 📁 项目结构

```
buwen/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # 主页面（布局和主题）
│   │   ├── layout.tsx    # 根布局
│   │   └── globals.css   # 全局样式
│   ├── components/       # React 组件
│   │   ├── Calendar.tsx  # 日历组件
│   │   ├── ProjectGrid.tsx # 项目卡片网格
│   │   ├── ProjectDetail.tsx # 项目详情
│   │   ├── Toolbar.tsx   # 顶部工具栏
│   │   ├── SettingsModal.tsx # 设置弹窗
│   │   ├── TaskEditModal.tsx # 任务编辑弹窗
│   │   └── DndProvider.tsx # 拖拽上下文
│   ├── store/            # 状态管理
│   │   └── useBuwenStore.ts # Zustand Store
│   ├── i18n/             # 国际化
│   │   ├── I18nProvider.tsx
│   │   └── translations.ts
│   └── types/            # TypeScript 类型定义
│       └── index.ts
├── public/               # 静态资源
├── docs/                 # 文档
├── Dockerfile            # Docker 配置
└── docker-compose.yml    # Docker Compose 配置
```

## 🔧 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand + localStorage 持久化
- **拖拽**: @dnd-kit
- **日期处理**: date-fns
- **图标**: lucide-react

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

# 步纹 (Buwen) - 开发指南

本文档帮助开发者理解代码结构，以及如何进行常见的定制修改。

---

## 📁 项目结构

```
buwen/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 🔑 主页面布局和主题样式
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 🔑 全局CSS和动画
│   │
│   ├── components/             # React 组件
│   │   ├── Calendar.tsx       # 🔑 日历视图（最复杂的组件）
│   │   ├── ProjectGrid.tsx    # 🔑 项目卡片网格
│   │   ├── ProjectDetail.tsx  # 项目详情和子任务
│   │   ├── Toolbar.tsx        # 🔑 顶部工具栏
│   │   ├── SettingsModal.tsx  # 🔑 设置弹窗
│   │   ├── TaskEditModal.tsx  # 任务编辑弹窗
│   │   ├── DndProvider.tsx    # 拖拽逻辑
│   │   ├── Sidebar.tsx        # (未使用)
│   │   └── index.ts           # 组件导出
│   │
│   ├── store/
│   │   └── useBuwenStore.ts   # 🔑 Zustand 状态管理（核心）
│   │
│   ├── i18n/
│   │   ├── I18nProvider.tsx   # 国际化上下文
│   │   └── translations.ts    # 🔑 翻译文本
│   │
│   └── types/
│       └── index.ts           # 🔑 TypeScript 类型定义
│
├── public/                     # 静态资源
├── docs/                       # 文档
├── Dockerfile                  # Docker 镜像配置
├── docker-compose.yml          # Docker Compose
├── tailwind.config.js          # 🔑 Tailwind 配置
└── package.json                # 依赖配置
```

🔑 标记的是常见需要修改的文件

---

## 🎨 主题和颜色配置

### 修改默认主题色

**文件**: `src/store/useBuwenStore.ts`

```typescript
// 第 7 行 - 预设颜色列表
const PRESET_COLORS = ['#FF6B9D', '#4ECDC4', '#FFD93D', ...];

// 第 297 行 - 默认设置
settings: {
  customColors: PRESET_COLORS,  // 默认使用预设颜色
  ...
}
```

### 修改主题色深度

**文件**: `src/app/page.tsx`

```typescript
// 第 16-28 行 - generateThemeStyles 函数
const generateThemeStyles = (themeColor: string) => {
  return {
    // 底层背景渐变 - 数字越大颜色越深
    baseBg: `linear-gradient(145deg, ${themeColor}60 0%, ${themeColor}40 40%, ${themeColor}20 100%)`,
    
    // 工具栏背景
    toolbarBg: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, ${themeColor}28 100%)`,
    
    // 卡片背景（项目区和日历区）
    cardBg: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${themeColor}22 100%)`,
    
    // 阴影强度
    shadowColor: `${themeColor}35`,
  };
};
```

### 修改设置中的预设主题色

**文件**: `src/components/SettingsModal.tsx`

```typescript
// 第 10-19 行 - 预设主题色列表
const THEME_COLORS = [
  { name: '薄荷绿', nameEn: 'Mint', color: '#4ECDC4' },
  { name: '樱花粉', nameEn: 'Sakura', color: '#FF6B9D' },
  // 添加或修改颜色...
];
```

---

## 📐 布局和尺寸

### 修改区域高度比例

**文件**: `src/app/page.tsx`

```typescript
// 第 87 行 - 项目区域高度
<div className="flex-1 p-4 overflow-hidden" style={{ height: '55vh' }}>

// 第 100 行 - 日历区域高度
<div className="h-[40vh] p-4 pt-0">
```

### 修改日历卡片宽度

**文件**: `src/components/Calendar.tsx`

```typescript
// 第 332 行 - CalendarDay 组件
className={`
  flex-shrink-0 w-32 md:w-40 min-h-[160px]  // 修改 w-32/w-40 改变宽度
  ...
`}
```

### 修改项目卡片网格

**文件**: `src/components/ProjectGrid.tsx`

```typescript
// 第 372-377 行 - 网格样式
const gridClasses = {
  compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
  comfortable: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  relaxed: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  list: 'grid-cols-1 gap-0',
};
```

---

## 🌍 国际化

### 添加/修改翻译文本

**文件**: `src/i18n/translations.ts`

```typescript
export const translations = {
  zh: {
    app: {
      name: '步纹',
      slogan: '随心而动，顺流而行',
    },
    // 添加新的翻译键...
  },
  en: {
    app: {
      name: 'Buwen',
      slogan: 'Flow with your intuition',
    },
    // 添加对应的英文翻译...
  },
};
```

### 在组件中使用翻译

```typescript
import { useI18n } from '@/i18n/I18nProvider';

const MyComponent = () => {
  const { t, language } = useI18n();
  
  return <p>{t.app.name}</p>;
};
```

---

## 💾 数据模型

### 项目/任务结构

**文件**: `src/types/index.ts`

```typescript
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: string;           // 项目颜色（十六进制）
  tags: string[];          // 标签名称数组
  parentId: string | null; // 父任务 ID
  status: 'not-started' | 'in-progress' | 'completed';
  isLeaf: boolean;         // 是否为叶子任务（可拖拽到日历）
  createdAt: string;
  updatedAt: string;
  children: ProjectItem[]; // 子任务
}
```

### 日历任务结构

```typescript
export interface ScheduledTask {
  id: string;
  taskId: string;          // 关联的任务 ID
  taskName: string;
  projectId: string;       // 所属项目 ID
  projectName: string;
  projectColor: string;
  date: string;            // 日期 YYYY-MM-DD
  status: 'pending' | 'completed';
  isProjectBlock: boolean; // 是否为项目块
}
```

---

## 🔌 Store 操作

### 常用的 Store 方法

**文件**: `src/store/useBuwenStore.ts`

```typescript
// 项目操作
addProject(project)          // 添加项目
updateProject(id, updates)   // 更新项目
deleteProject(id)            // 删除项目
addChildTask(parentId, task) // 添加子任务

// 日历操作
scheduleTask(taskId, date)   // 安排任务到日期
unscheduleTask(scheduledId)  // 从日历移除
moveScheduledTask(id, date)  // 移动到新日期
completeScheduledTask(id)    // 标记完成

// UI 状态
setViewMode(mode)            // 设置视图模式
selectProject(id)            // 选择项目
setSearchQuery(query)        // 搜索
toggleTag(tagId)             // 切换标签过滤
toggleShowCompleted()        // 切换完成状态过滤

// 设置
updateSettings(settings)     // 更新设置
addTag(name, color)          // 添加标签
updateTag(id, updates)       // 更新标签
deleteTag(id)                // 删除标签
```

### 在组件中使用 Store

```typescript
import { useBuwenStore } from '@/store/useBuwenStore';

const MyComponent = () => {
  const { projects, addProject, updateProject } = useBuwenStore();
  
  // 使用 store 数据和方法...
};
```

---

## 🎭 动画配置

### 全局动画

**文件**: `src/app/globals.css`

```css
/* 淡入动画 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 浮入动画 */
@keyframes float-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 使用 */
.animate-fade-in { animation: fade-in 0.2s ease-out; }
.animate-float-in { animation: float-in 0.3s ease-out; }
```

---

## 🐳 Docker 配置

### 修改端口

**文件**: `docker-compose.yml`

```yaml
ports:
  - "3000:3000"  # 主机端口:容器端口
```

### 修改构建配置

**文件**: `Dockerfile`

```dockerfile
# 使用的 Node 版本
FROM node:20-alpine AS base
```

---

## 🔧 常见开发任务

### 添加新组件

1. 在 `src/components/` 创建 `MyComponent.tsx`
2. 在 `src/components/index.ts` 添加导出
3. 在需要的地方导入使用

### 添加新的 Store 状态

1. 在 `src/types/index.ts` 添加类型（如需要）
2. 在 `src/store/useBuwenStore.ts` 的接口中添加状态和方法
3. 在 store 实现中添加初始值和方法实现
4. 如需持久化，在 `partialize` 函数中添加

### 添加新的设置项

1. 在 `src/types/index.ts` 的 `AppSettings` 中添加字段
2. 在 `src/store/useBuwenStore.ts` 的默认 settings 中添加
3. 在 `src/components/SettingsModal.tsx` 中添加 UI

---

## 📝 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 使用 Tailwind CSS 进行样式编写
- 状态管理使用 Zustand
- 遵循 React 最佳实践

---

## 🐛 调试技巧

### 查看 Store 数据

在浏览器控制台：

```javascript
// 查看全部状态
JSON.parse(localStorage.getItem('buwen-storage'))

// 清除数据重新开始
localStorage.removeItem('buwen-storage')
```

### 开发模式热更新

```bash
npm run dev
```

修改代码后会自动热更新。

---

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [@dnd-kit 文档](https://docs.dndkit.com)
- [date-fns 文档](https://date-fns.org/docs)

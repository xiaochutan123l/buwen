/**
 * 步纹 (Buwen) - 全局状态管理
 * 
 * 使用 Zustand 进行状态管理，配合 persist 中间件实现 localStorage 持久化
 * 
 * 主要功能：
 * 1. 项目数据管理（增删改查、嵌套结构）
 * 2. 日历任务安排
 * 3. UI 状态（视图模式、过滤、搜索）
 * 4. 应用设置（主题色、语言等）
 * 5. 标签管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { ProjectItem, ScheduledTask, Tag, ViewMode, AppSettings, BreadcrumbItem } from '@/types';

/**
 * 预设颜色列表
 * 用于新项目的默认颜色和设置中的颜色选项
 * 修改此数组可改变可用的颜色选项
 */
const PRESET_COLORS = ['#FF6B9D', '#4ECDC4', '#FFD93D', '#A8E6CF', '#C7CEEA', '#F8B595', '#C4A1FF', '#87CEEB'];

// 示例数据
const createSampleData = (): ProjectItem[] => [
  {
    id: uuidv4(),
    name: '学习编程',
    description: '系统学习前端开发技术栈',
    color: '#4ECDC4',
    tags: ['学习', '技术'],
    parentId: null,
    status: 'in-progress',
    isLeaf: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: uuidv4(),
        name: 'React 基础',
        description: '',
        color: '#4ECDC4',
        tags: [],
        parentId: null,
        status: 'in-progress',
        isLeaf: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: uuidv4(),
            name: '学习 Hooks',
            description: '',
            color: '#4ECDC4',
            tags: [],
            parentId: null,
            status: 'not-started',
            isLeaf: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: [],
          },
          {
            id: uuidv4(),
            name: '练习组件开发',
            description: '',
            color: '#4ECDC4',
            tags: [],
            parentId: null,
            status: 'not-started',
            isLeaf: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: [],
          },
        ],
      },
      {
        id: uuidv4(),
        name: 'TypeScript 进阶',
        description: '',
        color: '#4ECDC4',
        tags: [],
        parentId: null,
        status: 'not-started',
        isLeaf: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
    ],
  },
  {
    id: uuidv4(),
    name: '读书计划',
    description: '今年要读完的书单',
    color: '#FF6B9D',
    tags: ['阅读', '成长'],
    parentId: null,
    status: 'not-started',
    isLeaf: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: uuidv4(),
        name: '读《原子习惯》',
        description: '',
        color: '#FF6B9D',
        tags: [],
        parentId: null,
        status: 'not-started',
        isLeaf: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
      {
        id: uuidv4(),
        name: '读《深度工作》',
        description: '',
        color: '#FF6B9D',
        tags: [],
        parentId: null,
        status: 'not-started',
        isLeaf: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
    ],
  },
  {
    id: uuidv4(),
    name: '健身计划',
    description: '保持健康的生活方式',
    color: '#A8E6CF',
    tags: ['健康', '运动'],
    parentId: null,
    status: 'in-progress',
    isLeaf: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: uuidv4(),
        name: '每周跑步3次',
        description: '',
        color: '#A8E6CF',
        tags: [],
        parentId: null,
        status: 'not-started',
        isLeaf: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
    ],
  },
];

interface BuwenStore {
  // 项目数据
  projects: ProjectItem[];
  scheduledTasks: ScheduledTask[];
  tags: Tag[];
  
  // UI 状态
  viewMode: ViewMode;
  sidebarOpen: boolean;
  selectedProjectId: string | null;
  breadcrumbs: BreadcrumbItem[];
  searchQuery: string;
  selectedTags: string[];
  showCompleted: boolean;
  
  // 设置
  settings: AppSettings;
  
  // 项目操作
  addProject: (project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt' | 'children'>) => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  addChildTask: (parentId: string, task: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt' | 'children' | 'parentId'>) => void;
  
  // 日历操作
  scheduleTask: (taskId: string, date: string, isProjectBlock?: boolean) => void;
  unscheduleTask: (scheduledId: string) => void;
  completeScheduledTask: (scheduledId: string) => void;
  toggleScheduledTaskStatus: (scheduledId: string) => void;
  moveScheduledTask: (scheduledId: string, newDate: string) => void;
  
  // UI 操作
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  selectProject: (id: string | null) => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setSearchQuery: (query: string) => void;
  toggleTag: (tagId: string) => void;
  toggleShowCompleted: () => void;
  
  // 设置操作
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // 标签操作
  addTag: (name: string, color: string) => void;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  
  // 辅助函数
  findProjectById: (id: string) => ProjectItem | null;
  findRootProject: (id: string) => ProjectItem | null;
  getNextTask: (projectId: string) => ProjectItem | null;
  getAllLeafTasks: (projectId: string) => ProjectItem[];
}

// 递归查找项目
const findInTree = (items: ProjectItem[], id: string): ProjectItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children.length > 0) {
      const found = findInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 递归更新项目
const updateInTree = (items: ProjectItem[], id: string, updates: Partial<ProjectItem>): ProjectItem[] => {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates, updatedAt: new Date().toISOString() };
    }
    if (item.children.length > 0) {
      return { ...item, children: updateInTree(item.children, id, updates) };
    }
    return item;
  });
};

// 递归删除项目
const deleteFromTree = (items: ProjectItem[], id: string): ProjectItem[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: deleteFromTree(item.children, id),
    }));
};

// 递归添加子任务
const addChildToTree = (items: ProjectItem[], parentId: string, child: ProjectItem): ProjectItem[] => {
  return items.map(item => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [...item.children, child],
        isLeaf: false,
        updatedAt: new Date().toISOString(),
      };
    }
    if (item.children.length > 0) {
      return { ...item, children: addChildToTree(item.children, parentId, child) };
    }
    return item;
  });
};

// 获取所有叶子任务
const getLeafTasks = (item: ProjectItem): ProjectItem[] => {
  if (item.isLeaf || item.children.length === 0) {
    return [item];
  }
  return item.children.flatMap(getLeafTasks);
};

// 获取下一个待做任务
const findNextTask = (item: ProjectItem): ProjectItem | null => {
  if (item.isLeaf && item.status !== 'completed') {
    return item;
  }
  for (const child of item.children) {
    const next = findNextTask(child);
    if (next) return next;
  }
  return null;
};

export const useBuwenStore = create<BuwenStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      projects: createSampleData(),
      scheduledTasks: [],
      tags: [
        { id: '1', name: '学习', color: '#4ECDC4' },
        { id: '2', name: '创意', color: '#FF6B9D' },
        { id: '3', name: '健康', color: '#A8E6CF' },
        { id: '4', name: '工作', color: '#FFD93D' },
      ],
      viewMode: 'comfortable',
      sidebarOpen: false,
      selectedProjectId: null,
      breadcrumbs: [],
      searchQuery: '',
      selectedTags: [],
      showCompleted: false,
      settings: {
        viewMode: 'comfortable',
        theme: 'light',
        language: 'auto',
        customColors: PRESET_COLORS,
      },

      // 项目操作
      addProject: (project) => {
        const newProject: ProjectItem = {
          ...project,
          id: uuidv4(),
          children: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ projects: [...state.projects, newProject] }));
      },

      updateProject: (id, updates) => {
        set(state => ({
          projects: updateInTree(state.projects, id, updates),
        }));
      },

      deleteProject: (id) => {
        set(state => ({
          projects: deleteFromTree(state.projects, id),
          scheduledTasks: state.scheduledTasks.filter(t => t.taskId !== id),
        }));
      },

      addChildTask: (parentId, task) => {
        const newTask: ProjectItem = {
          ...task,
          id: uuidv4(),
          parentId,
          children: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({
          projects: addChildToTree(state.projects, parentId, newTask),
        }));
      },

      // 日历操作
      scheduleTask: (taskId, date, isProjectBlock = false) => {
        const { projects, findProjectById, findRootProject } = get();
        const task = findProjectById(taskId);
        if (!task) return;

        const rootProject = findRootProject(taskId);
        if (!rootProject) return;

        const scheduled: ScheduledTask = {
          id: uuidv4(),
          taskId,
          taskName: task.name,
          projectId: rootProject.id,
          projectName: rootProject.name,
          projectColor: rootProject.color,
          date,
          status: 'pending',
          isProjectBlock,
        };

        set(state => ({
          scheduledTasks: [...state.scheduledTasks, scheduled],
        }));

        // 更新任务状态
        if (!isProjectBlock) {
          get().updateProject(taskId, { status: 'in-progress' });
        }
      },

      unscheduleTask: (scheduledId) => {
        const { scheduledTasks } = get();
        const task = scheduledTasks.find(t => t.id === scheduledId);
        if (task && !task.isProjectBlock) {
          get().updateProject(task.taskId, { status: 'not-started' });
        }
        set(state => ({
          scheduledTasks: state.scheduledTasks.filter(t => t.id !== scheduledId),
        }));
      },

      completeScheduledTask: (scheduledId) => {
        const { scheduledTasks } = get();
        const task = scheduledTasks.find(t => t.id === scheduledId);
        if (task) {
          set(state => ({
            scheduledTasks: state.scheduledTasks.map(t =>
              t.id === scheduledId ? { ...t, status: 'completed' } : t
            ),
          }));
          if (!task.isProjectBlock) {
            get().updateProject(task.taskId, { status: 'completed' });
          }
        }
      },

      toggleScheduledTaskStatus: (scheduledId) => {
        const { scheduledTasks } = get();
        const task = scheduledTasks.find(t => t.id === scheduledId);
        if (task) {
          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
          set(state => ({
            scheduledTasks: state.scheduledTasks.map(t =>
              t.id === scheduledId ? { ...t, status: newStatus } : t
            ),
          }));
          if (!task.isProjectBlock) {
            get().updateProject(task.taskId, { 
              status: newStatus === 'completed' ? 'completed' : 'in-progress' 
            });
          }
        }
      },

      moveScheduledTask: (scheduledId, newDate) => {
        set(state => ({
          scheduledTasks: state.scheduledTasks.map(t =>
            t.id === scheduledId ? { ...t, date: newDate } : t
          ),
        }));
      },

      // UI 操作
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      selectProject: (id) => set({ selectedProjectId: id }),
      setBreadcrumbs: (items) => set({ breadcrumbs: items }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleTag: (tagId) => set(state => ({
        selectedTags: state.selectedTags.includes(tagId)
          ? state.selectedTags.filter(t => t !== tagId)
          : [...state.selectedTags, tagId],
      })),
      toggleShowCompleted: () => set(state => ({ showCompleted: !state.showCompleted })),

      // 设置操作 - 同时同步 viewMode 到顶层
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings },
        // 如果更新了 viewMode，同步到顶层
        ...(newSettings.viewMode ? { viewMode: newSettings.viewMode } : {}),
      })),

      // 标签操作
      addTag: (name, color) => set(state => ({
        tags: [...state.tags, { id: uuidv4(), name, color }],
      })),
      
      updateTag: (id, updates) => set(state => ({
        tags: state.tags.map(tag => tag.id === id ? { ...tag, ...updates } : tag),
      })),
      
      deleteTag: (id) => set(state => ({
        tags: state.tags.filter(tag => tag.id !== id),
        // 同时从选中的标签中移除
        selectedTags: state.selectedTags.filter(tagId => tagId !== id),
      })),

      // 辅助函数
      findProjectById: (id) => findInTree(get().projects, id),
      
      findRootProject: (id) => {
        const { projects } = get();
        for (const project of projects) {
          if (project.id === id) return project;
          const found = findInTree([project], id);
          if (found) return project;
        }
        return null;
      },

      getNextTask: (projectId) => {
        const project = findInTree(get().projects, projectId);
        if (!project) return null;
        return findNextTask(project);
      },

      getAllLeafTasks: (projectId) => {
        const project = findInTree(get().projects, projectId);
        if (!project) return [];
        return getLeafTasks(project).filter(t => t.status !== 'completed');
      },
    }),
    {
      name: 'buwen-storage',
      partialize: (state) => ({
        projects: state.projects,
        scheduledTasks: state.scheduledTasks,
        tags: state.tags,
        settings: state.settings,
      }),
    }
  )
);

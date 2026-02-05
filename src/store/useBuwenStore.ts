/**
 * 步纹 (Buwen) - 全局状态管理
 * 
 * 使用 Zustand 进行状态管理，配合服务器端 API 实现数据持久化
 * 数据存储在服务器端，支持多设备同步
 * 
 * 主要功能：
 * 1. 项目数据管理（增删改查、嵌套结构）
 * 2. 日历任务安排
 * 3. UI 状态（视图模式、过滤、搜索）
 * 4. 应用设置（主题色、语言等）
 * 5. 标签管理
 * 6. 服务器端数据同步
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ProjectItem, ScheduledTask, Tag, ViewMode, AppSettings, BreadcrumbItem } from '@/types';

/**
 * 预设颜色列表
 * 用于新项目的默认颜色和设置中的颜色选项
 */
const PRESET_COLORS = ['#FF6B9D', '#4ECDC4', '#FFD93D', '#A8E6CF', '#C7CEEA', '#F8B595', '#C4A1FF', '#87CEEB'];

// 默认标签
const DEFAULT_TAGS: Tag[] = [
  { id: '1', name: '学习', color: '#4ECDC4' },
  { id: '2', name: '创意', color: '#FF6B9D' },
  { id: '3', name: '重要', color: '#FFD93D' },
  { id: '4', name: '工作', color: '#C7CEEA' },
];

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  viewMode: 'comfortable',
  theme: 'light',
  language: 'zh',
  customColors: ['#4ECDC4'],
};

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
  
  // 同步状态
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncError: string | null;
  
  // 数据同步
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
  
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

// 防抖保存
let saveTimeout: NodeJS.Timeout | null = null;
const debouncedSave = (saveFunc: () => Promise<void>) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveFunc();
  }, 500); // 500ms 后保存
};

export const useBuwenStore = create<BuwenStore>()((set, get) => ({
  // 初始状态
  projects: [],
  scheduledTasks: [],
  tags: DEFAULT_TAGS,
  viewMode: 'comfortable',
  sidebarOpen: true,
  selectedProjectId: null,
  breadcrumbs: [],
  searchQuery: '',
  selectedTags: [],
  showCompleted: false,
  settings: DEFAULT_SETTINGS,
  
  // 同步状态
  isLoading: true,
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,

  // 从服务器加载数据
  loadFromServer: async () => {
    set({ isLoading: true, syncError: null });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/data`);
      if (!response.ok) throw new Error('加载数据失败');
      
      const data = await response.json();
      
      if (data.state) {
        set({
          projects: data.state.projects || [],
          scheduledTasks: data.state.scheduledTasks || [],
          tags: data.state.tags || DEFAULT_TAGS,
          settings: { ...DEFAULT_SETTINGS, ...data.state.settings },
          isLoading: false,
          lastSyncTime: data.lastModified || null,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      set({ 
        isLoading: false, 
        syncError: error instanceof Error ? error.message : '加载失败' 
      });
    }
  },

  // 保存到服务器
  saveToServer: async () => {
    const state = get();
    set({ isSyncing: true, syncError: null });
    
    try {
      const dataToSave = {
        state: {
          projects: state.projects,
          scheduledTasks: state.scheduledTasks,
          tags: state.tags,
          settings: state.settings,
        },
        version: 1,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      
      if (!response.ok) throw new Error('保存数据失败');
      
      const result = await response.json();
      set({ 
        isSyncing: false, 
        lastSyncTime: result.lastModified 
      });
    } catch (error) {
      console.error('保存数据失败:', error);
      set({ 
        isSyncing: false, 
        syncError: error instanceof Error ? error.message : '保存失败' 
      });
    }
  },

  // 项目操作
  addProject: (project) => {
    const newProject: ProjectItem = {
      ...project,
      id: uuidv4(),
      color: project.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
    debouncedSave(get().saveToServer);
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: updateInTree(state.projects, id, updates),
    }));
    debouncedSave(get().saveToServer);
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: deleteFromTree(state.projects, id),
      scheduledTasks: state.scheduledTasks.filter(t => t.taskId !== id),
    }));
    debouncedSave(get().saveToServer);
  },

  addChildTask: (parentId, task) => {
    const newTask: ProjectItem = {
      ...task,
      id: uuidv4(),
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
    };
    set((state) => ({
      projects: addChildToTree(state.projects, parentId, newTask),
    }));
    debouncedSave(get().saveToServer);
  },

  // 日历操作
  scheduleTask: (taskId, date, isProjectBlock = false) => {
    const task = get().findProjectById(taskId);
    if (!task) return;
    
    // 找到根项目
    const rootProject = get().findRootProject(taskId);

    const scheduled: ScheduledTask = {
      id: uuidv4(),
      taskId,
      taskName: task.name,
      projectId: rootProject?.id || taskId,
      projectName: rootProject?.name || task.name,
      projectColor: rootProject?.color || task.color,
      date,
      status: 'pending',
      isProjectBlock,
    };
    set((state) => ({
      scheduledTasks: [...state.scheduledTasks, scheduled],
    }));
    debouncedSave(get().saveToServer);
  },

  unscheduleTask: (scheduledId) => {
    set((state) => ({
      scheduledTasks: state.scheduledTasks.filter(t => t.id !== scheduledId),
    }));
    debouncedSave(get().saveToServer);
  },

  completeScheduledTask: (scheduledId) => {
    set((state) => ({
      scheduledTasks: state.scheduledTasks.map(t =>
        t.id === scheduledId ? { ...t, status: 'completed' as const } : t
      ),
    }));
    debouncedSave(get().saveToServer);
  },

  toggleScheduledTaskStatus: (scheduledId) => {
    const task = get().scheduledTasks.find(t => t.id === scheduledId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    set((state) => ({
      scheduledTasks: state.scheduledTasks.map(t =>
        t.id === scheduledId ? { ...t, status: newStatus as 'pending' | 'completed' } : t
      ),
    }));

    // 同步更新原任务状态
    if (task.taskId) {
      const originalTask = get().findProjectById(task.taskId);
      if (originalTask && originalTask.isLeaf) {
        const projectStatus = newStatus === 'completed' ? 'completed' : 'not-started';
        set((state) => ({
          projects: updateInTree(state.projects, task.taskId, { status: projectStatus as 'not-started' | 'in-progress' | 'completed' }),
        }));
      }
    }
    debouncedSave(get().saveToServer);
  },

  moveScheduledTask: (scheduledId, newDate) => {
    set((state) => ({
      scheduledTasks: state.scheduledTasks.map(t =>
        t.id === scheduledId ? { ...t, date: newDate } : t
      ),
    }));
    debouncedSave(get().saveToServer);
  },

  // UI 操作
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectProject: (id) => set({ selectedProjectId: id }),
  setBreadcrumbs: (items) => set({ breadcrumbs: items }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTag: (tagId) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tagId)
        ? state.selectedTags.filter(t => t !== tagId)
        : [...state.selectedTags, tagId],
    })),
  toggleShowCompleted: () => set((state) => ({ showCompleted: !state.showCompleted })),

  // 设置操作
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    debouncedSave(get().saveToServer);
  },

  // 标签操作
  addTag: (name, color) => {
    const newTag: Tag = { id: uuidv4(), name, color };
    set((state) => ({ tags: [...state.tags, newTag] }));
    debouncedSave(get().saveToServer);
  },

  updateTag: (id, updates) => {
    set((state) => ({
      tags: state.tags.map(tag =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
    debouncedSave(get().saveToServer);
  },

  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter(tag => tag.id !== id),
    }));
    debouncedSave(get().saveToServer);
  },

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
}));

/**
 * 步纹 (Buwen) - 类型定义
 * 
 * 本文件定义了应用中所有核心数据结构的 TypeScript 类型
 */

/**
 * 项目/任务的统一数据结构
 * 
 * 设计说明：项目和任务使用同一结构，通过 isLeaf 区分
 * - 顶层项目：parentId = null
 * - 子任务：parentId = 父任务ID
 * - 叶子任务：isLeaf = true，可拖拽到日历
 */
export interface ProjectItem {
  id: string;                  // 唯一标识，UUID
  name: string;                // 名称
  description?: string;        // 描述/笔记，支持 Markdown
  color: string;               // 颜色，十六进制如 '#4ECDC4'
  tags: string[];              // 标签名称数组
  children: ProjectItem[];     // 子任务列表
  parentId: string | null;     // 父任务 ID，null 表示顶层项目
  status: 'not-started' | 'in-progress' | 'completed';  // 状态
  isLeaf: boolean;             // 是否为叶子任务（可拖拽到日历）
  createdAt: string;           // 创建时间 ISO 字符串
  updatedAt: string;           // 更新时间 ISO 字符串
}

/**
 * 日历任务安排
 * 
 * 当用户将任务拖拽到日历时创建此记录
 */
export interface ScheduledTask {
  id: string;                  // 唯一标识
  taskId: string;              // 关联的 ProjectItem.id
  taskName: string;            // 任务名称（冗余存储便于显示）
  projectId: string;           // 所属根项目 ID
  projectName: string;         // 所属根项目名称
  projectColor: string;        // 所属根项目颜色
  date: string;                // 日期，格式 YYYY-MM-DD
  status: 'pending' | 'completed';  // 完成状态
  isProjectBlock: boolean;     // 是否为项目聚焦块（而非具体任务）
}

/**
 * 标签/分类
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * 视图模式
 * - compact: 紧凑，每行更多卡片
 * - comfortable: 舒适，默认视图
 * - relaxed: 宽松，卡片更大
 * - list: 列表，树形展示
 */
export type ViewMode = 'compact' | 'comfortable' | 'relaxed' | 'list';

/**
 * 应用设置
 */
export interface AppSettings {
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  language: 'zh' | 'en' | 'auto';
  customColors: string[];      // 第一个元素为当前主题色
}

/**
 * 面包屑导航项
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
}


'use client';

import React, { useState } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { ProjectItem } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { Menu, X, ChevronRight, ChevronDown, Plus, FolderOpen, Circle } from 'lucide-react';

interface SidebarTreeItemProps {
  item: ProjectItem;
  level: number;
  projectColor: string;
}

const SidebarTreeItem: React.FC<SidebarTreeItemProps> = ({ item, level, projectColor }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const { selectProject, setBreadcrumbs } = useBuwenStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${item.id}`,
    data: {
      type: item.isLeaf ? 'task' : 'project',
      task: item,
      project: item,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  const hasChildren = item.children.length > 0;

  const handleClick = () => {
    if (level === 0) {
      selectProject(item.id);
      setBreadcrumbs([{ id: item.id, name: item.name }]);
    }
  };

  return (
    <div className="select-none">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`
          group flex items-center gap-1.5 py-1.5 px-2 rounded-md
          hover:bg-white/50 cursor-pointer transition-colors
          ${isDragging ? 'opacity-50 bg-white/30' : ''}
        `}
        onClick={handleClick}
      >
        {/* 缩进 */}
        <div style={{ width: `${level * 12}px` }} />

        {/* 展开/折叠 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-4.5 h-4.5 flex items-center justify-center">
            {item.isLeaf ? (
              <Circle className="w-2.5 h-2.5 text-gray-300" />
            ) : (
              <FolderOpen className="w-3 h-3 text-gray-300" />
            )}
          </div>
        )}

        {/* 色条 */}
        <div
          className="w-1.5 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />

        {/* 名称 */}
        <span
          className={`
            flex-1 text-sm truncate
            ${level === 0 ? 'font-medium text-gray-700' : 'text-gray-600'}
            ${item.status === 'completed' ? 'line-through opacity-50' : ''}
          `}
        >
          {item.name}
        </span>
      </div>

      {/* 子项 */}
      {hasChildren && isExpanded && (
        <div className="transition-all duration-200">
          {item.children.map((child) => (
            <SidebarTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              projectColor={projectColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, projects, addProject, settings } = useBuwenStore();
  const { t } = useI18n();
  const [newProjectName, setNewProjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const colors = settings.customColors;
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      addProject({
        name: newProjectName.trim(),
        description: '',
        color: randomColor,
        tags: [],
        parentId: null,
        status: 'not-started',
        isLeaf: false,
      });
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* 折叠状态的触发按钮 */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-0 top-0 z-40 w-12 h-full bg-white/30 backdrop-blur-sm
                     hover:bg-white/50 transition-colors flex items-start justify-center pt-4
                     border-r border-white/20"
        >
          <Menu className="w-5 h-5 text-gray-500" />
        </button>
      )}

      {/* 侧边栏抽屉 */}
      <div
        className={`
          fixed left-0 top-0 z-50 h-full w-64 bg-white/90 backdrop-blur-md
          shadow-xl transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-700">{t.sidebar.projects}</h2>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 项目树 */}
        <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {projects.map((project) => (
            <SidebarTreeItem
              key={project.id}
              item={project}
              level={0}
              projectColor={project.color}
            />
          ))}

          {/* 添加项目 */}
          {isAdding ? (
            <div className="flex items-center gap-2 py-2 px-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddProject();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
                placeholder={t.sidebar.addProject}
                className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1 text-sm outline-none focus:border-gray-400"
                autoFocus
              />
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 w-full py-2 px-3 text-gray-500 hover:bg-white/50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">{t.sidebar.addProject}</span>
            </button>
          )}
        </div>
      </div>

      {/* 遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

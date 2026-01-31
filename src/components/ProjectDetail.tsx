'use client';

import React, { useState } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { ProjectItem } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { ChevronRight, ChevronDown, Plus, Circle, CheckCircle2, X, Pencil } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';

interface TaskTreeItemProps {
  item: ProjectItem;
  level: number;
  onNavigate: (item: ProjectItem) => void;
  onEdit: (item: ProjectItem) => void;
}

const TaskTreeItem: React.FC<TaskTreeItemProps> = ({ item, level, onNavigate, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const { addChildTask, updateProject, deleteProject } = useBuwenStore();
  const { t } = useI18n();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${item.id}`,
    data: {
      type: 'task',
      task: item,
    },
    disabled: !item.isLeaf,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  const hasChildren = item.children.length > 0;
  const showBreadcrumbNav = level >= 4 && hasChildren;

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addChildTask(item.id, {
        name: newTaskName.trim(),
        description: '',
        color: item.color,
        tags: [],
        status: 'not-started',
        isLeaf: true,
      });
      setNewTaskName('');
      setIsAdding(false);
    }
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject(item.id, {
      status: item.status === 'completed' ? 'not-started' : 'completed',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(item.id);
  };

  const indentClass = `ml-${Math.min(level, 5) * 4}`;

  return (
    <div className="animate-fade-in">
      <div
        ref={item.isLeaf ? setNodeRef : undefined}
        {...(item.isLeaf ? { ...listeners, ...attributes } : {})}
        className={`
          group flex items-center gap-2 py-2 px-3 rounded-lg
          hover:bg-gray-50 transition-colors duration-200
          ${item.isLeaf ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${item.status === 'completed' ? 'opacity-60' : ''}
        `}
        style={{ marginLeft: `${Math.min(level, 5) * 16}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren && !showBreadcrumbNav && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* 导航到子视图 */}
        {showBreadcrumbNav && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(item);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* 叶子任务标识 / 完成状态 */}
        {item.isLeaf && (
          <button onClick={handleToggleComplete} className="flex-shrink-0">
            {item.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        )}

        {/* 没有子节点的非叶子任务 */}
        {!hasChildren && !item.isLeaf && <div className="w-5" />}

        {/* 任务名称 */}
        <span
          className={`
            flex-1 text-gray-700
            ${item.status === 'completed' ? 'line-through text-gray-400' : ''}
            ${item.isLeaf ? '' : 'font-medium'}
          `}
          onClick={() => !item.isLeaf && hasChildren && setIsExpanded(!isExpanded)}
        >
          {item.name}
        </span>

        {/* 色条指示 */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.color }}
        />

        {/* 操作按钮 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
            title={t.projects.edit}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
            title={t.projects.addChild}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
            title={t.projects.delete}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 添加子任务输入框 */}
      {isAdding && (
        <div
          className="flex items-center gap-2 py-2 px-3"
          style={{ marginLeft: `${(Math.min(level, 5) + 1) * 16}px` }}
        >
          <Circle className="w-5 h-5 text-gray-300" />
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            placeholder={t.projects.addChild}
            className="flex-1 bg-transparent border-b border-gray-300 focus:border-gray-500 outline-none py-1 text-gray-700"
            autoFocus
          />
          <button
            onClick={() => setIsAdding(false)}
            className="p-1 hover:bg-gray-200 rounded text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 子任务列表 */}
      {hasChildren && isExpanded && !showBreadcrumbNav && (
        <div className="transition-all duration-300 ease-in-out">
          {item.children.map((child) => (
            <TaskTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onNavigate={onNavigate}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectDetail: React.FC = () => {
  const { selectedProjectId, breadcrumbs, findProjectById, selectProject, setBreadcrumbs } = useBuwenStore();
  const { t } = useI18n();
  const [newTaskName, setNewTaskName] = useState('');
  const { addChildTask } = useBuwenStore();
  const [editingTask, setEditingTask] = useState<ProjectItem | null>(null);

  if (!selectedProjectId) return null;

  // 获取当前查看的项目（可能是根项目或子任务）
  const currentViewId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : selectedProjectId;
  const currentProject = findProjectById(currentViewId);

  if (!currentProject) return null;

  const handleNavigate = (item: ProjectItem) => {
    setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleBack = () => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(breadcrumbs.slice(0, -1));
    } else {
      selectProject(null);
      setBreadcrumbs([]);
    }
  };

  const handleAddRootTask = () => {
    if (newTaskName.trim()) {
      addChildTask(currentProject.id, {
        name: newTaskName.trim(),
        description: '',
        color: currentProject.color,
        tags: [],
        status: 'not-started',
        isLeaf: true,
      });
      setNewTaskName('');
    }
  };

  const handleEditTask = (task: ProjectItem) => {
    setEditingTask(task);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* 头部：面包屑导航 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={handleBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
        </button>

        <nav className="flex items-center gap-1 text-sm overflow-x-auto">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`
                  px-2 py-1 rounded-md whitespace-nowrap transition-colors
                  ${index === breadcrumbs.length - 1
                    ? 'text-gray-800 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* 项目描述 */}
      {currentProject.description && (
        <div className="px-4 py-3 text-gray-600 text-sm border-b border-gray-50">
          {currentProject.description}
        </div>
      )}

      {/* 任务树 */}
      <div className="flex-1 overflow-y-auto py-2">
        {currentProject.children.length > 0 ? (
          currentProject.children.map((child) => (
            <TaskTreeItem
              key={child.id}
              item={child}
              level={0}
              onNavigate={handleNavigate}
              onEdit={handleEditTask}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">{t.sidebar.addTask}</p>
          </div>
        )}
      </div>

      {/* 快速添加 */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddRootTask();
            }}
            placeholder={t.sidebar.addTask}
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          {newTaskName && (
            <button
              onClick={handleAddRootTask}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* 任务编辑模态框 */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};

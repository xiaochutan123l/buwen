'use client';

import React, { useMemo, useState } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { ProjectItem } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { ChevronRight, ChevronDown, Circle, CheckCircle2, Pencil, Check } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';

interface ProjectCardProps {
  project: ProjectItem;
  onClick: () => void;
  onEdit: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onEdit }) => {
  const { getNextTask, updateProject } = useBuwenStore();
  const { t } = useI18n();
  const nextTask = useMemo(() => getNextTask(project.id), [project.id, getNextTask]);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `project-${project.id}`,
    data: {
      type: 'project',
      project,
    },
  });

  // 原卡片不移动，只有 DragOverlay 移动
  const style = undefined;

  // 计算进度（简单版：已完成的叶子任务数 / 总叶子任务数）
  const calculateProgress = (item: ProjectItem): { completed: number; total: number } => {
    if (item.isLeaf || item.children.length === 0) {
      return {
        completed: item.status === 'completed' ? 1 : 0,
        total: 1,
      };
    }
    return item.children.reduce(
      (acc, child) => {
        const childProgress = calculateProgress(child);
        return {
          completed: acc.completed + childProgress.completed,
          total: acc.total + childProgress.total,
        };
      },
      { completed: 0, total: 0 }
    );
  };

  const progress = useMemo(() => calculateProgress(project), [project]);
  const progressWidth = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  // 生成基于项目颜色的渐变背景
  const cardBackground = {
    background: `linear-gradient(135deg, ${project.color}15 0%, ${project.color}08 50%, white 100%)`,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardBackground}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        group relative backdrop-blur-sm rounded-2xl p-5 
        shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer
        border-2 hover:border-opacity-80
        animate-float-in
        ${project.status === 'completed' ? 'opacity-60' : ''}
      `}
      data-color={project.color}
    >
      {/* 左侧色条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
        style={{ backgroundColor: project.color }}
      />

      {/* 完成状态标记 */}
      {project.status === 'completed' && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* 项目名称 */}
      <h3 className={`text-lg font-medium mb-2 pl-4 pr-8 group-hover:text-gray-900 ${project.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
        {project.name}
      </h3>

      {/* 操作按钮组 */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {/* 标记完成/取消完成按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateProject(project.id, {
              status: project.status === 'completed' ? 'not-started' : 'completed',
            });
          }}
          className={`p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm transition-all ${
            project.status === 'completed' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'
          }`}
          title={project.status === 'completed' ? '取消完成' : t.projects.markComplete}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        {/* 编辑按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 shadow-sm transition-all"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* 标签 */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full text-gray-700"
              style={{ backgroundColor: `${project.color}25` }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 进度条 */}
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3 mx-4 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 shadow-sm"
          style={{
            width: `${progressWidth}%`,
            backgroundColor: project.color,
            opacity: 0.85,
          }}
        />
      </div>

      {/* 下一个待做任务提示 */}
      {nextTask && (
        <div className="pl-4 text-sm text-gray-500 truncate">
          <span className="text-gray-400">{t.projects.nextTask}：</span>
          {nextTask.name}
        </div>
      )}

      {/* Hover 边框效果 */}
      <div
        className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: project.color }}
      />
    </div>
  );
};

// 列表视图的项目行组件
interface ProjectListItemProps {
  project: ProjectItem;
  level: number;
  onSelect: (project: ProjectItem) => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, level, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const { getNextTask, updateProject } = useBuwenStore();
  const { t } = useI18n();
  const nextTask = useMemo(() => getNextTask(project.id), [project.id, getNextTask]);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `list-${project.id}`,
    data: {
      type: project.isLeaf ? 'task' : 'project',
      task: project,
      project,
    },
    disabled: !project.isLeaf,
  });

  const hasChildren = project.children.length > 0;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject(project.id, {
      status: project.status === 'completed' ? 'not-started' : 'completed',
    });
  };

  return (
    <div className="animate-fade-in">
      <div
        ref={project.isLeaf ? setNodeRef : undefined}
        {...(project.isLeaf ? { ...listeners, ...attributes } : {})}
        className={`
          group flex items-center gap-2 py-2.5 px-3 rounded-lg
          hover:bg-white/70 transition-colors duration-200
          ${project.isLeaf ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          ${project.status === 'completed' ? 'opacity-60' : ''}
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => {
          if (!project.isLeaf && hasChildren) {
            setIsExpanded(!isExpanded);
          } else if (level === 0) {
            onSelect(project);
          }
        }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* 叶子任务完成状态 */}
        {project.isLeaf && (
          <button onClick={handleToggleComplete} className="flex-shrink-0">
            {project.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        )}

        {/* 色条 */}
        <div
          className="w-1.5 h-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {/* 名称 */}
        <span
          className={`
            flex-1 text-gray-700 truncate
            ${project.status === 'completed' ? 'line-through text-gray-400' : ''}
            ${level === 0 ? 'font-medium' : ''}
          `}
        >
          {project.name}
        </span>

        {/* 标签 */}
        {project.tags.length > 0 && (
          <div className="hidden md:flex gap-1">
            {project.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 下一步任务提示 */}
        {!project.isLeaf && nextTask && (
          <span className="hidden lg:block text-xs text-gray-400 truncate max-w-[150px]">
            → {nextTask.name}
          </span>
        )}

        {/* 进入详情按钮 */}
        {level === 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* 子项目/任务 */}
      {hasChildren && isExpanded && (
        <div>
          {project.children.map((child) => (
            <ProjectListItem
              key={child.id}
              project={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectGrid: React.FC = () => {
  const { projects, viewMode, searchQuery, selectedTags, showCompleted, selectProject, setBreadcrumbs } = useBuwenStore();
  const { t } = useI18n();
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // 过滤项目
  const filteredProjects = useMemo(() => {
    const { tags: allTags } = useBuwenStore.getState();
    // 获取选中的标签名称
    const selectedTagNames = selectedTags.map(tagId => {
      const tag = allTags.find(t => t.id === tagId);
      return tag?.name || '';
    }).filter(Boolean);

    return projects.filter(project => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!project.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 标签过滤 - 根据标签名称匹配
      if (selectedTagNames.length > 0) {
        if (!project.tags.some(tag => selectedTagNames.includes(tag))) {
          return false;
        }
      }

      // 完成状态过滤
      // showCompleted = true: 只显示已完成的项目
      // showCompleted = false: 只显示未完成的项目
      if (showCompleted) {
        // 显示已完成：只保留已完成的项目
        if (project.status !== 'completed') {
          return false;
        }
      } else {
        // 显示未完成：隐藏已完成的项目
        if (project.status === 'completed') {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchQuery, selectedTags, showCompleted]);

  // 视图模式对应的网格样式
  const gridClasses = {
    compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
    comfortable: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    relaxed: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    list: 'grid-cols-1 gap-0', // 列表模式不使用grid
  };

  const handleProjectClick = (project: ProjectItem) => {
    selectProject(project.id);
    setBreadcrumbs([{ id: project.id, name: project.name }]);
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <span className="text-5xl mb-4">🌱</span>
        <p className="text-lg">{t.projects.emptyState}</p>
      </div>
    );
  }

  // 列表视图模式
  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {filteredProjects.map(project => (
          <ProjectListItem
            key={project.id}
            project={project}
            level={0}
            onSelect={handleProjectClick}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${gridClasses[viewMode]}`}>
        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => handleProjectClick(project)}
            onEdit={() => setEditingProject(project)}
          />
        ))}
      </div>

      {/* 项目编辑弹窗 */}
      {editingProject && (
        <TaskEditModal
          task={editingProject}
          isOpen={true}
          onClose={() => setEditingProject(null)}
          isRootProject={true}
        />
      )}
    </>
  );
};

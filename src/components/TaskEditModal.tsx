'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { ProjectItem } from '@/types';
import { X, Tag, Palette, FileText, Save, Trash2 } from 'lucide-react';

interface TaskEditModalProps {
  task: ProjectItem;
  isOpen: boolean;
  onClose: () => void;
  isRootProject?: boolean; // 是否是顶层项目，只有顶层项目才能编辑颜色和标签
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, isOpen, onClose, isRootProject = false }) => {
  const { updateProject, deleteProject, settings, tags, selectProject } = useBuwenStore();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [color, setColor] = useState(task.color);
  const [taskTags, setTaskTags] = useState<string[]>(task.tags);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    setName(task.name);
    setDescription(task.description || '');
    setColor(task.color);
    setTaskTags(task.tags);
  }, [task]);

  if (!isOpen || !mounted) return null;

  const handleSave = () => {
    updateProject(task.id, {
      name: name.trim() || task.name,
      description,
      color,
      tags: taskTags,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      deleteProject(task.id);
      selectProject(null); // 清除选中状态
      onClose();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !taskTags.includes(newTag.trim())) {
      setTaskTags([...taskTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTaskTags(taskTags.filter(tag => tag !== tagToRemove));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-float-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-700">{t.projects.edit}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* 任务名称 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <FileText className="w-4 h-4" />
              任务名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none transition-colors"
              placeholder="任务名称"
            />
          </div>

          {/* 描述 - 富文本区域 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <FileText className="w-4 h-4" />
              描述 / 笔记
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none transition-colors resize-none"
              placeholder="添加描述、笔记、链接..."
            />
            <p className="text-xs text-gray-400 mt-1">支持 Markdown 格式</p>
          </div>

          {/* 颜色选择 - 仅顶层项目可编辑 */}
          {isRootProject && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Palette className="w-4 h-4" />
              颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {settings.customColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`
                    w-8 h-8 rounded-full transition-all
                    ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                title="自定义颜色"
              />
            </div>
          </div>
          )}

          {/* 标签 - 仅顶层项目可编辑 */}
          {isRootProject && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Tag className="w-4 h-4" />
              标签
            </label>
            
            {/* 已有标签 */}
            <div className="flex flex-wrap gap-2 mb-2">
              {taskTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* 添加标签 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-gray-400 outline-none"
                placeholder="添加标签..."
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
              >
                添加
              </button>
            </div>

            {/* 快速选择已有标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (!taskTags.includes(tag.name)) {
                        setTaskTags([...taskTags, tag.name]);
                      }
                    }}
                    disabled={taskTags.includes(tag.name)}
                    className={`
                      px-2 py-0.5 text-xs rounded-full transition-colors
                      ${taskTags.includes(tag.name)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex gap-2 p-4 border-t border-gray-100">
          {/* 删除按钮 - 仅顶层项目可删除 */}
          {isRootProject && (
            <button
              onClick={handleDelete}
              className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
              title={t.projects.delete}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t.actions.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t.actions.save}
          </button>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，避免被父容器的 overflow 限制
  return createPortal(modalContent, document.body);
};

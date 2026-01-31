'use client';

import React, { useState } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { Search, Settings, LayoutGrid, Rows, LayoutList, List, X, Plus } from 'lucide-react';

interface ToolbarProps {
  onSettingsClick: () => void;
  onAddProject?: () => void;
  themeColor?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSettingsClick, onAddProject, themeColor = '#4ECDC4' }) => {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, tags, selectedTags, toggleTag, showCompleted, toggleShowCompleted } = useBuwenStore();
  const { t } = useI18n();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const viewModes = [
    { mode: 'compact' as const, icon: LayoutGrid, label: t.settings.compact },
    { mode: 'comfortable' as const, icon: Rows, label: t.settings.comfortable },
    { mode: 'relaxed' as const, icon: LayoutList, label: t.settings.relaxed },
    { mode: 'list' as const, icon: List, label: t.settings.list },
  ];

  return (
    <div 
      className="flex flex-wrap items-center gap-3 px-4 py-3 backdrop-blur-md rounded-xl mb-4 border border-white/50 shadow-lg"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.75) 0%, ${themeColor}30 100%)`,
        boxShadow: `0 4px 24px ${themeColor}25`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-xl font-light text-gray-700">{t.app.name}</span>
        <span className="text-xs text-gray-400 hidden sm:inline">{t.app.slogan}</span>
      </div>

      {/* 搜索框 */}
      <div
        className={`
          flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5
          transition-all duration-200
          ${isSearchFocused ? 'ring-2 ring-gray-300 w-48 md:w-64' : 'w-36 md:w-48'}
        `}
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder={t.search.placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 hover:bg-gray-100 rounded"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* 标签过滤和完成状态 */}
      <div className="hidden md:flex items-center gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`
              px-2.5 py-1 text-xs rounded-full transition-all duration-200
              ${selectedTags.includes(tag.id)
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            style={{
              backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined,
            }}
          >
            {tag.name}
          </button>
        ))}
        {/* 显示已完成切换 */}
        <button
          onClick={toggleShowCompleted}
          className={`
            px-2.5 py-1 text-xs rounded-full transition-all duration-200 flex items-center gap-1
            ${showCompleted
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <span>✓</span>
          <span>{showCompleted ? t.settings.showCompleted : t.settings.hideCompleted}</span>
        </button>
      </div>

      {/* 添加项目按钮 */}
      {onAddProject && (
        <button
          onClick={onAddProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t.projects.addProject}</span>
        </button>
      )}

      {/* 视图模式切换 */}
      <div className="flex items-center bg-white/80 rounded-lg p-0.5">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`
              p-1.5 rounded-md transition-colors
              ${viewMode === mode ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}
            `}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* 设置 */}
      <button
        onClick={onSettingsClick}
        className="p-2 hover:bg-white/80 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  );
};

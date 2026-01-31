'use client';

import React, { useState } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { X, Plus, Trash2, Pencil, Check, Palette } from 'lucide-react';

// 预设主题色 - 简洁的单色主题
const THEME_COLORS = [
  { name: '薄荷绿', nameEn: 'Mint', color: '#4ECDC4' },
  { name: '樱花粉', nameEn: 'Sakura', color: '#FF6B9D' },
  { name: '天空蓝', nameEn: 'Sky', color: '#74B9FF' },
  { name: '薰衣草', nameEn: 'Lavender', color: '#A29BFE' },
  { name: '暖阳橙', nameEn: 'Sunset', color: '#FFA07A' },
  { name: '柠檬黄', nameEn: 'Lemon', color: '#FFD93D' },
  { name: '森林绿', nameEn: 'Forest', color: '#2C5F2D' },
  { name: '石墨灰', nameEn: 'Graphite', color: '#636E72' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, tags, addTag, updateTag, deleteTag } = useBuwenStore();
  const { t, language, setLanguage } = useI18n();
  
  // 标签管理状态
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4ECDC4');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');

  if (!isOpen) return null;

  // 获取当前主题色
  const currentThemeColor = settings.customColors?.[0] || '#4ECDC4';

  const handleSelectTheme = (color: string) => {
    updateSettings({ customColors: [color] });
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor('#4ECDC4');
    }
  };

  const handleStartEditTag = (tag: { id: string; name: string; color: string }) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
  };

  const handleSaveEditTag = () => {
    if (editingTagId && editingTagName.trim()) {
      updateTag(editingTagId, { name: editingTagName.trim(), color: editingTagColor });
      setEditingTagId(null);
      setEditingTagName('');
      setEditingTagColor('');
    }
  };

  const handleDeleteTag = (id: string) => {
    deleteTag(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-hidden animate-float-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-700">{t.settings.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[65vh]">
          {/* 视图模式 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">{t.settings.viewMode}</h3>
            <div className="flex gap-2 flex-wrap">
              {(['compact', 'comfortable', 'relaxed', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ viewMode: mode })}
                  className={`
                    flex-1 min-w-[70px] py-2 px-3 rounded-lg text-sm transition-colors
                    ${settings.viewMode === mode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {t.settings[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* 语言 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">{t.settings.language}</h3>
            <div className="flex gap-2">
              {(['auto', 'zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    updateSettings({ language: lang });
                    if (lang !== 'auto') setLanguage(lang);
                  }}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-sm transition-colors
                    ${settings.language === lang
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {lang === 'auto' ? t.settings.auto : lang === 'zh' ? '中文' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {/* 主题色 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {language === 'zh' ? '主题色' : 'Theme Color'}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              {language === 'zh' ? '选择一个主题色，将应用到整个界面' : 'Choose a theme color for the entire interface'}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {THEME_COLORS.map((theme) => (
                <button
                  key={theme.color}
                  onClick={() => handleSelectTheme(theme.color)}
                  className={`
                    flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all
                    ${currentThemeColor === theme.color 
                      ? 'bg-gray-100 ring-2 ring-gray-300' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-full shadow-sm transition-transform ${
                      currentThemeColor === theme.color ? 'scale-110 ring-2 ring-white ring-offset-2' : ''
                    }`}
                    style={{ 
                      backgroundColor: theme.color,
                      boxShadow: currentThemeColor === theme.color ? `0 4px 12px ${theme.color}50` : undefined
                    }}
                  />
                  <span className="text-[10px] text-gray-500 text-center leading-tight">
                    {language === 'zh' ? theme.name : theme.nameEn}
                  </span>
                </button>
              ))}
            </div>
            {/* 自定义颜色 */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={currentThemeColor}
                onChange={(e) => handleSelectTheme(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <span className="text-xs text-gray-400">
                {language === 'zh' ? '或选择自定义颜色' : 'Or pick a custom color'}
              </span>
            </div>
          </div>

          {/* 标签管理 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              {language === 'zh' ? '标签管理' : 'Tag Management'}
            </h3>
            <div className="space-y-2 mb-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  {editingTagId === tag.id ? (
                    <>
                      <input
                        type="color"
                        value={editingTagColor}
                        onChange={(e) => setEditingTagColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        className="flex-1 text-sm bg-white px-2 py-1 rounded border border-gray-200 outline-none focus:border-gray-400"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEditTag}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTagId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm text-gray-700">{tag.name}</span>
                      <button
                        onClick={() => handleStartEditTag(tag)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* 添加新标签 */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={language === 'zh' ? '新标签名称...' : 'New tag name...'}
                className="flex-1 text-sm bg-white px-2 py-1.5 rounded border border-gray-200 outline-none focus:border-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-gray-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 数据说明 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {language === 'zh' 
                ? '📦 数据保存在浏览器本地存储中' 
                : '📦 Data is saved in browser local storage'}
            </p>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t.actions.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 步纹 (Buwen) - 主页面
 * 
 * 这是应用的入口页面，负责：
 * 1. 整体布局（工具栏、项目区、日历区）
 * 2. 主题色样式生成和应用
 * 3. 拖拽上下文提供
 * 4. 国际化上下文提供
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';
import { I18nProvider } from '@/i18n/I18nProvider';
import {
  ProjectGrid,
  ProjectDetail,
  Calendar,
  Toolbar,
  SettingsModal,
  DndProvider,
  DataLoader,
} from '@/components';

/**
 * 根据主题色生成分层背景样式
 * 
 * 设计原则：底层最深，上层较浅，形成视觉层次
 * 
 * @param themeColor - 十六进制颜色值，如 '#4ECDC4'
 * @returns 包含各层背景样式的对象
 * 
 * 颜色透明度说明（十六进制后缀）：
 * - 60 = 约 38% 透明度
 * - 40 = 约 25% 透明度
 * - 20 = 约 12% 透明度
 * - 更大的数字 = 更深的颜色
 */
const generateThemeStyles = (themeColor: string) => {
  return {
    // 最底层背景 - 最深的主题色
    baseBg: `linear-gradient(145deg, ${themeColor}60 0%, ${themeColor}40 40%, ${themeColor}20 100%)`,
    // 工具栏背景 - 中等深度
    toolbarBg: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, ${themeColor}28 100%)`,
    // 项目区域和日历区域背景 - 较浅但仍有主题色
    cardBg: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${themeColor}22 100%)`,
    // 主题色
    themeColor,
    // 阴影颜色
    shadowColor: `${themeColor}35`,
  };
};

function MainApp() {
  const { selectedProjectId, settings, addProject } = useBuwenStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防止 SSR hydration 不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取当前主题色 - 直接从 settings 读取，确保响应更新
  const currentThemeColor = settings.customColors?.[0] || '#4ECDC4';
  
  // 根据主题色生成样式
  const themeStyles = generateThemeStyles(currentThemeColor);

  const handleAddProject = () => {
    const colors = settings.customColors || ['#4ECDC4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)] || '#4ECDC4';
    addProject({
      name: '新项目',
      description: '',
      color: randomColor,
      tags: [],
      parentId: null,
      status: 'not-started',
      isLeaf: false,
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-main-gradient flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <DndProvider>
      <div 
        className="min-h-screen flex flex-col transition-all duration-300"
        style={{ background: themeStyles.baseBg }}
      >
        {/* 主内容区 */}
        <main className="flex-1 flex flex-col">
          {/* 顶部工具栏 */}
          <div className="p-4 pb-0">
            <Toolbar 
              onSettingsClick={() => setSettingsOpen(true)} 
              onAddProject={handleAddProject}
              themeColor={themeStyles.themeColor}
            />
          </div>

          {/* 中间项目区域 */}
          <div className="flex-1 p-4 overflow-hidden" style={{ height: '55vh' }}>
            <div 
              className="h-full backdrop-blur-md rounded-2xl p-4 overflow-y-auto transition-all duration-300 border border-white/60 shadow-xl"
              style={{ 
                background: themeStyles.cardBg,
                boxShadow: `0 8px 32px ${themeStyles.shadowColor}`,
              }}
            >
              {selectedProjectId ? <ProjectDetail /> : <ProjectGrid />}
            </div>
          </div>

          {/* 下方日历区域 */}
          <div className="h-[40vh] p-4 pt-0">
            <div 
              className="h-full rounded-2xl transition-all duration-300 overflow-hidden backdrop-blur-md border border-white/60 shadow-xl"
              style={{ 
                background: themeStyles.cardBg,
                boxShadow: `0 8px 32px ${themeStyles.shadowColor}`,
              }}
            >
              <Calendar />
            </div>
          </div>
        </main>

        {/* 设置弹窗 */}
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </DndProvider>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <DataLoader>
        <MainApp />
      </DataLoader>
    </I18nProvider>
  );
}

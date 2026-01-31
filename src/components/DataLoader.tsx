'use client';

/**
 * 数据初始化组件
 * 在应用启动时从服务器加载数据
 */

import { useEffect } from 'react';
import { useBuwenStore } from '@/store/useBuwenStore';

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loadFromServer, isLoading, syncError } = useBuwenStore();

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#4ECDC4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">正在加载数据...</p>
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">连接服务器失败</h2>
          <p className="text-gray-500 mb-4">{syncError}</p>
          <button
            onClick={() => loadFromServer()}
            className="px-4 py-2 bg-[#4ECDC4] text-white rounded-lg hover:bg-[#3dbdb5] transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

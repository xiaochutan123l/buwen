'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { useBuwenStore } from '@/store/useBuwenStore';
import { ProjectItem, ScheduledTask } from '@/types';
import { Copy, Move } from 'lucide-react';

interface DndProviderProps {
  children: React.ReactNode;
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const { scheduleTask, moveScheduledTask } = useBuwenStore();
  const [activeItem, setActiveItem] = useState<ProjectItem | null>(null);
  const [activeScheduledTask, setActiveScheduledTask] = useState<ScheduledTask | null>(null);
  const [activeType, setActiveType] = useState<'task' | 'project' | 'scheduled-task' | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === 'task') {
      setActiveItem(data.task);
      setActiveType('task');
    } else if (data?.type === 'project') {
      setActiveItem(data.project);
      setActiveType('project');
    } else if (data?.type === 'scheduled-task') {
      setActiveScheduledTask(data.scheduledTask);
      setActiveType('scheduled-task');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.data.current?.type === 'calendar-day') {
      const date = over.data.current.date as string;
      const data = active.data.current;

      if (data?.type === 'task' && data.task) {
        // 拖拽任务到日历 - 复制操作，原任务保持在项目库
        scheduleTask(data.task.id, date, false);
      } else if (data?.type === 'project' && data.project) {
        // 拖拽项目到日历（创建项目聚焦块）
        scheduleTask(data.project.id, date, true);
      } else if (data?.type === 'scheduled-task' && data.scheduledTask) {
        // 日历内拖拽 - 移动到新日期
        const scheduledTask = data.scheduledTask as ScheduledTask;
        if (scheduledTask.date !== date) {
          moveScheduledTask(scheduledTask.id, date);
        }
      }
    }

    setActiveItem(null);
    setActiveScheduledTask(null);
    setActiveType(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}

      {/* 拖拽预览 - 显示复制/移动效果 */}
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div
            className="bg-white shadow-2xl rounded-lg p-2.5 border-l-4 max-w-44 opacity-90 rotate-2 scale-105"
            style={{ borderLeftColor: activeItem.color }}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-700 truncate">
                {activeType === 'project' ? `[${activeItem.name}]` : activeItem.name}
              </p>
            </div>
          </div>
        )}
        {activeScheduledTask && (
          <div
            className="bg-white shadow-2xl rounded-lg p-2.5 border-l-4 max-w-44 opacity-90 rotate-2 scale-105"
            style={{ borderLeftColor: activeScheduledTask.projectColor }}
          >
            <div className="flex items-center gap-2">
              <Move className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-700 truncate">
                {activeScheduledTask.isProjectBlock ? `[${activeScheduledTask.projectName}]` : activeScheduledTask.taskName}
              </p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

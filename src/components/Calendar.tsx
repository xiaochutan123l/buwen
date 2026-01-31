'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBuwenStore } from '@/store/useBuwenStore';
import { useI18n } from '@/i18n/I18nProvider';
import { ScheduledTask, ProjectItem } from '@/types';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { format, addDays, subDays, isToday } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Trash2, RotateCcw, Move, Copy, Calendar as CalendarIcon, Pencil } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';

// 任务操作菜单 - 使用 Portal 渲染到 body
interface TaskMenuProps {
  task: ScheduledTask;
  onClose: () => void;
  anchorRect: DOMRect;
  allDates: Date[];
  onEdit: (taskId: string) => void;
}

const TaskMenu: React.FC<TaskMenuProps> = ({ task, onClose, anchorRect, allDates, onEdit }) => {
  const { unscheduleTask, completeScheduledTask, toggleScheduledTaskStatus, moveScheduledTask, scheduleTask } = useBuwenStore();
  const { t, language } = useI18n();
  const [showDatePicker, setShowDatePicker] = useState<'move' | 'copy' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const handleEdit = () => {
    onEdit(task.taskId);
    onClose();
  };

  const handleComplete = () => {
    completeScheduledTask(task.id);
    onClose();
  };

  const handleUncomplete = () => {
    toggleScheduledTaskStatus(task.id);
    onClose();
  };

  const handleRemove = () => {
    unscheduleTask(task.id);
    onClose();
  };

  const handleMoveToDate = (dateStr: string) => {
    moveScheduledTask(task.id, dateStr);
    onClose();
  };

  const handleCopyToDate = (dateStr: string) => {
    // 复制任务到新日期
    scheduleTask(task.taskId, dateStr, task.isProjectBlock);
    onClose();
  };

  // 计算菜单位置 - 在卡片右侧或左侧显示
  const menuWidth = 180;
  // 动态估算菜单高度：基础高度 + 日期选择器高度
  const baseMenuHeight = 220;
  const datePickerHeight = 160;
  const menuHeight = showDatePicker ? baseMenuHeight + datePickerHeight : baseMenuHeight;
  
  let left = anchorRect.right + 8;
  let top = anchorRect.top;
  
  // 如果右边空间不够，显示在左边
  if (left + menuWidth > window.innerWidth - 10) {
    left = anchorRect.left - menuWidth - 8;
  }
  
  // 如果还是不够，显示在卡片下方
  if (left < 10) {
    left = Math.max(10, anchorRect.left);
    top = anchorRect.bottom + 8;
  }
  
  // 确保不超出底部 - 向上调整位置
  const bottomSpace = window.innerHeight - top;
  if (bottomSpace < menuHeight + 20) {
    // 如果底部空间不足，尝试将菜单向上显示
    const topSpace = anchorRect.top;
    if (topSpace > bottomSpace) {
      // 上方空间更大，菜单显示在卡片上方
      top = Math.max(10, anchorRect.top - menuHeight + anchorRect.height);
    } else {
      // 强制限制在可视区域内
      top = Math.max(10, window.innerHeight - menuHeight - 20);
    }
  }

  const locale = language === 'zh' ? zhCN : enUS;

  const menuContent = (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      
      {/* 菜单 */}
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 py-1 animate-fade-in"
        style={{
          left,
          top,
          minWidth: menuWidth,
        }}
      >
        {/* 完成/撤销完成 */}
        {task.status === 'completed' ? (
          <button
            onClick={handleUncomplete}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>撤销完成</span>
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Check className="w-4 h-4 text-green-500" />
            <span>{t.projects.markComplete}</span>
          </button>
        )}

        {/* 编辑任务 */}
        <button
          onClick={handleEdit}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          <span>{t.projects.edit}</span>
        </button>

        <div className="h-px bg-gray-100 my-1" />

        {/* 移动到其他日期 */}
        <button
          onClick={() => setShowDatePicker(showDatePicker === 'move' ? null : 'move')}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Move className="w-4 h-4" />
          <span>移动到...</span>
          <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showDatePicker === 'move' ? 'rotate-90' : ''}`} />
        </button>

        {/* 复制到其他日期 */}
        <button
          onClick={() => setShowDatePicker(showDatePicker === 'copy' ? null : 'copy')}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>复制到...</span>
          <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${showDatePicker === 'copy' ? 'rotate-90' : ''}`} />
        </button>

        {/* 日期选择器 */}
        {showDatePicker && (
          <div className="border-t border-gray-100 mt-1 pt-1 max-h-[150px] overflow-y-auto">
            {allDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isCurrent = dateStr === task.date;
              const isTodayDate = isToday(date);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (!isCurrent) {
                      if (showDatePicker === 'move') {
                        handleMoveToDate(dateStr);
                      } else {
                        handleCopyToDate(dateStr);
                      }
                    }
                  }}
                  disabled={isCurrent}
                  className={`
                    w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                    ${isCurrent 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${isTodayDate ? 'font-medium' : ''}
                  `}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span>{format(date, 'M/d EEE', { locale })}</span>
                  {isTodayDate && <span className="text-[10px] text-rose-500 ml-auto">今天</span>}
                  {isCurrent && <span className="text-[10px] text-gray-400 ml-auto">当前</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="h-px bg-gray-100 my-1" />

        {/* 从日历移除 */}
        <button
          onClick={handleRemove}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t.projects.remove}</span>
        </button>
      </div>
    </>
  );

  return createPortal(menuContent, document.body);
};

// 可拖拽的日历任务卡片
interface DraggableTaskCardProps {
  task: ScheduledTask;
  onShowMenu: (task: ScheduledTask, rect: DOMRect) => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, onShowMenu }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${task.id}`,
    data: {
      type: 'scheduled-task',
      scheduledTask: task,
    },
  });

  // 原卡片不移动，只有 DragOverlay 移动
  const style = undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardRef.current) {
      onShowMenu(task, cardRef.current.getBoundingClientRect());
    }
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      {...listeners}
      {...attributes}
      data-task-card="true"
      onClick={handleClick}
      className={`
        relative rounded-lg px-2 py-1.5 cursor-pointer transition-all duration-200
        ${task.status === 'completed'
          ? 'bg-gray-100/80 opacity-70'
          : 'bg-white shadow-sm hover:shadow-md active:scale-[0.98]'
        }
      `}
    >
      {/* 项目色条 */}
      <div
        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
        style={{ backgroundColor: task.projectColor }}
      />

      <div className="pl-2">
        <p
          className={`
            text-xs leading-tight
            ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}
          `}
        >
          {task.isProjectBlock ? `[${task.projectName}]` : task.taskName}
        </p>
        {!task.isProjectBlock && (
          <p className="text-[10px] text-gray-400 truncate mt-0.5">{task.projectName}</p>
        )}
      </div>

      {/* 完成状态小标记 */}
      {task.status === 'completed' && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};

interface CalendarDayProps {
  date: Date;
  tasks: ScheduledTask[];
  isToday: boolean;
  allDates: Date[];
  onEditTask: (taskId: string) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, tasks, isToday: isTodayDate, allDates, onEditTask }) => {
  const { t, language } = useI18n();
  const [menuState, setMenuState] = useState<{ task: ScheduledTask; rect: DOMRect } | null>(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-${dateStr}`,
    data: {
      type: 'calendar-day',
      date: dateStr,
    },
  });

  const locale = language === 'zh' ? zhCN : enUS;
  const dayOfWeek = format(date, 'EEE', { locale });
  const dayNumber = format(date, 'd');
  const monthDay = format(date, 'M/d');

  const handleShowMenu = (task: ScheduledTask, rect: DOMRect) => {
    setMenuState({ task, rect });
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-32 md:w-40 min-h-[160px] rounded-xl p-3 transition-all duration-200
        ${isTodayDate
          ? 'bg-gradient-to-br from-pink-50 to-rose-100 shadow-md'
          : 'bg-white/70 hover:bg-white/90'
        }
        ${isOver ? 'ring-2 ring-dashed ring-gray-400 bg-gray-50/50 scale-[1.02]' : ''}
      `}
    >
      {/* 日期头部 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`
              text-xl font-light
              ${isTodayDate ? 'text-rose-500' : 'text-gray-700'}
            `}
          >
            {dayNumber}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400">{monthDay}</span>
            <span className={`text-[10px] ${isTodayDate ? 'text-rose-400' : 'text-gray-400'}`}>
              {dayOfWeek}
            </span>
          </div>
        </div>
        {isTodayDate && (
          <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full">
            {t.calendar.today}
          </span>
        )}
      </div>

      {/* 任务列表 - 使用可拖拽卡片 */}
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onShowMenu={handleShowMenu}
          />
        ))}
      </div>

      {/* 空状态提示 - 今天显示完整提示，其他日期显示加号 */}
      {tasks.length === 0 && (
        <div className={`
          flex flex-col items-center justify-center h-20 
          ${isOver ? 'text-gray-400' : 'text-gray-300'}
          transition-colors
        `}>
          {isTodayDate ? (
            <>
              <span className="text-2xl mb-1">📥</span>
              <span className="text-xs text-center leading-tight px-2">{t.calendar.emptyState}</span>
            </>
          ) : (
            <span className="text-lg opacity-50">+</span>
          )}
        </div>
      )}

      {/* 任务操作菜单 */}
      {menuState && (
        <TaskMenu
          task={menuState.task}
          anchorRect={menuState.rect}
          allDates={allDates}
          onClose={() => setMenuState(null)}
          onEdit={onEditTask}
        />
      )}
    </div>
  );
};

export const Calendar: React.FC = () => {
  const { scheduledTasks, findProjectById } = useBuwenStore();
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [editingTask, setEditingTask] = useState<ProjectItem | null>(null);

  // 生成日期范围：过去7天 + 今天 + 未来14天
  const dates = useMemo(() => {
    const today = new Date();
    const result: Date[] = [];
    
    for (let i = 7; i > 0; i--) {
      result.push(subDays(today, i));
    }
    result.push(today);
    for (let i = 1; i <= 14; i++) {
      result.push(addDays(today, i));
    }
    
    return result;
  }, []);

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ScheduledTask[]>();
    scheduledTasks.forEach((task) => {
      const existing = map.get(task.date) || [];
      map.set(task.date, [...existing, task]);
    });
    return map;
  }, [scheduledTasks]);

  // 自动滚动到今天
  useEffect(() => {
    if (scrollRef.current) {
      const todayElement = scrollRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, []);

  // 触摸滑动支持
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-task-card]')) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeftPos(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (startX - x) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos + walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 鼠标拖拽支持
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-task-card]')) return;
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeftPos(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (startX - x) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos + walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const scrollLeftBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRightBtn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const scrollToToday = () => {
    if (scrollRef.current) {
      const todayElement = scrollRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 日历头部 */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100/50">
        <div className="flex items-center gap-1">
          <button
            onClick={scrollLeftBtn}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={scrollToToday}
            className="px-2 py-1 text-xs bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
          >
            {t.calendar.today}
          </button>
          <button
            onClick={scrollRightBtn}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 日历滚动区域 */}
      <div
        ref={scrollRef}
        className={`
          flex-1 flex gap-2 p-3 overflow-x-auto scroll-smooth
          ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}
          scrollbar-hide
        `}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {dates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isTodayDate = isToday(date);
          return (
            <div key={dateStr} data-today={isTodayDate}>
              <CalendarDay
                date={date}
                tasks={tasksByDate.get(dateStr) || []}
                isToday={isTodayDate}
                allDates={dates}
                onEditTask={(taskId) => {
                  const task = findProjectById(taskId);
                  if (task) {
                    setEditingTask(task);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 空状态提示已移到今天的卡片内 */}

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

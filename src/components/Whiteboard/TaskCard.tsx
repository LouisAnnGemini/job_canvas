import React from 'react';
import { Task, useStore } from '../../store/useStore';
import { Check } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const TaskCard: React.FC<{ task: Task, isSelected: boolean, onPointerDown: (e: React.PointerEvent) => void, onDoubleClick?: (e: React.MouseEvent) => void }> = ({ task, isSelected, onPointerDown, onDoubleClick }) => {
  const { updateTask, columns } = useStore();

  return (
    <div
      className={cn(
        "absolute w-[260px] bg-white rounded-xl shadow-sm border p-4 cursor-grab active:cursor-grabbing transition-shadow",
        isSelected ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md z-10" : "border-zinc-200 hover:border-zinc-300 z-0"
      )}
      style={{
        left: task.x,
        top: task.y,
        touchAction: 'none'
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex items-start gap-3">
        <button
          className={cn(
            "mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors",
            task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 hover:border-zinc-400 bg-white"
          )}
          onClick={(e) => {
            e.stopPropagation();
            updateTask(task.id, { completed: !task.completed });
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {task.completed && <Check className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 leading-tight mb-1 break-words">
            {task.title || 'Untitled Task'}
          </h3>
          {task.description && (
            <p className="text-xs text-zinc-500 line-clamp-2 mb-3 break-words">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1.5 mt-2">
            {columns.filter(c => c.visible && c.type !== 'checkbox' && c.field !== 'title' && c.field !== 'description').map(col => {
              const val = col.isCustom ? task.customFields[col.id] : task[col.field as keyof Task];
              if (!val || (Array.isArray(val) && val.length === 0)) return null;
              
              if (col.type === 'select' || col.type === 'multi-select') {
                const vals = Array.isArray(val) ? val : [val];
                return vals.map(v => (
                  <span key={`${col.id}-${v}`} className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", getColorClasses(col.optionColors?.[v]))}>
                    {v}
                  </span>
                ));
              } else {
                return (
                  <span key={col.id} className="px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-600 text-[10px] font-medium border border-zinc-200">
                    {col.name}: {val}
                  </span>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

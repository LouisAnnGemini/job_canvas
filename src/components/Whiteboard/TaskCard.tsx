import React, { useState, useEffect, useRef } from 'react';
import { Task, useStore } from '../../store/useStore';
import { Check, Copy } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const TaskCard: React.FC<{ 
  task: Task, 
  isSelected: boolean, 
  isEditing?: boolean,
  onPointerDown: (e: React.PointerEvent) => void, 
  onDoubleClick?: (e: React.MouseEvent) => void,
  onStopEditing?: () => void,
  onDuplicate?: () => void
}> = ({ task, isSelected, isEditing, onPointerDown, onDoubleClick, onStopEditing, onDuplicate }) => {
  const { updateTask, columns } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(task.title);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalTitle(task.title);
  }, [task.title]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (localTitle !== task.title) {
      updateTask(task.id, { title: localTitle });
    }
    onStopEditing?.();
  };

  return (
    <div
      className={cn(
        "absolute w-[260px] bg-white rounded-xl shadow-sm border p-4 cursor-grab active:cursor-grabbing transition-shadow group",
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
      {onDuplicate && (
        <button
          className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded opacity-0 group-hover:opacity-100 transition-all z-20"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}

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
          {isEditing ? (
            <input
              ref={inputRef}
              className="w-full text-sm font-semibold text-zinc-900 leading-tight mb-1 bg-transparent outline-none border-b border-blue-500 px-0 py-0"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Task title"
            />
          ) : (
            <h3 className="text-sm font-semibold text-zinc-900 leading-tight mb-1 break-words min-h-[1.25em]">
              {task.title || <span className="text-zinc-400 italic">Untitled Task</span>}
            </h3>
          )}
          
          {task.description && !isEditing && (
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

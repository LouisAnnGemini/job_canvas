import React from 'react';
import { useStore, Task, Column } from '../../store/useStore';
import { X, Check } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function TaskDetailModal({ taskId, onClose }: { taskId: string, onClose: () => void }) {
  const { tasks, columns, updateTask } = useStore();
  const task = tasks.find(t => t.id === taskId);

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateTask(task.id, { completed: !task.completed })}
              className={cn(
                "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 hover:border-zinc-400 bg-white"
              )}
            >
              {task.completed && <Check className="w-4 h-4" />}
            </button>
            <h2 className="text-xl font-semibold text-zinc-900">Task Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-white">
          {columns.map(col => {
            const value = col.isCustom ? task.customFields[col.id] : task[col.field as keyof Task];
            
            if (col.type === 'checkbox') return null; // Handled in header
            
            return (
              <div key={col.id} className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 flex items-center justify-between">
                  {col.name}
                  {!col.visible && <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">Hidden in Table</span>}
                </label>
                
                {col.type === 'text' || col.type === 'number' ? (
                  col.field === 'description' ? (
                    <textarea
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-zinc-900 min-h-[100px] resize-y"
                      value={value || ''}
                      onChange={(e) => {
                        if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                        else updateTask(task.id, { [col.field]: e.target.value });
                      }}
                      placeholder={`Enter ${col.name.toLowerCase()}...`}
                    />
                  ) : (
                    <input
                      type={col.type === 'number' ? 'number' : 'text'}
                      className={cn(
                        "w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-zinc-900",
                        col.field === 'title' ? "text-lg font-medium" : ""
                      )}
                      value={value || ''}
                      onChange={(e) => {
                        if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                        else updateTask(task.id, { [col.field]: e.target.value });
                      }}
                      placeholder={`Enter ${col.name.toLowerCase()}...`}
                    />
                  )
                ) : col.type === 'select' ? (
                  <select
                    className={cn(
                      "w-full p-3 border rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm cursor-pointer appearance-none",
                      !value ? "bg-zinc-50 border-zinc-200 text-zinc-900" : getColorClasses(col.optionColors?.[value])
                    )}
                    value={value || ''}
                    onChange={(e) => {
                      if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                      else updateTask(task.id, { [col.field]: e.target.value || null });
                    }}
                  >
                    <option value="">None</option>
                    {(col.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : col.type === 'multi-select' ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[46px]">
                    {(value || []).map((v: string) => (
                      <span key={v} className={cn("text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border", getColorClasses(col.optionColors?.[v]))}>
                        {v}
                        <button 
                          onClick={() => {
                            const newVals = (value || []).filter((s: string) => s !== v);
                            if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: newVals } });
                            else updateTask(task.id, { [col.field]: newVals });
                          }} 
                          className="hover:opacity-70"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <select
                      className="bg-transparent outline-none text-sm text-zinc-500 cursor-pointer"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const newVals = [...(value || []), e.target.value];
                          if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: newVals } });
                          else updateTask(task.id, { [col.field]: newVals });
                        }
                      }}
                    >
                      <option value="" disabled>+ Add...</option>
                      {(col.options || []).filter(o => !(value || []).includes(o)).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

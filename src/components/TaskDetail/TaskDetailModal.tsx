import React from 'react';
import { useStore, Task, Column } from '../../store/useStore';
import { X, Check, Link as LinkIcon, Plus } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function TaskDetailModal({ taskId, onClose, onOpenTaskDetail }: { taskId: string, onClose: () => void, onOpenTaskDetail: (id: string) => void }) {
  const { tasks, columns, updateTask, linkTasks, unlinkTasks } = useStore();
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
            
            if (col.field === 'completed') return null; // Handled in header
            
            return (
              <div key={col.id} className="space-y-1.5">
                <label className="block text-sm font-medium text-zinc-700 flex items-center justify-between">
                  {col.name}
                  {!col.visible && <span className="text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">Hidden in Table</span>}
                </label>
                
                {col.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                     <button
                        onClick={() => {
                          if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: !value } });
                          else updateTask(task.id, { [col.field]: !value });
                        }}
                        className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          value ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 hover:border-zinc-400 bg-white"
                        )}
                      >
                        {value && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-sm text-zinc-600">{value ? 'Checked' : 'Unchecked'}</span>
                  </div>
                ) : col.type === 'text' || col.type === 'number' || col.type === 'date' ? (
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
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
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
          {/* Linked Tasks */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <h4 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-zinc-500" />
              Linked Tasks
            </h4>
            
            <div className="space-y-2">
              {task.linkedTaskIds?.map(linkId => {
                const linkedTask = tasks.find(t => t.id === linkId);
                if (!linkedTask) return null;
                return (
                  <div key={linkId} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg group hover:border-blue-300 transition-colors">
                    <button 
                      onClick={() => {
                        onClose();
                        setTimeout(() => onOpenTaskDetail(linkId), 0);
                      }} 
                      className="text-sm text-blue-600 hover:underline text-left flex-1 truncate font-medium"
                    >
                      {linkedTask.title || 'Untitled Task'}
                    </button>
                    <button 
                      onClick={() => unlinkTasks(task.id, linkId)} 
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              
              <div className="relative mt-2">
                <select
                  className="w-full p-2.5 pl-8 border border-zinc-300 rounded-lg text-sm outline-none focus:border-blue-500 appearance-none bg-white text-zinc-600"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) linkTasks(task.id, e.target.value);
                  }}
                >
                  <option value="" disabled>+ Link to another task...</option>
                  {tasks.filter(t => t.id !== task.id && !task.linkedTaskIds?.includes(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.title || 'Untitled Task'}</option>
                  ))}
                </select>
                <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

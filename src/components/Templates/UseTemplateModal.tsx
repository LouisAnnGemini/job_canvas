import React, { useState } from 'react';
import { useStore, TaskTemplate, TemplateTask } from '../../store/useStore';
import { X, Plus, Check } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function UseTemplateModal({ onClose }: { onClose: () => void }) {
  const { templates, columns, addTask } = useStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [formData, setFormData] = useState<TemplateTask[]>([]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleSelect = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find(t => t.id === id);
    if (t) {
      // Deep copy tasks to avoid mutating the template
      setFormData(JSON.parse(JSON.stringify(t.tasks || [])));
    }
  };

  const handleAdd = () => {
    if (!selectedTemplate) return;
    
    formData.forEach((taskData, index) => {
      addTask({
        title: taskData.title || '',
        description: taskData.description || '',
        urgency: taskData.urgency || null,
        categories: taskData.categories || [],
        assignees: taskData.assignees || [],
        customFields: taskData.customFields || {},
        x: window.innerWidth / 2 - 125 + (index * 30),
        y: window.innerHeight / 2 - 75 + (index * 30),
      });
    });
    
    onClose();
  };

  const updateField = (taskId: string, field: string, value: any, isCustom: boolean) => {
    setFormData(prev => prev.map(t => {
      if (t.id === taskId) {
        if (isCustom) {
          return { ...t, customFields: { ...t.customFields, [field]: value } };
        }
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-lg font-semibold text-zinc-900">New Task from Template</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Select Template</label>
            <select
              className="w-full p-2.5 border border-zinc-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
              value={selectedTemplateId}
              onChange={e => handleSelect(e.target.value)}
            >
              <option value="" disabled>Choose a template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.templateName}</option>
              ))}
            </select>
          </div>

          {selectedTemplate && formData.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-zinc-200">
              <h4 className="text-sm font-medium text-zinc-900">Fill Template Details</h4>
              {formData.map((taskData, index) => (
                <div key={taskData.id} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/30">
                  <h5 className="text-sm font-medium text-zinc-900 mb-4">Task {index + 1}</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {columns.filter(c => c.visible && c.type !== 'checkbox').map(col => {
                      const value = col.isCustom ? taskData.customFields?.[col.id] : (taskData as any)[col.field];
                      
                      return (
                        <div key={col.id} className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700">{col.name}</label>
                          
                          {col.type === 'text' && (
                            <input
                              type="text"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => updateField(taskData.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          
                          {col.type === 'number' && (
                            <input
                              type="number"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => updateField(taskData.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          
                          {col.type === 'date' && (
                            <input
                              type="date"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => updateField(taskData.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          
                          {col.type === 'select' && (
                            <select
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => updateField(taskData.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            >
                              <option value="">None</option>
                              {col.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          
                          {col.type === 'multi-select' && (
                            <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-300 rounded-md min-h-[38px] bg-white">
                              {col.options?.map(opt => {
                                const isSelected = Array.isArray(value) && value.includes(opt);
                                return (
                                  <label key={opt} className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 border rounded cursor-pointer transition-colors text-xs",
                                    isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                                  )}>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const current = Array.isArray(value) ? value : [];
                                        const next = e.target.checked 
                                          ? [...current, opt] 
                                          : current.filter((v: string) => v !== opt);
                                        updateField(taskData.id, col.isCustom ? col.id : col.field, next, col.isCustom);
                                      }}
                                    />
                                    {opt}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleAdd}
            disabled={!selectedTemplate || formData.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add {formData.length > 1 ? `${formData.length} Tasks` : 'Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

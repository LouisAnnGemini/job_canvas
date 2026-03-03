import React, { useState } from 'react';
import { useStore, TaskTemplate, TemplateTask } from '../../store/useStore';
import { X, Plus, Copy, Trash2, Edit2, ChevronLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function TemplateManagerModal({ onClose }: { onClose: () => void }) {
  const { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, columns } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleCreate = () => {
    addTemplate({ templateName: 'New Template' });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleUpdateTask = (taskId: string, field: string, value: any, isCustom: boolean) => {
    if (!selectedTemplate) return;
    const updatedTasks = (selectedTemplate.tasks || []).map(t => {
      if (t.id === taskId) {
        if (isCustom) {
          return { ...t, customFields: { ...t.customFields, [field]: value } };
        }
        return { ...t, [field]: value };
      }
      return t;
    });
    updateTemplate(selectedTemplate.id, { tasks: updatedTasks });
  };

  const handleAddTask = () => {
    if (!selectedTemplate) return;
    const newTask: TemplateTask = {
      id: uuidv4(),
      title: 'New Task',
      description: '',
      urgency: null,
      categories: [],
      assignees: [],
      customFields: {}
    };
    updateTemplate(selectedTemplate.id, { tasks: [...(selectedTemplate.tasks || []), newTask] });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedTemplate) return;
    updateTemplate(selectedTemplate.id, { tasks: (selectedTemplate.tasks || []).filter(t => t.id !== taskId) });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            {selectedTemplateId && (
              <button onClick={() => setSelectedTemplateId(null)} className="p-1.5 text-zinc-500 hover:bg-zinc-200 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-semibold text-zinc-900">
              {selectedTemplate ? `Edit Template: ${selectedTemplate.templateName}` : 'Manage Templates'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!selectedTemplateId ? (
            templates.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No templates yet. Create one to quickly add standardized tasks.
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg hover:border-blue-300 bg-white group transition-colors cursor-pointer" onClick={() => setSelectedTemplateId(template.id)}>
                  <div className="flex-1 min-w-0 mr-4">
                    {editingId === template.id ? (
                      <input
                        autoFocus
                        type="text"
                        className="w-full p-1 border border-blue-500 rounded text-sm outline-none"
                        value={template.templateName}
                        onChange={e => updateTemplate(template.id, { templateName: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div className="font-medium text-zinc-900 truncate">{template.templateName}</div>
                    )}
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      {template.tasks?.length || 0} task(s)
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingId(template.id)} className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Rename">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => duplicateTemplate(template.id)} className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Duplicate">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteTemplate(template.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-6">
              {(selectedTemplate?.tasks || []).map((task, index) => (
                <div key={task.id} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/30 relative">
                  <div className="absolute top-4 right-4">
                    <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-medium text-zinc-900 mb-4">Task {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {columns.filter(c => c.visible && c.type !== 'checkbox').map(col => {
                      const value = col.isCustom ? task.customFields?.[col.id] : (task as any)[col.field];
                      
                      return (
                        <div key={col.id} className="space-y-1.5">
                          <label className="block text-xs font-medium text-zinc-700">{col.name}</label>
                          {col.type === 'text' && (
                            <input
                              type="text"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => handleUpdateTask(task.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          {col.type === 'number' && (
                            <input
                              type="number"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => handleUpdateTask(task.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          {col.type === 'date' && (
                            <input
                              type="date"
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => handleUpdateTask(task.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
                            />
                          )}
                          {col.type === 'select' && (
                            <select
                              className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                              value={value || ''}
                              onChange={(e) => handleUpdateTask(task.id, col.isCustom ? col.id : col.field, e.target.value, col.isCustom)}
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
                                  <label key={opt} className={`flex items-center gap-1 px-2 py-0.5 border rounded text-xs cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'}`}>
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const current = Array.isArray(value) ? value : [];
                                        const next = e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt);
                                        handleUpdateTask(task.id, col.isCustom ? col.id : col.field, next, col.isCustom);
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
              <button 
                onClick={handleAddTask}
                className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-sm font-medium text-zinc-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Task to Template
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex justify-between">
          {!selectedTemplateId ? (
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          ) : (
            <div />
          )}
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

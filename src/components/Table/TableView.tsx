import React, { useRef, useEffect, useState } from 'react';
import { useStore, Task, Column, ColumnType } from '../../store/useStore';
import { Check, Plus, Maximize2, Settings2 } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function TableView({ onOpenColumnManager, onOpenTaskDetail }: { onOpenColumnManager: () => void, onOpenTaskDetail: (taskId: string) => void }) {
  const { tasks, columns, addTask, updateTask, addColumn, updateColumn, reorderColumns } = useStore();
  const [activeCell, setActiveCell] = useState<{ taskId: string; field: string } | null>(null);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');

  const [addingOptionFor, setAddingOptionFor] = useState<{taskId: string, colId: string} | null>(null);
  const [newOptValue, setNewOptValue] = useState('');

  const visibleColumns = columns.filter(c => c.visible);

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, field: string, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === tasks.length - 1) {
        const newTask = addTask();
        setActiveCell({ taskId: newTask.id, field });
      } else {
        setActiveCell({ taskId: tasks[rowIndex + 1].id, field });
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;
    
    // We need to map visible column index back to actual column index in the store
    const sourceCol = visibleColumns[draggedColIndex];
    const targetCol = visibleColumns[targetIndex];
    
    const actualSourceIndex = columns.findIndex(c => c.id === sourceCol.id);
    const actualTargetIndex = columns.findIndex(c => c.id === targetCol.id);
    
    reorderColumns(actualSourceIndex, actualTargetIndex);
    setDraggedColIndex(null);
  };

  const getColWidth = (col: Column) => {
    if (col.type === 'checkbox') return 'w-12';
    if (col.field === 'title' || col.field === 'description') return 'w-64';
    if (col.type === 'select') return 'w-32';
    return 'w-48';
  };

  return (
    <div className="w-full h-full overflow-auto p-8 bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Tasks</h1>
          <div className="flex items-center gap-3">
            <button onClick={onOpenColumnManager} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
              <Settings2 className="w-4 h-4" />
              Manage Columns
            </button>
            <button onClick={() => addTask()} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50">
                <th className="w-10 p-3"></th>
                {visibleColumns.map((col, index) => (
                  <th 
                    key={col.id} 
                    className={cn("p-3 text-zinc-500 font-medium text-xs uppercase tracking-wider select-none", getColWidth(col))}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                      {col.name}
                    </div>
                  </th>
                ))}
                <th className="p-3 w-12">
                  <button onClick={() => {
                    setNewColName('');
                    setNewColType('text');
                    setAddingColumn(true);
                  }} className="p-1 hover:bg-zinc-200 rounded text-zinc-400">
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, rowIndex) => (
                <tr key={task.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 group transition-colors">
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => onOpenTaskDetail(task.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Expand Task"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </td>
                  {visibleColumns.map(col => {
                    const value = col.isCustom ? task.customFields[col.id] : task[col.field as keyof Task];
                    
                    if (col.type === 'checkbox') {
                      return (
                        <td key={col.id} className="p-3 text-center">
                          <button
                            onClick={() => updateTask(task.id, { [col.field]: !value })}
                            className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors mx-auto",
                              value ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 hover:border-zinc-400 bg-white"
                            )}
                          >
                            {value && <Check className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    }
                    
                    if (col.type === 'text' || col.type === 'number') {
                      return (
                        <td key={col.id} className="p-0">
                          <input
                            type={col.type === 'number' ? 'number' : 'text'}
                            className={cn(
                              "w-full h-full p-3 bg-transparent outline-none focus:bg-blue-50/50 transition-colors text-sm",
                              col.field === 'title' ? "text-zinc-900 font-medium" : "text-zinc-600"
                            )}
                            value={value || ''}
                            onChange={(e) => {
                              if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                              else updateTask(task.id, { [col.field]: e.target.value });
                            }}
                            onKeyDown={(e) => handleKeyDown(e, task.id, col.id, rowIndex)}
                            autoFocus={activeCell?.taskId === task.id && activeCell?.field === col.id}
                            onFocus={() => setActiveCell({ taskId: task.id, field: col.id })}
                            placeholder={col.name + "..."}
                          />
                        </td>
                      );
                    }
                    
                    if (col.type === 'select') {
                      return (
                        <td key={col.id} className="p-3">
                          <select
                            className={cn(
                              "text-xs font-medium px-2 py-1 rounded-md outline-none cursor-pointer appearance-none border",
                              !value ? "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200" : getColorClasses(col.optionColors?.[value])
                            )}
                            value={value || ''}
                            onChange={(e) => {
                              if (e.target.value === '__add__') {
                                setAddingOptionFor({ taskId: task.id, colId: col.id });
                                setNewOptValue('');
                              } else {
                                if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                                else updateTask(task.id, { [col.field]: e.target.value || null });
                              }
                            }}
                          >
                            <option value="">None</option>
                            {(col.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            <option value="__add__">+ Add new option</option>
                          </select>
                        </td>
                      );
                    }
                    
                    if (col.type === 'multi-select') {
                      return (
                        <td key={col.id} className="p-3">
                          <MultiSelect
                            options={col.options || []}
                            selected={value || []}
                            optionColors={col.optionColors}
                            onChange={(val) => {
                              if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: val } });
                              else updateTask(task.id, { [col.field]: val });
                            }}
                            onAddOption={(val) => {
                              updateColumn(col.id, { options: [...(col.options || []), val] });
                            }}
                            placeholder="Add..."
                          />
                        </td>
                      );
                    }
                    
                    return <td key={col.id}></td>;
                  })}
                  <td className="p-3"></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div 
            className="p-3 text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer border-t border-zinc-100 flex items-center gap-2 transition-colors bg-zinc-50/50"
            onClick={() => {
              const newTask = addTask();
              const firstTextCol = visibleColumns.find(c => c.type === 'text');
              if (firstTextCol) {
                setActiveCell({ taskId: newTask.id, field: firstTextCol.id });
              }
            }}
          >
            <Plus className="w-4 h-4" />
            Click to add row
          </div>
        </div>
      </div>

      {addingColumn && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Column</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Column Name</label>
                <input autoFocus className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500" value={newColName} onChange={e => setNewColName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Column Type</label>
                <select className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500" value={newColType} onChange={e => setNewColType(e.target.value as ColumnType)}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Single Select</option>
                  <option value="multi-select">Multi Select</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setAddingColumn(false)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">Cancel</button>
              <button onClick={() => {
                if (newColName.trim()) {
                  addColumn({ name: newColName.trim(), type: newColType, field: `custom_${Date.now()}`, visible: true });
                  setAddingColumn(false);
                }
              }} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md">Add Column</button>
            </div>
          </div>
        </div>
      )}

      {addingOptionFor && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Add New Option</h3>
            <input 
              autoFocus 
              className="w-full p-2 border border-zinc-300 rounded-md mb-6 outline-none focus:border-blue-500" 
              value={newOptValue} 
              onChange={e => setNewOptValue(e.target.value)} 
              placeholder="Option name..." 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = newOptValue.trim();
                  if (val) {
                    const col = columns.find(c => c.id === addingOptionFor.colId);
                    if (col && !col.options?.includes(val)) {
                      updateColumn(col.id, { options: [...(col.options || []), val] });
                    }
                    const task = tasks.find(t => t.id === addingOptionFor.taskId);
                    if (task && col) {
                      if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: val } });
                      else updateTask(task.id, { [col.field]: val });
                    }
                  }
                  setAddingOptionFor(null);
                } else if (e.key === 'Escape') {
                  setAddingOptionFor(null);
                }
              }} 
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAddingOptionFor(null)} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md">Cancel</button>
              <button onClick={() => {
                const val = newOptValue.trim();
                if (val) {
                  const col = columns.find(c => c.id === addingOptionFor.colId);
                  if (col && !col.options?.includes(val)) {
                    updateColumn(col.id, { options: [...(col.options || []), val] });
                  }
                  const task = tasks.find(t => t.id === addingOptionFor.taskId);
                  if (task && col) {
                    if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: val } });
                    else updateTask(task.id, { [col.field]: val });
                  }
                }
                setAddingOptionFor(null);
              }} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md">Add Option</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelect({ options, selected, onChange, onAddOption, placeholder, optionColors }: { options: string[], selected: string[], onChange: (val: string[]) => void, onAddOption: (val: string) => void, placeholder: string, optionColors?: Record<string, string> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const val = inputValue.trim();
      if (!options.includes(val)) {
        onAddOption(val);
      }
      if (!selected.includes(val)) {
        onChange([...selected, val]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="min-h-[32px] p-1 border border-transparent hover:border-zinc-200 rounded flex flex-wrap gap-1 items-center cursor-text transition-colors"
        onClick={() => setIsOpen(true)}
      >
        {selected.map(s => (
          <span key={s} className={cn("text-xs px-2 py-0.5 rounded-md flex items-center gap-1 border", getColorClasses(optionColors?.[s]))}>
            {s}
            <button onClick={(e) => { e.stopPropagation(); toggleOption(s); }} className="hover:opacity-70">&times;</button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[60px] bg-transparent outline-none text-sm text-zinc-700 placeholder-zinc-400"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-48 overflow-auto py-1">
          {options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase())).map(opt => (
            <div
              key={opt}
              className="px-3 py-1.5 text-sm hover:bg-zinc-50 cursor-pointer flex items-center gap-2"
              onClick={() => toggleOption(opt)}
            >
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center", selected.includes(opt) ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-300")}>
                {selected.includes(opt) && <Check className="w-3 h-3" />}
              </div>
              {opt}
            </div>
          ))}
          {inputValue.trim() && !options.includes(inputValue.trim()) && (
            <div
              className="px-3 py-1.5 text-sm hover:bg-zinc-50 cursor-pointer text-blue-600 flex items-center gap-2"
              onClick={() => {
                const val = inputValue.trim();
                onAddOption(val);
                onChange([...selected, val]);
                setInputValue('');
              }}
            >
              <Plus className="w-4 h-4" />
              Create "{inputValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

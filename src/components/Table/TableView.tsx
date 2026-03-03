import React, { useRef, useEffect, useState } from 'react';
import { useStore, Task, Column, ColumnType } from '../../store/useStore';
import { Check, Plus, Maximize2, Settings2, WrapText, Copy, Trash2, Edit2, GripVertical, Link as LinkIcon } from 'lucide-react';
import { BatchEditModal } from '../BatchEditModal';
import { ColumnLinkageModal } from './ColumnLinkageModal';
import { getColorClasses } from '../../utils/colors';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function TableView({ onOpenColumnManager, onOpenTaskDetail }: { onOpenColumnManager: () => void, onOpenTaskDetail: (taskId: string) => void }) {
  const { tasks, columns, addTask, updateTask, addColumn, updateColumn, reorderColumns, wrapText, setWrapText, deleteTasks, duplicateTasks, searchQuery, filters, reorderTasks } = useStore();
  const [activeCell, setActiveCell] = useState<{ taskId: string; field: string } | null>(null);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [resizingCol, setResizingCol] = useState<{ id: string, startX: number, startWidth: number } | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchEditModalOpen, setBatchEditModalOpen] = useState(false);
  const [activeLinkageColumnId, setActiveLinkageColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (!resizingCol) return;
    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - resizingCol.startX;
      const newWidth = Math.max(60, resizingCol.startWidth + dx);
      updateColumn(resizingCol.id, { width: newWidth });
    };
    const handleUp = () => setResizingCol(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [resizingCol, updateColumn]);

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');

  const [addingOptionFor, setAddingOptionFor] = useState<{taskId: string, colId: string} | null>(null);
  const [newOptValue, setNewOptValue] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    for (const [colId, opts] of Object.entries(filters)) {
      if (opts.length === 0) continue;
      const col = columns.find(c => c.id === colId);
      if (!col) continue;
      const val = col.isCustom ? t.customFields[colId] : (t as any)[col.field];
      const valArray = Array.isArray(val) 
        ? val.map(v => String(v)) 
        : (val !== null && val !== undefined ? [String(val)] : []);
      if (!opts.some(o => valArray.includes(o))) return false;
    }
    return true;
  });

  const visibleColumns = columns.filter(c => c.visible);

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, field: string, rowIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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



  return (
    <div className="w-full h-full overflow-auto p-8 bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Tasks</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setWrapText(!wrapText)} className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors shadow-sm", wrapText ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50")}>
              <WrapText className="w-4 h-4" />
              Wrap Text
            </button>
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

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-max">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="w-28 p-0 sticky left-0 top-0 bg-zinc-50 z-30 border-r border-zinc-200">
                  <div className="p-3 flex items-center justify-center h-full border-b border-zinc-200">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors",
                        selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0
                          ? "bg-blue-600 border-blue-600"
                          : "border-zinc-300 hover:border-blue-400 bg-white"
                      )}
                      onClick={() => {
                        if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
                          setSelectedTaskIds(new Set());
                        } else {
                          setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
                        }
                      }}
                    >
                      {selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </th>
                {visibleColumns.map((col, index) => (
                  <th 
                    key={col.id} 
                    className="p-0 sticky top-0 z-10 bg-zinc-50 text-zinc-500 font-medium text-xs uppercase tracking-wider select-none group border-r border-zinc-200 last:border-r-0"
                    style={{ width: col.width || 150 }}
                    draggable={!resizingCol}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="p-3 flex items-center gap-2 cursor-grab active:cursor-grabbing w-full h-full overflow-hidden border-b border-zinc-200">
                      <span className="truncate">{col.name}</span>
                      {col.isCustom && (col.type === 'select' || col.type === 'multi-select' || col.type === 'text') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLinkageColumnId(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-600 transition-all ml-auto"
                          title="Configure Linkage"
                        >
                          <LinkIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 z-10"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingCol({ id: col.id, startX: e.clientX, startWidth: col.width || 150 });
                      }}
                    />
                  </th>
                ))}
                <th className="p-0 w-12 sticky top-0 z-10 bg-zinc-50 border-b border-zinc-200">
                  <div className="p-3 flex items-center justify-center">
                    <button onClick={() => {
                      setNewColName('');
                      setNewColType('text');
                      setAddingColumn(true);
                    }} className="p-1 hover:bg-zinc-200 rounded text-zinc-400">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, rowIndex) => (
                <tr 
                  key={task.id} 
                  className={cn(
                    "border-b border-zinc-100 hover:bg-zinc-50/50 group transition-colors",
                    draggedRowIndex === rowIndex ? "opacity-50" : ""
                  )}
                  draggable={!searchQuery && Object.values(filters).every(f => f.length === 0)}
                  onDragStart={(e) => {
                    setDraggedRowIndex(rowIndex);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedRowIndex !== null && draggedRowIndex !== rowIndex) {
                      reorderTasks(draggedRowIndex, rowIndex);
                    }
                    setDraggedRowIndex(null);
                  }}
                  onDragEnd={() => setDraggedRowIndex(null)}
                >
                  <td className="p-0 sticky left-0 bg-white group-hover:bg-zinc-50/50 z-10 border-r border-zinc-100">
                    <div className="p-3 flex items-center justify-center gap-2 h-full">
                      <div className="cursor-grab text-zinc-300 hover:text-zinc-500 active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors",
                          selectedTaskIds.has(task.id)
                            ? "bg-blue-600 border-blue-600"
                            : "border-zinc-300 hover:border-blue-400 bg-white"
                        )}
                        onClick={() => {
                          const newSet = new Set(selectedTaskIds);
                          if (selectedTaskIds.has(task.id)) newSet.delete(task.id);
                          else newSet.add(task.id);
                          setSelectedTaskIds(newSet);
                        }}
                      >
                        {selectedTaskIds.has(task.id) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <button 
                        onClick={() => duplicateTasks([task.id])}
                        className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                        title="Duplicate Task"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onOpenTaskDetail(task.id)}
                        className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="Open Task Details"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {visibleColumns.map(col => {
                    const value = col.isCustom ? task.customFields[col.id] : task[col.field as keyof Task];
                    
                    if (col.type === 'checkbox') {
                      return (
                        <td key={col.id} className="p-3 text-center border-r border-zinc-100 last:border-r-0" style={{ width: col.width || 150 }}>
                          <button
                            onClick={() => {
                              if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: !value } });
                              else updateTask(task.id, { [col.field]: !value });
                            }}
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
                    
                    if (col.type === 'date') {
                      return (
                        <td key={col.id} className="p-0 border-r border-zinc-100 last:border-r-0 align-top" style={{ width: col.width || 150 }}>
                          <input
                            type="date"
                            className="w-full h-full p-3 bg-transparent outline-none focus:bg-blue-50/50 transition-colors text-sm text-zinc-600 font-mono"
                            value={value || ''}
                            onChange={(e) => {
                              if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                              else updateTask(task.id, { [col.field]: e.target.value });
                            }}
                          />
                        </td>
                      );
                    }
                    
                    if (col.type === 'text' || col.type === 'number') {
                      return (
                        <td key={col.id} className="p-0 border-r border-zinc-100 last:border-r-0 align-top" style={{ width: col.width || 150 }}>
                          <AutoResizingTextarea
                            wrapText={wrapText}
                            className={cn(
                              col.field === 'title' ? "text-zinc-900 font-medium" : "text-zinc-600"
                            )}
                            value={value || ''}
                            onChange={(e: any) => {
                              if (col.isCustom) updateTask(task.id, { customFields: { ...task.customFields, [col.id]: e.target.value } });
                              else updateTask(task.id, { [col.field]: e.target.value });
                            }}
                            onKeyDown={(e: any) => handleKeyDown(e, task.id, col.id, rowIndex)}
                            autoFocus={activeCell?.taskId === task.id && activeCell?.field === col.id}
                            onFocus={() => setActiveCell({ taskId: task.id, field: col.id })}
                            placeholder={col.name + "..."}
                          />
                        </td>
                      );
                    }
                    
                    if (col.type === 'select') {
                      return (
                        <td key={col.id} className="p-0 border-r border-zinc-100 last:border-r-0 align-top" style={{ width: col.width || 150 }}>
                          <select
                            className={cn(
                              "text-xs font-medium px-2 py-1.5 mx-3 my-2.5 rounded-md outline-none cursor-pointer appearance-none border max-w-[calc(100%-24px)]",
                              !value ? "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200" : getColorClasses(col.optionColors?.[value]),
                              wrapText ? "whitespace-normal" : "whitespace-nowrap text-ellipsis overflow-hidden"
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
                        <td key={col.id} className="p-2 border-r border-zinc-100 last:border-r-0 align-top" style={{ width: col.width || 150 }}>
                          <MultiSelect
                            wrapText={wrapText}
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
        
        {/* Spacer to allow scrolling past the last item */}
        <div className="h-[50vh] w-full pointer-events-none" />
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
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
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

      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{selectedTaskIds.size} selected</span>
          <div className="w-px h-4 bg-zinc-700" />
          <button onClick={() => setBatchEditModalOpen(true)} className="flex items-center gap-1.5 text-sm hover:text-blue-400 transition-colors">
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => { duplicateTasks(Array.from(selectedTaskIds)); setSelectedTaskIds(new Set()); }} className="flex items-center gap-1.5 text-sm hover:text-emerald-400 transition-colors">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button onClick={() => { deleteTasks(Array.from(selectedTaskIds)); setSelectedTaskIds(new Set()); }} className="flex items-center gap-1.5 text-sm hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {batchEditModalOpen && (
        <BatchEditModal 
          taskIds={Array.from(selectedTaskIds)} 
          onClose={() => {
            setBatchEditModalOpen(false);
            setSelectedTaskIds(new Set());
          }} 
        />
      )}

      {activeLinkageColumnId && (
        <ColumnLinkageModal 
          columnId={activeLinkageColumnId} 
          onClose={() => setActiveLinkageColumnId(null)} 
        />
      )}
    </div>
  );
}

function AutoResizingTextarea({ value, onChange, onKeyDown, autoFocus, onFocus, placeholder, className, wrapText }: any) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      if (wrapText) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      } else {
        textareaRef.current.style.height = '100%';
      }
    }
  }, [value, wrapText]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "w-full h-full p-3 bg-transparent outline-none focus:bg-blue-50/50 transition-colors text-sm resize-none block",
        wrapText ? "whitespace-normal break-words overflow-hidden" : "whitespace-nowrap overflow-hidden text-ellipsis",
        className
      )}
      style={{ minHeight: wrapText ? '44px' : '100%' }}
      value={value}
      onChange={(e) => {
        if (wrapText) {
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }
        onChange(e);
      }}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      onFocus={onFocus}
      placeholder={placeholder}
      rows={1}
    />
  );
}

import { createPortal } from 'react-dom';

function MultiSelect({ options, selected, onChange, onAddOption, placeholder, optionColors, wrapText }: { options: string[], selected: string[], onChange: (val: string[]) => void, onAddOption: (val: string) => void, placeholder: string, optionColors?: Record<string, string>, wrapText?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Check if the click is inside the portal dropdown
        const portalDropdown = document.getElementById('multiselect-portal-dropdown');
        if (portalDropdown && portalDropdown.contains(e.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    
    const handleScroll = (e: Event) => {
      const portalDropdown = document.getElementById('multiselect-portal-dropdown');
      if (portalDropdown && e.target instanceof Node && (e.target === portalDropdown || portalDropdown.contains(e.target))) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

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
    <div className="relative h-full" ref={containerRef}>
      <div 
        className={cn(
          "min-h-[32px] p-1 border border-transparent hover:border-zinc-200 rounded flex gap-1 items-center cursor-text transition-colors",
          wrapText ? "flex-wrap" : "flex-nowrap overflow-hidden"
        )}
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
      {isOpen && createPortal(
        <div 
          id="multiselect-portal-dropdown"
          className="fixed bg-white border border-zinc-200 rounded-lg shadow-lg z-[9999] max-h-48 overflow-auto py-1"
          style={{
            top: dropdownPosition.top + 4,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}

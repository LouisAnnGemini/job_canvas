import React, { useState, useEffect } from 'react';
import { useStore, Column } from '../../store/useStore';
import { X, GripVertical, Eye, EyeOff, Plus, Trash2, Edit2 } from 'lucide-react';
import { getColorClasses } from '../../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function ColumnManagerModal({ onClose }: { onClose: () => void }) {
  const { columns, updateColumn, deleteColumn, reorderColumns, renameColumnOption } = useStore();
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [draggedOptIndex, setDraggedOptIndex] = useState<number | null>(null);

  const [editingColName, setEditingColName] = useState(false);
  const [colNameInput, setColNameInput] = useState('');
  const [editingOpt, setEditingOpt] = useState<string | null>(null);
  const [optInput, setOptInput] = useState('');
  const [addingOpt, setAddingOpt] = useState(false);
  const [newOptInput, setNewOptInput] = useState('');

  useEffect(() => {
    setEditingColName(false);
    setEditingOpt(null);
    setAddingOpt(false);
  }, [selectedColId]);

  const selectedCol = columns.find(c => c.id === selectedColId);

  const handleColDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;
    reorderColumns(draggedColIndex, targetIndex);
    setDraggedColIndex(null);
  };

  const handleOptDragStart = (e: React.DragEvent, index: number) => {
    setDraggedOptIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleOptDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedOptIndex === null || draggedOptIndex === targetIndex || !selectedCol || !selectedCol.options) return;
    
    const newOptions = Array.from(selectedCol.options);
    const [removed] = newOptions.splice(draggedOptIndex, 1);
    newOptions.splice(targetIndex, 0, removed);
    
    updateColumn(selectedCol.id, { options: newOptions });
    setDraggedOptIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex overflow-hidden border border-zinc-200">
        
        {/* Left Pane: Columns List */}
        <div className="w-1/2 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-zinc-900">Manage Columns</h2>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {columns.map((col, index) => (
              <div 
                key={col.id}
                draggable
                onDragStart={(e) => handleColDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleColDrop(e, index)}
                onClick={() => setSelectedColId(col.id)}
                className={cn(
                  "flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all",
                  selectedColId === col.id ? "border-blue-500 ring-1 ring-blue-500 shadow-sm" : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">{col.name}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">{col.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateColumn(col.id, { visible: !col.visible }); }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {col.isCustom && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteColumn(col.id); if (selectedColId === col.id) setSelectedColId(null); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Column Options */}
        <div className="w-1/2 flex flex-col bg-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {selectedCol ? (
            <div className="p-6 flex-1 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-1">
                {editingColName ? (
                  <input
                    autoFocus
                    className="text-xl font-semibold text-zinc-900 border-b border-blue-500 outline-none bg-transparent px-1 w-full"
                    value={colNameInput}
                    onChange={e => setColNameInput(e.target.value)}
                    onBlur={() => {
                      if (colNameInput.trim() && selectedCol) {
                        updateColumn(selectedCol.id, { name: colNameInput.trim() });
                      }
                      setEditingColName(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (colNameInput.trim() && selectedCol) {
                          updateColumn(selectedCol.id, { name: colNameInput.trim() });
                        }
                        setEditingColName(false);
                      } else if (e.key === 'Escape') {
                        setEditingColName(false);
                      }
                    }}
                  />
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-zinc-900">{selectedCol.name}</h3>
                    <button 
                      onClick={() => {
                        setColNameInput(selectedCol.name);
                        setEditingColName(true);
                      }}
                      className="p-1 text-zinc-400 hover:text-blue-600 rounded transition-colors"
                      title="Rename Column"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-sm text-zinc-500 mb-6">Type: {selectedCol.type}</p>
              
              {(selectedCol.type === 'select' || selectedCol.type === 'multi-select') ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-zinc-900">Options</h4>
                    <button 
                      onClick={() => {
                        setNewOptInput('');
                        setAddingOpt(true);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-auto space-y-2 pr-2">
                    {(selectedCol.options || []).map((opt, index) => (
                      <div 
                        key={opt}
                        draggable={editingOpt !== opt}
                        onDragStart={(e) => handleOptDragStart(e, index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleOptDrop(e, index)}
                        className="flex items-center gap-3 p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg group"
                      >
                        <div className={cn("text-zinc-400 hover:text-zinc-600", editingOpt === opt ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing")}>
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        {editingOpt === opt ? (
                          <input
                            autoFocus
                            className="flex-1 text-sm text-zinc-900 border-b border-blue-500 outline-none bg-transparent px-1"
                            value={optInput}
                            onChange={e => setOptInput(e.target.value)}
                            onBlur={() => {
                              const val = optInput.trim();
                              if (val && val !== opt && !selectedCol.options!.includes(val)) {
                                renameColumnOption(selectedCol.id, opt, val);
                              }
                              setEditingOpt(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = optInput.trim();
                                if (val && val !== opt && !selectedCol.options!.includes(val)) {
                                  renameColumnOption(selectedCol.id, opt, val);
                                }
                                setEditingOpt(null);
                              } else if (e.key === 'Escape') {
                                setEditingOpt(null);
                              }
                            }}
                          />
                        ) : (
                          <div className="flex-1 text-sm text-zinc-700 font-medium">
                            {opt}
                          </div>
                        )}

                        <select 
                          className={cn("text-xs rounded px-1 py-0.5 outline-none cursor-pointer border", getColorClasses(selectedCol.optionColors?.[opt]))}
                          value={selectedCol.optionColors?.[opt] || 'gray'}
                          onChange={(e) => {
                            const newColors = { ...(selectedCol.optionColors || {}), [opt]: e.target.value };
                            updateColumn(selectedCol.id, { optionColors: newColors });
                          }}
                        >
                          <option value="gray">Gray</option>
                          <option value="red">Red</option>
                          <option value="yellow">Yellow</option>
                          <option value="green">Green</option>
                          <option value="blue">Blue</option>
                          <option value="purple">Purple</option>
                          <option value="pink">Pink</option>
                        </select>
                        
                        {editingOpt !== opt && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setOptInput(opt);
                              setEditingOpt(opt);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="p-1 text-zinc-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Rename Option"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const newOptions = selectedCol.options!.filter(o => o !== opt);
                            updateColumn(selectedCol.id, { options: newOptions });
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="p-1 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {addingOpt && (
                      <div className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-4 h-4" /> {/* Spacer for grip */}
                        <input
                          autoFocus
                          className="flex-1 text-sm text-zinc-900 border-b border-blue-500 outline-none bg-transparent px-1"
                          value={newOptInput}
                          onChange={e => setNewOptInput(e.target.value)}
                          placeholder="New option name..."
                          onBlur={() => {
                            const val = newOptInput.trim();
                            if (val && !selectedCol.options?.includes(val)) {
                              updateColumn(selectedCol.id, { options: [...(selectedCol.options || []), val] });
                            }
                            setAddingOpt(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const val = newOptInput.trim();
                              if (val && !selectedCol.options?.includes(val)) {
                                updateColumn(selectedCol.id, { options: [...(selectedCol.options || []), val] });
                              }
                              setAddingOpt(false);
                            } else if (e.key === 'Escape') {
                              setAddingOpt(false);
                            }
                          }}
                        />
                      </div>
                    )}

                    {(!selectedCol.options || selectedCol.options.length === 0) && !addingOpt && (
                      <div className="text-center py-8 text-sm text-zinc-500">
                        No options defined.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
                  This column type does not have configurable options.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
              Select a column to manage its settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

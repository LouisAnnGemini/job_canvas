import React, { useState } from 'react';
import { useStore, Column, LinkageRule } from '../../store/useStore';
import { X, Plus, Trash2, ArrowRight } from 'lucide-react';

export function ColumnLinkageModal({ columnId, onClose }: { columnId: string, onClose: () => void }) {
  const { columns, updateColumn } = useStore();
  const column = columns.find(c => c.id === columnId);
  
  const [rules, setRules] = useState<LinkageRule[]>(column?.linkageRules || []);
  const [newTriggerValue, setNewTriggerValue] = useState('');
  const [newTargetColumnId, setNewTargetColumnId] = useState('');
  const [newTargetValue, setNewTargetValue] = useState('');

  if (!column) return null;

  const targetColumns = columns.filter(c => c.id !== columnId);
  const selectedTargetColumn = targetColumns.find(c => c.id === newTargetColumnId);

  const handleAddRule = () => {
    if (!newTriggerValue || !newTargetColumnId || !newTargetValue) return;
    
    const newRule: LinkageRule = {
      triggerValue: newTriggerValue,
      targetColumnId: newTargetColumnId,
      targetValue: newTargetValue
    };
    
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    updateColumn(columnId, { linkageRules: updatedRules });
    
    // Reset form
    setNewTriggerValue('');
    setNewTargetColumnId('');
    setNewTargetValue('');
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
    updateColumn(columnId, { linkageRules: updatedRules });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col border border-zinc-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/50">
          <h3 className="text-lg font-semibold text-zinc-900">Linkage Rules for "{column.name}"</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            Configure rules to automatically update other fields when a value is selected in this column.
            <br/>
            <strong>Note:</strong> This is a one-way automation. Changing the target field later will not affect this column.
          </div>

          {/* Add New Rule */}
          <div className="space-y-3 p-4 border border-zinc-200 rounded-lg bg-zinc-50/30">
            <h4 className="text-sm font-medium text-zinc-900">Add New Rule</h4>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-zinc-500">If "{column.name}" is</label>
                {column.type === 'select' || column.type === 'multi-select' ? (
                  <select 
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    value={newTriggerValue}
                    onChange={e => setNewTriggerValue(e.target.value)}
                  >
                    <option value="">Select option...</option>
                    {column.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : column.type === 'checkbox' ? (
                  <select 
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    value={newTriggerValue}
                    onChange={e => setNewTriggerValue(e.target.value)}
                  >
                    <option value="">Select state...</option>
                    <option value="true">Checked</option>
                    <option value="false">Unchecked</option>
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    placeholder="Enter value..."
                    value={newTriggerValue}
                    onChange={e => setNewTriggerValue(e.target.value)}
                  />
                )}
              </div>

              <div className="pt-8 text-zinc-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-zinc-500">Set Field</label>
                <select 
                  className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                  value={newTargetColumnId}
                  onChange={e => {
                    setNewTargetColumnId(e.target.value);
                    setNewTargetValue('');
                  }}
                >
                  <option value="">Select column...</option>
                  {targetColumns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-zinc-500">To Value</label>
                {selectedTargetColumn?.type === 'select' || selectedTargetColumn?.type === 'multi-select' ? (
                  <select 
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(e.target.value)}
                    disabled={!newTargetColumnId}
                  >
                    <option value="">Select option...</option>
                    {selectedTargetColumn.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : selectedTargetColumn?.type === 'checkbox' ? (
                  <select 
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(e.target.value)}
                    disabled={!newTargetColumnId}
                  >
                    <option value="">Select state...</option>
                    <option value="true">Checked</option>
                    <option value="false">Unchecked</option>
                  </select>
                ) : selectedTargetColumn?.type === 'date' ? (
                   <input 
                    type="date"
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(e.target.value)}
                    disabled={!newTargetColumnId}
                  />
                ) : (
                  <input 
                    type={selectedTargetColumn?.type === 'number' ? 'number' : 'text'}
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                    placeholder="Enter value..."
                    value={newTargetValue}
                    onChange={e => setNewTargetValue(e.target.value)}
                    disabled={!newTargetColumnId}
                  />
                )}
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleAddRule}
                  disabled={!newTriggerValue || !newTargetColumnId || !newTargetValue}
                  className="p-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Existing Rules */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-900">Existing Rules</h4>
            {rules.length === 0 ? (
              <div className="text-sm text-zinc-500 italic">No rules configured.</div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => {
                  const targetCol = columns.find(c => c.id === rule.targetColumnId);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg bg-white">
                      <div className="flex-1 text-sm">
                        <span className="text-zinc-500">If {column.name} is </span>
                        <span className="font-medium text-zinc-900">"{rule.triggerValue}"</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                      <div className="flex-1 text-sm">
                        <span className="text-zinc-500">Set {targetCol?.name || 'Unknown'} to </span>
                        <span className="font-medium text-zinc-900">"{rule.targetValue}"</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(index)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

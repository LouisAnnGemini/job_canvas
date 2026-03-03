import React, { useState, useRef } from 'react';
import { useStore, Column, LinkageRule } from '../../store/useStore';
import { X, Plus, Trash2, ArrowRight, Download, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export function RuleManagerModal({ onClose }: { onClose?: () => void }) {
  const { columns, updateColumn } = useStore();
  const [selectedSourceColumnId, setSelectedSourceColumnId] = useState<string>('');
  
  // Filter columns that can be source columns (include default columns like Status)
  const sourceColumns = columns.filter(c => c.type === 'text' || c.type === 'select' || c.type === 'multi-select' || c.type === 'checkbox');
  
  const selectedColumn = columns.find(c => c.id === selectedSourceColumnId);
  const rules = selectedColumn?.linkageRules || [];

  // Target columns for the selected source (allow all columns except source)
  const targetColumns = columns.filter(c => c.id !== selectedSourceColumnId);

  // New Rule State
  const [newTriggerValue, setNewTriggerValue] = useState('');
  const [newTargetColumnId, setNewTargetColumnId] = useState('');
  const [newTargetValue, setNewTargetValue] = useState('');

  const selectedTargetColumn = targetColumns.find(c => c.id === newTargetColumnId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRule = () => {
    if (!selectedSourceColumnId || !newTriggerValue || !newTargetColumnId || !newTargetValue) return;
    
    const newRule: LinkageRule = {
      triggerValue: newTriggerValue,
      targetColumnId: newTargetColumnId,
      targetValue: newTargetValue
    };
    
    const updatedRules = [...rules, newRule];
    updateColumn(selectedSourceColumnId, { linkageRules: updatedRules });
    
    // Reset form
    setNewTriggerValue('');
    setNewTargetColumnId('');
    setNewTargetValue('');
  };

  const handleDeleteRule = (index: number) => {
    if (!selectedSourceColumnId) return;
    const updatedRules = rules.filter((_, i) => i !== index);
    updateColumn(selectedSourceColumnId, { linkageRules: updatedRules });
  };

  const handleExportRules = () => {
    // Export all rules or just the selected column's rules?
    // Let's export ALL rules across ALL columns for a comprehensive backup/transfer
    // Format: Source Column Name | Trigger Value | Target Column Name | Target Value
    
    const allRulesData: any[] = [];

    columns.forEach(sourceCol => {
      if (sourceCol.linkageRules && sourceCol.linkageRules.length > 0) {
        sourceCol.linkageRules.forEach(rule => {
          const targetCol = columns.find(c => c.id === rule.targetColumnId);
          if (targetCol) {
            allRulesData.push({
              'Source Column': sourceCol.name,
              'Trigger Value': rule.triggerValue,
              'Target Column': targetCol.name,
              'Target Value': rule.targetValue
            });
          }
        });
      }
    });

    if (allRulesData.length === 0) {
      alert('No rules to export.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(allRulesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Linkage Rules");
    XLSX.writeFile(wb, "taskflow_rules.xlsx");
  };

  const handleImportRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Process data
        // Expected format: { 'Source Column': '...', 'Trigger Value': '...', 'Target Column': '...', 'Target Value': '...' }
        
        // We need to group rules by Source Column to update them efficiently
        const rulesBySource: Record<string, LinkageRule[]> = {};

        // Initialize with existing rules to avoid wiping them out? 
        // Or should import replace? Usually import adds/merges. Let's merge.
        // Actually, for simplicity and safety, let's append.
        
        // First, build a map of column names to IDs for lookup
        const colMap = new Map<string, string>();
        columns.forEach(c => colMap.set(c.name, c.id));

        let importCount = 0;

        data.forEach((row: any) => {
          const sourceName = row['Source Column'];
          const triggerVal = row['Trigger Value'];
          const targetName = row['Target Column'];
          const targetVal = row['Target Value'];

          if (sourceName && triggerVal && targetName && targetVal) {
            const sourceId = colMap.get(sourceName);
            const targetId = colMap.get(targetName);

            if (sourceId && targetId) {
              if (!rulesBySource[sourceId]) {
                 // Initialize with existing rules for this column if we haven't touched it in this loop yet
                 // But wait, we can't easily get the "current" state inside this loop if we want to append to what's in the store *now*.
                 // Better approach: Read current rules from store for each column involved.
                 const col = columns.find(c => c.id === sourceId);
                 rulesBySource[sourceId] = col?.linkageRules ? [...col.linkageRules] : [];
              }

              // Check for duplicates before adding
              const exists = rulesBySource[sourceId].some(r => 
                r.triggerValue === triggerVal && 
                r.targetColumnId === targetId && 
                r.targetValue === targetVal
              );

              if (!exists) {
                rulesBySource[sourceId].push({
                  triggerValue: String(triggerVal),
                  targetColumnId: targetId,
                  targetValue: String(targetVal)
                });
                importCount++;
              }
            }
          }
        });

        // Apply updates
        Object.entries(rulesBySource).forEach(([sourceId, newRules]) => {
          updateColumn(sourceId, { linkageRules: newRules });
        });

        alert(`Successfully imported ${importCount} rules.`);
        
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import rules. Please ensure the file is a valid Excel file with the correct format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Linkage Rules Manager</h3>
            <p className="text-xs text-zinc-500">Configure automatic one-way field updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleExportRules}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Rules
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Rules
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportRules} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          {onClose && (
            <>
              <div className="w-px h-6 bg-zinc-200 mx-2" />
              <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar: Source Column Selection */}
          <div className="w-64 border-r border-zinc-200 overflow-y-auto bg-zinc-50/30 p-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Source Columns</h4>
            <div className="space-y-1">
              {sourceColumns.map(col => (
                <button
                  key={col.id}
                  onClick={() => setSelectedSourceColumnId(col.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                    selectedSourceColumnId === col.id 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span className="truncate">{col.name}</span>
                  {col.linkageRules && col.linkageRules.length > 0 && (
                    <span className="bg-zinc-200 text-zinc-600 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {col.linkageRules.length}
                    </span>
                  )}
                </button>
              ))}
              {sourceColumns.length === 0 && (
                <div className="text-xs text-zinc-400 italic px-2">No custom columns available.</div>
              )}
            </div>
          </div>

          {/* Main Area: Rules Table */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {selectedSourceColumnId ? (
              <>
                {/* Add Rule Form */}
                <div className="p-4 border-b border-zinc-200 bg-zinc-50/30">
                  <h4 className="text-sm font-medium text-zinc-900 mb-3">Add Rule for "{selectedColumn?.name}"</h4>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-zinc-500">If value is</label>
                      {selectedColumn?.type === 'select' || selectedColumn?.type === 'multi-select' ? (
                        <select 
                          className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                          value={newTriggerValue}
                          onChange={e => setNewTriggerValue(e.target.value)}
                        >
                          <option value="">Select option...</option>
                          {selectedColumn.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : selectedColumn?.type === 'checkbox' ? (
                        <select 
                          className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                          value={newTriggerValue}
                          onChange={e => setNewTriggerValue(e.target.value)}
                        >
                          <option value="">Select option...</option>
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

                    <div className="pb-3 text-zinc-400">
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
                          <option value="">Select option...</option>
                          <option value="true">Checked</option>
                          <option value="false">Unchecked</option>
                        </select>
                      ) : (
                        <input 
                          type={selectedTargetColumn?.type === 'number' ? 'number' : (selectedTargetColumn?.type === 'date' ? 'date' : 'text')}
                          className="w-full p-2 border border-zinc-300 rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                          placeholder={selectedTargetColumn?.type === 'date' ? '' : "Enter value..."}
                          value={newTargetValue}
                          onChange={e => setNewTargetValue(e.target.value)}
                          disabled={!newTargetColumnId}
                        />
                      )}
                    </div>

                    <button 
                      onClick={handleAddRule}
                      disabled={!newTriggerValue || !newTargetColumnId || !newTargetValue}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Add Rule
                    </button>
                  </div>
                </div>

                {/* Rules List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {rules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                      <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">No rules configured for this column.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          <th className="py-3 px-4">If Value Is</th>
                          <th className="py-3 px-4">Target Field</th>
                          <th className="py-3 px-4">Set To Value</th>
                          <th className="py-3 px-4 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule, index) => {
                          const targetCol = columns.find(c => c.id === rule.targetColumnId);
                          return (
                            <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50 group">
                              <td className="py-3 px-4 text-sm font-medium text-zinc-900">{rule.triggerValue}</td>
                              <td className="py-3 px-4 text-sm text-zinc-600">{targetCol?.name || <span className="text-red-500 italic">Deleted Column</span>}</td>
                              <td className="py-3 px-4 text-sm text-zinc-900">{rule.targetValue}</td>
                              <td className="py-3 px-4 text-right">
                                <button 
                                  onClick={() => handleDeleteRule(index)}
                                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <p className="text-sm">Select a source column from the sidebar to manage its rules.</p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

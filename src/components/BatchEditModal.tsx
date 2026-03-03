import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';
import { getColorClasses } from '../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function BatchEditModal({ taskIds, onClose }: { taskIds: string[], onClose: () => void }) {
  const { columns, updateTasks } = useStore();
  const [selectedColId, setSelectedColId] = useState<string>('');
  const [value, setValue] = useState<any>('');

  const visibleColumns = columns.filter(c => c.visible);
  const selectedCol = columns.find(c => c.id === selectedColId);

  useEffect(() => {
    if (selectedCol?.type === 'checkbox') setValue(false);
    else if (selectedCol?.type === 'multi-select') setValue([]);
    else setValue('');
  }, [selectedColId]);

  const handleApply = () => {
    if (!selectedCol) return;
    if (selectedCol.isCustom) {
      updateTasks(taskIds, {}, { [selectedCol.id]: value });
    } else {
      updateTasks(taskIds, { [selectedCol.field]: value });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-zinc-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-900">Batch Edit ({taskIds.length} tasks)</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Field to Edit</label>
            <select 
              className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500"
              value={selectedColId}
              onChange={e => setSelectedColId(e.target.value)}
            >
              <option value="" disabled>Select a field...</option>
              {visibleColumns.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          {selectedCol && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">New Value</label>
              
              {selectedCol.type === 'text' && (
                <input type="text" className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500" value={value} onChange={e => setValue(e.target.value)} />
              )}
              
              {selectedCol.type === 'number' && (
                <input type="number" className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500" value={value} onChange={e => setValue(e.target.value)} />
              )}
              
              {selectedCol.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" checked={value} onChange={e => setValue(e.target.checked)} />
                  <span className="text-sm text-zinc-700">Checked</span>
                </label>
              )}
              
              {selectedCol.type === 'select' && (
                <select className="w-full p-2 border border-zinc-300 rounded-md outline-none focus:border-blue-500" value={value} onChange={e => setValue(e.target.value)}>
                  <option value="">None</option>
                  {selectedCol.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              
              {selectedCol.type === 'multi-select' && (
                <div className="flex flex-wrap gap-2 p-2 border border-zinc-300 rounded-md max-h-40 overflow-y-auto">
                  {selectedCol.options?.map(opt => (
                    <label key={opt} className="flex items-center gap-1.5 p-1.5 border border-zinc-200 rounded cursor-pointer hover:bg-zinc-50 w-full sm:w-auto">
                      <input
                        type="checkbox"
                        checked={Array.isArray(value) && value.includes(opt)}
                        onChange={(e) => {
                          const current = Array.isArray(value) ? value : [];
                          if (e.target.checked) setValue([...current, opt]);
                          else setValue(current.filter((v: string) => v !== opt));
                        }}
                      />
                      <span className={cn("text-xs px-2 py-0.5 rounded border", getColorClasses(selectedCol.optionColors?.[opt]))}>{opt}</span>
                    </label>
                  ))}
                  {(!selectedCol.options || selectedCol.options.length === 0) && (
                    <span className="text-sm text-zinc-500 p-1">No options available</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={handleApply} 
            disabled={!selectedColId}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply to {taskIds.length} tasks
          </button>
        </div>
      </div>
    </div>
  );
}

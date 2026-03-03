import React, { useState } from 'react';
import { TableView } from './components/Table/TableView';
import { WhiteboardView } from './components/Whiteboard/WhiteboardView';
import { ColumnManagerModal } from './components/Table/ColumnManager';
import { TaskDetailModal } from './components/TaskDetail/TaskDetailModal';
import { FilterBar } from './components/FilterBar';
import { TemplateManagerModal } from './components/Templates/TemplateManagerModal';
import { UseTemplateModal } from './components/Templates/UseTemplateModal';
import { RuleManagerModal } from './components/Rules/RuleManagerModal';
import { LayoutGrid, TableProperties, FileText, FilePlus, Download, Upload, Workflow, FileSpreadsheet } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from './store/useStore';
import * as XLSX from 'xlsx';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<'table' | 'whiteboard'>('table');
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isUseTemplateOpen, setIsUseTemplateOpen] = useState(false);
  const [isRuleManagerOpen, setIsRuleManagerOpen] = useState(false);

  const handleExport = () => {
    const state = useStore.getState();
    const data = JSON.stringify({
      tasks: state.tasks,
      columns: state.columns,
      frames: state.frames,
      templates: state.templates
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskflow-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    const state = useStore.getState();
    const { tasks, columns } = state;

    const data = tasks.map(task => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        let value;
        if (col.isCustom) {
          value = task.customFields[col.id];
        } else {
          value = (task as any)[col.field];
        }
        
        // Handle arrays (like multi-select)
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        
        row[col.name] = value;
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, "taskflow-tasks.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        useStore.setState({
          tasks: data.tasks || [],
          columns: data.columns || [],
          frames: data.frames || [],
          templates: data.templates || []
        });
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="font-semibold text-zinc-900 tracking-tight">TaskFlow</span>
        </div>
        
        <div className="flex items-center bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setView('table')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              view === 'table' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <TableProperties className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setView('whiteboard')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              view === 'whiteboard' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Whiteboard
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-2 border-r border-zinc-200 pr-3">
            <button 
              onClick={handleExportXlsx}
              className="p-1.5 text-zinc-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExport}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Export JSON Backup"
            >
              <Download className="w-4 h-4" />
            </button>
            <label 
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Import JSON Backup"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <button 
            onClick={() => setIsTemplateManagerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button 
            onClick={() => setIsRuleManagerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <Workflow className="w-4 h-4" />
            Rules
          </button>
          <button 
            onClick={() => setIsUseTemplateOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
          >
            <FilePlus className="w-4 h-4" />
            Use Template
          </button>
        </div>
      </header>

      <FilterBar />

      {/* Main Content */}
      <main className="flex-1 relative min-h-0">
        {view === 'table' ? (
          <TableView 
            onOpenColumnManager={() => setIsColumnManagerOpen(true)} 
            onOpenTaskDetail={(id) => setExpandedTaskId(id)} 
          />
        ) : (
          <WhiteboardView 
            onOpenTaskDetail={(id) => setExpandedTaskId(id)} 
          />
        )}
      </main>

      {/* Modals */}
      {isColumnManagerOpen && (
        <ColumnManagerModal onClose={() => setIsColumnManagerOpen(false)} />
      )}
      {expandedTaskId && (
        <TaskDetailModal 
          taskId={expandedTaskId} 
          onClose={() => setExpandedTaskId(null)} 
          onOpenTaskDetail={setExpandedTaskId}
        />
      )}
      {isTemplateManagerOpen && (
        <TemplateManagerModal onClose={() => setIsTemplateManagerOpen(false)} />
      )}
      {isUseTemplateOpen && (
        <UseTemplateModal onClose={() => setIsUseTemplateOpen(false)} />
      )}
      {isRuleManagerOpen && (
        <RuleManagerModal onClose={() => setIsRuleManagerOpen(false)} />
      )}
    </div>
  );
}


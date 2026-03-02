import React, { useState } from 'react';
import { TableView } from './components/Table/TableView';
import { WhiteboardView } from './components/Whiteboard/WhiteboardView';
import { ColumnManagerModal } from './components/Table/ColumnManager';
import { TaskDetailModal } from './components/TaskDetail/TaskDetailModal';
import { LayoutGrid, TableProperties } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<'table' | 'whiteboard'>('table');
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden font-sans">
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
        
        <div className="w-8" /> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
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
        <TaskDetailModal taskId={expandedTaskId} onClose={() => setExpandedTaskId(null)} />
      )}
    </div>
  );
}


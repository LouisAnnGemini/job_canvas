import React from 'react';
import { useStore } from '../store/useStore';
import { Search, Filter, X } from 'lucide-react';
import { getColorClasses } from '../utils/colors';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function FilterBar() {
  const { columns, searchQuery, setSearchQuery, filters, setFilter, clearFilters } = useStore();
  const filterableColumns = columns.filter(c => c.type === 'select' || c.type === 'multi-select');

  const hasFilters = searchQuery !== '' || Object.values(filters).some(arr => arr.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b border-zinc-200 shadow-sm z-10 relative">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 mr-2">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        
        {filterableColumns.map(col => {
          const selected = filters[col.id] || [];
          return (
            <div key={col.id} className="relative group">
              <select
                className={cn(
                  "appearance-none pl-3 pr-8 py-1.5 text-sm font-medium rounded-lg border outline-none cursor-pointer transition-colors bg-white",
                  selected.length > 0 ? "border-blue-500 text-blue-700 bg-blue-50" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (selected.includes(val)) {
                    setFilter(col.id, selected.filter(v => v !== val));
                  } else {
                    setFilter(col.id, [...selected, val]);
                  }
                }}
              >
                <option value="" disabled>{col.name} {selected.length > 0 ? `(${selected.length})` : ''}</option>
                {col.options?.map(opt => (
                  <option key={opt} value={opt}>
                    {selected.includes(opt) ? '✓ ' : ''}{opt}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          );
        })}

        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="text-sm text-zinc-500 hover:text-red-600 px-2 py-1.5 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

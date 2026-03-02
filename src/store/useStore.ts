import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ColumnType = 'checkbox' | 'text' | 'number' | 'select' | 'multi-select';

export interface Column {
  id: string;
  field: string;
  name: string;
  type: ColumnType;
  visible: boolean;
  isCustom: boolean;
  options?: string[];
  optionColors?: Record<string, string>;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  urgency: string | null;
  categories: string[];
  assignees: string[];
  customFields: Record<string, any>;
  x: number;
  y: number;
  frameId?: string | null;
}

export interface Frame {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AppState {
  tasks: Task[];
  frames: Frame[];
  columns: Column[];
  
  addTask: (task?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addFrame: (frame: Partial<Frame>) => Frame;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  deleteFrame: (id: string) => void;
  
  addColumn: (column: Omit<Column, 'id' | 'isCustom'>) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (startIndex: number, endIndex: number) => void;
  renameColumnOption: (columnId: string, oldOption: string, newOption: string) => void;
}

export const useStore = create<AppState>((set) => ({
  tasks: [
    {
      id: uuidv4(),
      title: 'Design initial wireframes',
      description: 'Create low-fidelity wireframes for the main dashboard.',
      completed: false,
      urgency: 'High',
      categories: ['Design', 'UI'],
      assignees: ['Alice'],
      customFields: {},
      x: 100,
      y: 100,
    },
    {
      id: uuidv4(),
      title: 'Setup project repository',
      description: 'Initialize Git repo and configure CI/CD pipelines.',
      completed: true,
      urgency: 'Low',
      categories: ['DevOps'],
      assignees: ['Bob'],
      customFields: {},
      x: 400,
      y: 100,
    }
  ],
  frames: [],
  columns: [
    { id: 'col_status', field: 'completed', name: 'Status', type: 'checkbox', visible: true, isCustom: false },
    { id: 'col_title', field: 'title', name: 'Title', type: 'text', visible: true, isCustom: false },
    { id: 'col_desc', field: 'description', name: 'Description', type: 'text', visible: true, isCustom: false },
    { id: 'col_urgency', field: 'urgency', name: 'Urgency', type: 'select', visible: true, isCustom: false, options: ['High', 'Medium', 'Low'], optionColors: { 'High': 'red', 'Medium': 'yellow', 'Low': 'green' } },
    { id: 'col_cat', field: 'categories', name: 'Category', type: 'multi-select', visible: true, isCustom: false, options: ['Design', 'UI', 'DevOps', 'Frontend', 'Backend'] },
    { id: 'col_assignee', field: 'assignees', name: 'Assignee', type: 'multi-select', visible: true, isCustom: false, options: ['Alice', 'Bob', 'Charlie'] },
  ],
  
  addTask: (task) => {
    const newTask: Task = {
      id: uuidv4(),
      title: '',
      description: '',
      completed: false,
      urgency: null,
      categories: [],
      assignees: [],
      customFields: {},
      x: Math.random() * 200,
      y: Math.random() * 200,
      ...task,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id),
  })),
  
  addFrame: (frame) => {
    const newFrame: Frame = {
      id: uuidv4(),
      name: 'New Frame',
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      ...frame,
    };
    set((state) => ({ frames: [...state.frames, newFrame] }));
    return newFrame;
  },
  
  updateFrame: (id, updates) => set((state) => ({
    frames: state.frames.map((f) => (f.id === id ? { ...f, ...updates } : f)),
  })),
  
  deleteFrame: (id) => set((state) => ({
    frames: state.frames.filter((f) => f.id !== id),
    tasks: state.tasks.map((t) => (t.frameId === id ? { ...t, frameId: null } : t)),
  })),
  
  addColumn: (column) => set((state) => ({
    columns: [...state.columns, { ...column, id: uuidv4(), isCustom: true }],
  })),
  
  updateColumn: (id, updates) => set((state) => ({
    columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
  })),
  
  deleteColumn: (id) => set((state) => ({
    columns: state.columns.filter((c) => c.id !== id),
  })),
  
  reorderColumns: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.columns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { columns: result };
  }),
  
  renameColumnOption: (columnId, oldOption, newOption) => set((state) => {
    const column = state.columns.find(c => c.id === columnId);
    if (!column || !column.options) return state;

    const newOptions = column.options.map(opt => opt === oldOption ? newOption : opt);
    
    const newOptionColors = { ...(column.optionColors || {}) };
    if (newOptionColors[oldOption]) {
      newOptionColors[newOption] = newOptionColors[oldOption];
      delete newOptionColors[oldOption];
    }

    const updatedColumns = state.columns.map(c => c.id === columnId ? { ...c, options: newOptions, optionColors: newOptionColors } : c);

    const updatedTasks = state.tasks.map(task => {
      let updated = false;
      const newTask = { ...task, customFields: { ...task.customFields } };

      if (column.isCustom) {
        const val = newTask.customFields[column.id];
        if (Array.isArray(val) && val.includes(oldOption)) {
          newTask.customFields[column.id] = val.map((v: string) => v === oldOption ? newOption : v);
          updated = true;
        } else if (val === oldOption) {
          newTask.customFields[column.id] = newOption;
          updated = true;
        }
      } else {
        const field = column.field as keyof Task;
        const val = newTask[field];
        if (Array.isArray(val) && val.includes(oldOption)) {
          (newTask as any)[field] = val.map((v: string) => v === oldOption ? newOption : v);
          updated = true;
        } else if (val === oldOption) {
          (newTask as any)[field] = newOption;
          updated = true;
        }
      }
      return updated ? newTask : task;
    });

    return { columns: updatedColumns, tasks: updatedTasks };
  }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type ColumnType = 'checkbox' | 'text' | 'number' | 'select' | 'multi-select' | 'date';

export interface LinkageRule {
  triggerValue: string;
  targetColumnId: string;
  targetValue: string;
}

export interface Column {
  id: string;
  field: string;
  name: string;
  type: ColumnType;
  visible: boolean;
  isCustom: boolean;
  options?: string[];
  optionColors?: Record<string, string>;
  width?: number;
  linkageRules?: LinkageRule[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  urgency: string | null;
  categories: string[];
  customFields: Record<string, any>;
  x: number;
  y: number;
  frameId?: string | null;
  linkedTaskIds?: string[];
  directedLinks?: string[];
}

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  urgency: string | null;
  categories: string[];
  customFields: Record<string, any>;
}

export interface TaskTemplate {
  id: string;
  templateName: string;
  tasks: TemplateTask[];
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
  templates: TaskTemplate[];
  
  searchQuery: string;
  filters: Record<string, string[]>;
  setSearchQuery: (q: string) => void;
  setFilter: (colId: string, options: string[]) => void;
  clearFilters: () => void;
  
  addTask: (task?: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTasks: (ids: string[], updates: Partial<Task>, customUpdates?: Record<string, any>) => void;
  deleteTask: (id: string) => void;
  deleteTasks: (ids: string[]) => void;
  duplicateTasks: (ids: string[]) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  
  linkTasks: (id1: string, id2: string) => void;
  unlinkTasks: (id1: string, id2: string) => void;

  addTemplate: (template: Partial<TaskTemplate>) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  
  addFrame: (frame: Partial<Frame>) => Frame;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  deleteFrame: (id: string) => void;
  
  addColumn: (column: Omit<Column, 'id' | 'isCustom'>) => void;
  updateColumn: (id: string, updates: Partial<Column>) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (startIndex: number, endIndex: number) => void;
  renameColumnOption: (columnId: string, oldOption: string, newOption: string) => void;
  wrapText: boolean;
  setWrapText: (wrap: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: uuidv4(),
          title: 'Design initial wireframes',
      description: 'Create low-fidelity wireframes for the main dashboard.',
      completed: false,
      urgency: 'High',
      categories: ['Design', 'UI'],
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
      customFields: {},
      x: 400,
      y: 100,
    }
  ],
  frames: [],
  columns: [
    { id: 'col_status', field: 'completed', name: 'Status', type: 'checkbox', visible: true, isCustom: false, width: 80 },
    { id: 'col_title', field: 'title', name: 'Title', type: 'text', visible: true, isCustom: false, width: 250 },
    { id: 'col_desc', field: 'description', name: 'Description', type: 'text', visible: true, isCustom: false, width: 300 },
    { id: 'col_urgency', field: 'urgency', name: 'Urgency', type: 'select', visible: true, isCustom: false, options: ['High', 'Medium', 'Low'], optionColors: { 'High': 'red', 'Medium': 'yellow', 'Low': 'green' }, width: 150 },
    { id: 'col_cat', field: 'categories', name: 'Category', type: 'multi-select', visible: true, isCustom: false, options: ['Design', 'UI', 'DevOps', 'Frontend', 'Backend'], width: 200 },
  ],
  templates: [],
  searchQuery: '',
  filters: {},
  wrapText: true,
  setWrapText: (wrap) => set({ wrapText: wrap }),
  
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilter: (colId, options) => set((state) => ({ filters: { ...state.filters, [colId]: options } })),
  clearFilters: () => set({ searchQuery: '', filters: {} }),

  addTask: (task) => {
    const newTask: Task = {
      id: uuidv4(),
      title: '',
      description: '',
      completed: false,
      urgency: null,
      categories: [],
      customFields: {},
      x: Math.random() * 200,
      y: Math.random() * 200,
      linkedTaskIds: [],
      ...task,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },
  
  updateTask: (id, updates) => set((state) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return {};

    let newUpdates = { ...updates };
    let newCustomFields = updates.customFields ? { ...updates.customFields } : { ...task.customFields };

    state.columns.forEach(col => {
      if (!col.linkageRules || col.linkageRules.length === 0) return;

      let newValue = undefined;
      let oldValue = undefined;

      if (col.isCustom) {
        if (updates.customFields && col.id in updates.customFields) {
           newValue = updates.customFields[col.id];
           oldValue = task.customFields[col.id];
        }
      } else {
        if (col.field in updates) {
           newValue = (updates as any)[col.field];
           oldValue = (task as any)[col.field];
        }
      }

      if (newValue !== undefined && newValue !== oldValue) {
        const rule = col.linkageRules.find(r => r.triggerValue === newValue);
        if (rule) {
          const targetCol = state.columns.find(c => c.id === rule.targetColumnId);
          if (targetCol) {
            if (targetCol.isCustom) {
              newCustomFields[targetCol.id] = rule.targetValue;
            } else {
              (newUpdates as any)[targetCol.field] = rule.targetValue;
            }
          }
        }
      }
    });

    newUpdates.customFields = newCustomFields;

    return {
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...newUpdates } : t)),
    };
  }),
  
  updateTasks: (ids, updates, customUpdates) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (ids.includes(t.id)) {
        return {
          ...t,
          ...updates,
          customFields: customUpdates ? { ...t.customFields, ...customUpdates } : t.customFields
        };
      }
      return t;
    })
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks
      .filter((t) => t.id !== id)
      .map(t => ({
        ...t,
        linkedTaskIds: t.linkedTaskIds?.filter(linkedId => linkedId !== id)
      })),
  })),
  
  deleteTasks: (ids) => set((state) => ({
    tasks: state.tasks
      .filter(t => !ids.includes(t.id))
      .map(t => ({
        ...t,
        linkedTaskIds: t.linkedTaskIds?.filter(linkedId => !ids.includes(linkedId))
      }))
  })),

  duplicateTasks: (ids) => set((state) => {
    const newTasks = state.tasks.filter(t => ids.includes(t.id)).map(t => ({
      ...t,
      id: uuidv4(),
      x: t.x + 30,
      y: t.y + 30,
      title: `${t.title} (Copy)`,
      linkedTaskIds: []
    }));
    return { tasks: [...state.tasks, ...newTasks] };
  }),
  
  reorderTasks: (startIndex, endIndex) => set((state) => {
    const newTasks = [...state.tasks];
    const [removed] = newTasks.splice(startIndex, 1);
    newTasks.splice(endIndex, 0, removed);
    return { tasks: newTasks };
  }),

  linkTasks: (id1, id2) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id === id1 && !t.linkedTaskIds?.includes(id2)) return { ...t, linkedTaskIds: [...(t.linkedTaskIds || []), id2] };
      if (t.id === id2 && !t.linkedTaskIds?.includes(id1)) return { ...t, linkedTaskIds: [...(t.linkedTaskIds || []), id1] };
      return t;
    })
  })),

  unlinkTasks: (id1, id2) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id === id1) return { ...t, linkedTaskIds: (t.linkedTaskIds || []).filter(id => id !== id2) };
      if (t.id === id2) return { ...t, linkedTaskIds: (t.linkedTaskIds || []).filter(id => id !== id1) };
      return t;
    })
  })),

  addTemplate: (template) => set((state) => ({
    templates: [...state.templates, {
      id: uuidv4(),
      templateName: 'New Template',
      tasks: [{
        id: uuidv4(),
        title: '',
        description: '',
        urgency: null,
        categories: [],
        customFields: {}
      }],
      ...template
    }]
  })),

  updateTemplate: (id, updates) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  deleteTemplate: (id) => set((state) => ({
    templates: state.templates.filter(t => t.id !== id)
  })),

  duplicateTemplate: (id) => set((state) => {
    const t = state.templates.find(t => t.id === id);
    if (!t) return state;
    return {
      templates: [...state.templates, { 
        ...t, 
        id: uuidv4(), 
        templateName: `${t.templateName} (Copy)`,
        tasks: (t.tasks || []).map(task => ({ ...task, id: uuidv4() }))
      }]
    };
  }),

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
}), {
  name: 'taskflow-storage',
}));

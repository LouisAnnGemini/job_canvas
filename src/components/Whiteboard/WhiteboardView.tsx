import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore, Task, Frame } from '../../store/useStore';
import { TaskCard } from './TaskCard';
import { FrameNode } from './FrameNode';
import { WhiteboardContext } from './WhiteboardContext';

interface Point { x: number; y: number }
interface Rect { x: number; y: number; width: number; height: number }

export function WhiteboardView({ onOpenTaskDetail }: { onOpenTaskDetail: (taskId: string) => void }) {
  const { tasks, frames, updateTask, updateFrame, addFrame } = useStore();
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<{
    type: 'card' | 'frame' | 'selection';
    id?: string;
    startX: number;
    startY: number;
    initialPositions: Map<string, Point>;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    };
  }, [transform]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, transform.scale * (1 + delta)), 5);
      
      // Zoom around mouse pointer
      const { x: pointerX, y: pointerY } = screenToCanvas(e.clientX, e.clientY);
      setTransform(prev => ({
        scale: newScale,
        x: e.clientX - containerRef.current!.getBoundingClientRect().left - pointerX * newScale,
        y: e.clientY - containerRef.current!.getBoundingClientRect().top - pointerY * newScale,
      }));
    } else {
      // Pan
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [transform, screenToCanvas]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (e.button === 0) {
      // Start selection box if clicking on background
      const target = e.target as HTMLElement;
      if (target.id === 'whiteboard-bg') {
        setSelectedIds(new Set());
        const pos = screenToCanvas(e.clientX, e.clientY);
        setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
      return;
    }

    if (selectionBox) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox(prev => ({
        ...prev!,
        width: pos.x - prev!.x,
        height: pos.y - prev!.y,
      }));
      
      // Calculate selected items
      const box = {
        minX: Math.min(selectionBox.x, pos.x),
        maxX: Math.max(selectionBox.x, pos.x),
        minY: Math.min(selectionBox.y, pos.y),
        maxY: Math.max(selectionBox.y, pos.y),
      };
      
      const newSelected = new Set<string>();
      tasks.forEach(t => {
        // Card approx size 250x150
        if (t.x + 250 > box.minX && t.x < box.maxX && t.y + 150 > box.minY && t.y < box.maxY) {
          newSelected.add(t.id);
        }
      });
      setSelectedIds(newSelected);
    }

    if (dragState) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;

      if (dragState.type === 'card' || dragState.type === 'selection') {
        const idsToMove = dragState.type === 'selection' ? Array.from(selectedIds) : [dragState.id!];
        idsToMove.forEach(id => {
          const initial = dragState.initialPositions.get(id);
          if (initial) {
            updateTask(id, { x: initial.x + dx, y: initial.y + dy });
          }
        });
      } else if (dragState.type === 'frame') {
        const initial = dragState.initialPositions.get(dragState.id!);
        if (initial) {
          updateFrame(dragState.id!, { x: initial.x + dx, y: initial.y + dy });
          // Move tasks inside frame
          tasks.filter(t => t.frameId === dragState.id).forEach(t => {
            const tInitial = dragState.initialPositions.get(t.id);
            if (tInitial) {
              updateTask(t.id, { x: tInitial.x + dx, y: tInitial.y + dy });
            }
          });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    if (selectionBox) {
      setSelectionBox(null);
    }
    
    if (dragState) {
      // Check if dropped into a frame
      if (dragState.type === 'card' || dragState.type === 'selection') {
        const idsToMove = dragState.type === 'selection' ? Array.from(selectedIds) : [dragState.id!];
        
        idsToMove.forEach(taskId => {
          const task = tasks.find(t => t.id === taskId);
          if (!task) return;
          
          // Find if task center is inside any frame
          const centerX = task.x + 125; // approx half width
          const centerY = task.y + 75;  // approx half height
          
          let newFrameId: string | null = null;
          // Reverse to check top-most frames first
          for (let i = frames.length - 1; i >= 0; i--) {
            const f = frames[i];
            if (centerX >= f.x && centerX <= f.x + f.width && centerY >= f.y && centerY <= f.y + f.height) {
              newFrameId = f.id;
              break;
            }
          }
          
          if (task.frameId !== newFrameId) {
            updateTask(taskId, { frameId: newFrameId });
          }
        });
      }
      setDragState(null);
    }
    
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      
      if (key === 'h' || key === 'v') {
        e.preventDefault();
        const targetIds = selectedIds.size > 1 ? Array.from(selectedIds) : tasks.map(t => t.id);
        if (targetIds.length === 0) return;
        
        const targetTasks = tasks.filter(t => targetIds.includes(t.id));
        
        if (key === 'h') {
          // Align horizontal
          const avgY = targetTasks.reduce((sum, t) => sum + t.y, 0) / targetTasks.length;
          
          // Sort by X and distribute evenly
          targetTasks.sort((a, b) => a.x - b.x);
          const startX = targetTasks[0].x;
          const spacing = 280; // card width + gap
          
          targetTasks.forEach((t, i) => {
            updateTask(t.id, { x: startX + i * spacing, y: avgY });
          });
        } else if (key === 'v') {
          // Align vertical
          const avgX = targetTasks.reduce((sum, t) => sum + t.x, 0) / targetTasks.length;
          
          targetTasks.sort((a, b) => a.y - b.y);
          const startY = targetTasks[0].y;
          const spacing = 180; // card height + gap
          
          targetTasks.forEach((t, i) => {
            updateTask(t.id, { x: avgX, y: startY + i * spacing });
          });
        }
      } else if (key === 'f' && selectedIds.size > 1) {
        e.preventDefault();
        // Create frame around selection
        const selectedTasks = tasks.filter(t => selectedIds.has(t.id));
        const minX = Math.min(...selectedTasks.map(t => t.x));
        const minY = Math.min(...selectedTasks.map(t => t.y));
        const maxX = Math.max(...selectedTasks.map(t => t.x + 250));
        const maxY = Math.max(...selectedTasks.map(t => t.y + 150));
        
        const padding = 40;
        const newFrame = addFrame({
          x: minX - padding,
          y: minY - padding,
          width: maxX - minX + padding * 2,
          height: maxY - minY + padding * 2,
          name: 'New Frame'
        });
        
        selectedTasks.forEach(t => updateTask(t.id, { frameId: newFrame.id }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, tasks, updateTask, addFrame]);

  const startDrag = (e: React.PointerEvent, type: 'card' | 'frame', id: string) => {
    e.stopPropagation();
    const pos = screenToCanvas(e.clientX, e.clientY);
    
    const initialPositions = new Map<string, Point>();
    
    if (type === 'card') {
      if (selectedIds.has(id)) {
        // Drag all selected
        tasks.filter(t => selectedIds.has(t.id)).forEach(t => {
          initialPositions.set(t.id, { x: t.x, y: t.y });
        });
        setDragState({ type: 'selection', startX: pos.x, startY: pos.y, initialPositions });
      } else {
        // Drag single
        const task = tasks.find(t => t.id === id);
        if (task) initialPositions.set(id, { x: task.x, y: task.y });
        setDragState({ type: 'card', id, startX: pos.x, startY: pos.y, initialPositions });
        setSelectedIds(new Set([id]));
      }
    } else if (type === 'frame') {
      const frame = frames.find(f => f.id === id);
      if (frame) initialPositions.set(id, { x: frame.x, y: frame.y });
      // Also store initial positions of tasks inside frame
      tasks.filter(t => t.frameId === id).forEach(t => {
        initialPositions.set(t.id, { x: t.x, y: t.y });
      });
      setDragState({ type: 'frame', id, startX: pos.x, startY: pos.y, initialPositions });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#E4E3E0] relative touch-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div id="whiteboard-bg" className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(#c8c8c8 1px, transparent 1px)`,
        backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }} />
      
      <WhiteboardContext.Provider value={{ scale: transform.scale }}>
        <div 
          className="absolute origin-top-left"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Render Frames */}
          {frames.map(frame => (
            <FrameNode 
              key={frame.id} 
              frame={frame} 
              onPointerDown={(e) => startDrag(e, 'frame', frame.id)}
            />
          ))}

          {/* Render Tasks */}
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              isSelected={selectedIds.has(task.id)}
              onPointerDown={(e) => startDrag(e, 'card', task.id)}
              onDoubleClick={(e) => { e.stopPropagation(); onOpenTaskDetail(task.id); }}
            />
          ))}

          {/* Render Selection Box */}
          {selectionBox && (
            <div 
              className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none"
              style={{
                left: Math.min(selectionBox.x, selectionBox.x + selectionBox.width),
                top: Math.min(selectionBox.y, selectionBox.y + selectionBox.height),
                width: Math.abs(selectionBox.width),
                height: Math.abs(selectionBox.height),
              }}
            />
          )}
        </div>
      </WhiteboardContext.Provider>
      
      {/* UI Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-zinc-200 flex items-center gap-4 text-sm text-zinc-600 font-medium">
        <span><kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">Space</kbd> + Drag to pan</span>
        <span><kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">Ctrl</kbd> + Scroll to zoom</span>
        {selectedIds.size > 1 && (
          <>
            <div className="w-px h-4 bg-zinc-300" />
            <span><kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">H</kbd> Align Horiz</span>
            <span><kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">V</kbd> Align Vert</span>
            <span><kbd className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">F</kbd> Create Frame</span>
          </>
        )}
      </div>
    </div>
  );
}

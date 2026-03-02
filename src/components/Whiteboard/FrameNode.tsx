import React, { useContext } from 'react';
import { Frame, useStore } from '../../store/useStore';
import { WhiteboardContext } from './WhiteboardContext';

export const FrameNode: React.FC<{ frame: Frame, onPointerDown: (e: React.PointerEvent) => void }> = ({ frame, onPointerDown }) => {
  const { updateFrame } = useStore();
  const { scale } = useContext(WhiteboardContext);

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = frame.width;
    const startH = frame.height;
    
    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      updateFrame(frame.id, {
        width: Math.max(200, startW + dx),
        height: Math.max(150, startH + dy)
      });
    };
    
    const onUp = (upEvent: PointerEvent) => {
      try {
        if (target.hasPointerCapture(upEvent.pointerId)) {
          target.releasePointerCapture(upEvent.pointerId);
        }
      } catch (err) {}
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className="absolute border-2 border-dashed border-zinc-400 bg-zinc-50/30 rounded-2xl cursor-grab active:cursor-grabbing"
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        touchAction: 'none'
      }}
      onPointerDown={onPointerDown}
    >
      <div className="absolute -top-8 left-0 text-sm font-bold text-zinc-500 uppercase tracking-wider">
        <input 
          type="text" 
          className="bg-transparent outline-none focus:text-zinc-900 transition-colors"
          value={frame.name}
          onChange={(e) => updateFrame(frame.id, { name: e.target.value })}
          onPointerDown={e => e.stopPropagation()}
        />
      </div>
      
      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center"
        onPointerDown={handleResizePointerDown}
      >
        <div className="w-2 h-2 bg-zinc-400 rounded-full" />
      </div>
    </div>
  );
}

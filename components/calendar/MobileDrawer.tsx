'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

export function MobileDrawer({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    document.body.classList.add('has-open-drawer');
    return () => {
      document.removeEventListener('keydown', close);
      document.body.classList.remove('has-open-drawer');
    };
  }, [onClose]);

  const finishDrag = () => {
    if (dragY > 88) onClose();
    else setDragY(0);
    startY.current = null;
  };

  return <div className="new-sheet-layer" role="presentation" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`new-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ transform: `translateY(${dragY}px)` }}>
      <div
        className="new-sheet__drag-zone"
        onPointerDown={(event) => { startY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { if (startY.current !== null) setDragY(Math.max(0, event.clientY - startY.current)); }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="new-sheet__handle" aria-hidden="true" />
      </div>
      {children}
    </section>
  </div>;
}

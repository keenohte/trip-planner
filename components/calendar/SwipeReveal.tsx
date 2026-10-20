'use client';

import { type PointerEvent, type ReactNode, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const DELETE_ACTION_WIDTH = 72;
const DUAL_ACTION_WIDTH = 124;

export function SwipeReveal({ children, label, onDelete, secondaryAction }: {
  children: ReactNode;
  label: string;
  onDelete: () => void | Promise<void>;
  secondaryAction?: { label: string; icon: ReactNode; active?: boolean; onAction: () => void | Promise<void> };
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const origin = useRef(0);
  const moved = useRef(false);
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [acting, setActing] = useState(false);
  const actionWidth = secondaryAction ? DUAL_ACTION_WIDTH : DELETE_ACTION_WIDTH;

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, y: event.clientY };
    origin.current = offset;
    moved.current = false;
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (!moved.current && (Math.abs(dy) >= Math.abs(dx) || (dx > -10 && origin.current === 0))) return;
    if (Math.abs(dx) > 10) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (moved.current) {
      event.preventDefault();
      setOffset(Math.max(-actionWidth, Math.min(0, origin.current + dx)));
    }
  };

  const finish = () => {
    if (!start.current) return;
    setOffset(offset < -actionWidth / 2 ? -actionWidth : 0);
    start.current = null;
    if (moved.current) window.setTimeout(() => { moved.current = false; }, 0);
  };

  return <div className={`new-swipe-row${offset < 0 ? ' is-open' : ''}${secondaryAction ? ' has-secondary-action' : ''}`}>
    <div className="new-swipe-row__actions">
      {secondaryAction && <button className={`new-swipe-row__secondary${secondaryAction.active ? ' is-active' : ''}`} type="button" aria-label={`${secondaryAction.label} ${label}`} disabled={acting} onClick={async () => { setActing(true); await secondaryAction.onAction(); setActing(false); setOffset(0); }}>{secondaryAction.icon}</button>}
      <button className="new-swipe-row__delete" type="button" aria-label={`Delete ${label}`} disabled={deleting} onClick={async () => { setDeleting(true); await onDelete(); }}><Trash2 size={21} /></button>
    </div>
    <div
      className="new-swipe-row__content"
      style={{ transform: `translateX(${offset}px)` }}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={(event) => { if (moved.current) { event.preventDefault(); event.stopPropagation(); moved.current = false; } else if (offset < 0) setOffset(0); }}
    >{children}</div>
  </div>;
}

'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { DayPicker } from '@daypicker/react';

function parseValue(value: string) {
  if (!value) return undefined;
  const [datePart, timePart = '09:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return undefined;
  return new Date(year, month - 1, day, hours, minutes);
}

function serialize(date: Date | undefined, time: string) {
  if (!date) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time || '09:00'}`;
}

function displayValue(date: Date | undefined, time: string) {
  if (!date) return 'Choose date and time';
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  const [hours = '9', minutes = '00'] = time.split(':');
  const displayTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, Number(hours), Number(minutes)));
  return `${dateLabel} · ${displayTime}`;
}

export function DateTimePicker({ id, name, initialValue }: { id: string; name: string; initialValue: string }) {
  const initialDate = parseValue(initialValue);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialValue.split('T')[1]?.slice(0, 5) || '09:00');
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(312, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow >= 410 ? { top: rect.bottom + 8, left, width } : { bottom: window.innerHeight - rect.top + 8, left, width });
    };
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      const popover = document.getElementById(`${id}-popover`);
      if (!rootRef.current?.contains(target) && !popover?.contains(target)) setOpen(false);
    };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    place();
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keydown);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    };
  }, [id, open]);

  const popover = open && typeof document !== 'undefined' ? createPortal(<div className="date-time-popover date-time-popover-portal" id={`${id}-popover`} style={position} role="dialog" aria-label="Choose date and time">
      <DayPicker mode="single" selected={selected} defaultMonth={selected} onSelect={(day) => day && setSelected(day)} showOutsideDays />
      <div className="date-time-footer"><label htmlFor={`${id}-time`}><Clock3 size={16} aria-hidden="true" /><span className="sr-only">Time</span><input id={`${id}-time`} type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><button className="primary-button" type="button" onClick={() => setOpen(false)}>Done</button></div>
    </div>, document.body) : null;

  return <div className="date-time-picker" ref={rootRef}>
    <button ref={triggerRef} className="date-time-trigger" type="button" aria-expanded={open} aria-controls={`${id}-popover`} onClick={() => setOpen((value) => !value)}><CalendarDays size={16} aria-hidden="true" /><span>{displayValue(selected, time)}</span></button>{selected && <button className="date-time-clear" type="button" aria-label="Clear date" onClick={() => setSelected(undefined)}><X size={14} aria-hidden="true" /></button>}
    <input id={id} name={name} type="hidden" value={serialize(selected, time)} />
    {popover}
  </div>;
}

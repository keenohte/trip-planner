'use client';

import { type FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { createScheduleComment, deleteScheduleComment, updateScheduleItem } from '@/app/schedule/actions';
import { MobileDrawer } from '@/components/calendar/MobileDrawer';
import { SwipeReveal } from '@/components/calendar/SwipeReveal';
import { formatDateTimeInput, localDateTimeToIso } from '@/lib/datetime';
import type { ScheduleComment } from '@/lib/schedule-comments';
import type { ScheduleItem } from '@/lib/schedule';

export type InlineEventUpdate = { title: string; startsAt: string; endsAt: string; city: string; notes: string };

function commentTime(value: string) {
  const age = Date.now() - Date.parse(value);
  if (age < 60_000) return 'just now';
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export function EventSheet({ item, preview = false, onPreviewSave, onPreviewComments, onClose }: {
  item: ScheduleItem;
  preview?: boolean;
  onPreviewSave?: (update: InlineEventUpdate) => void;
  onPreviewComments?: (comments: ScheduleComment[]) => void;
  onClose: () => void;
}) {
  const initialStart = formatDateTimeInput(item.startsAt, item.timezone);
  const initialEnd = formatDateTimeInput(item.endsAt ?? item.startsAt, item.timezone);
  const initialCity = item.activity?.city ?? item.idea?.city ?? item.booking?.cityRoute ?? item.detail?.split(/[·,]/)[0]?.trim() ?? '';
  const initialNotes = item.activity?.notes ?? item.idea?.notes ?? item.booking?.notes ?? '';
  const [title, setTitle] = useState(item.title);
  const [date, setDate] = useState(initialStart.slice(0, 10));
  const [startTime, setStartTime] = useState(initialStart.slice(11, 16));
  const [endTime, setEndTime] = useState(initialEnd.slice(11, 16));
  const [city, setCity] = useState(initialCity);
  const [active, setActive] = useState<string | null>(null);
  const [comments, setComments] = useState<ScheduleComment[]>(item.comments);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = title !== item.title || `${date}T${startTime}` !== initialStart || `${date}T${endTime}` !== initialEnd || city !== initialCity;

  const friendlyDate = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)), [date]);
  const friendlyTime = (value: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${value}:00Z`));

  const save = () => {
    const startsAt = localDateTimeToIso(`${date}T${startTime}`, item.timezone);
    const endsAt = localDateTimeToIso(`${date}T${endTime}`, item.timezone);
    if (!title.trim() || !startsAt || !endsAt || endsAt <= startsAt) { setError('Check the title and make sure the end time is after the start time.'); return; }
    const update = { title: title.trim(), startsAt, endsAt, city: city.trim(), notes: initialNotes };
    if (preview) { onPreviewSave?.(update); setError(null); return; }
    const data = new FormData();
    data.set('itemId', item.id); data.set('source', item.source); data.set('title', update.title); data.set('startsAt', `${date}T${startTime}`); data.set('endsAt', `${date}T${endTime}`); data.set('city', update.city); data.set('notes', update.notes);
    startTransition(async () => { const result = await updateScheduleItem({ error: null }, data); if (result.error) setError(result.error); else { setError(null); router.refresh(); } });
  };

  const addComment = (event: FormEvent) => {
    event.preventDefault();
    const body = comment.trim(); if (!body) return;
    if (preview) {
      const next = [...comments, { id: `preview-comment-${Date.now()}`, source: item.source, itemId: item.id, body, createdAt: new Date().toISOString() }];
      setComments(next); onPreviewComments?.(next); setComment(''); return;
    }
    const data = new FormData(); data.set('itemId', item.id); data.set('source', item.source); data.set('body', body);
    startTransition(async () => { const result = await createScheduleComment(data); if (result.error || !result.comment) setError(result.error); else { const next = [...comments, { ...result.comment, source: item.source, itemId: item.id }]; setComments(next); setComment(''); router.refresh(); } });
  };

  const removeComment = async (target: ScheduleComment) => {
    const next = comments.filter((candidate) => candidate.id !== target.id); setComments(next);
    if (preview) { onPreviewComments?.(next); return; }
    const data = new FormData(); data.set('commentId', target.id);
    const result = await deleteScheduleComment(data); if (result.error) { setComments(comments); setError(result.error); } else router.refresh();
  };

  return <MobileDrawer labelledBy="event-sheet-title" onClose={onClose} className="new-sheet--event">
    <div className="new-event-sheet">
      <div className="new-event-sheet__title-row">
        {active === 'title' ? <input className="new-inline-title" aria-label="Title" value={title} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => setTitle(event.target.value)} onBlur={() => setActive(null)} /> : <button id="event-sheet-title" className="new-inline-title-view" type="button" onClick={() => setActive('title')}>{title}</button>}
        {dirty && <button className="new-inline-save" type="button" disabled={pending} onClick={save}>{pending ? 'Saving…' : 'Save'}</button>}
      </div>

      <div className="new-inline-fields">
        <div className="new-inline-field is-first"><span>Date</span>{active === 'date' ? <input type="date" aria-label="Date" value={date} autoFocus onChange={(event) => setDate(event.target.value)} onBlur={() => setActive(null)} /> : <button type="button" onClick={() => setActive('date')}>{friendlyDate}</button>}</div>
        <div className="new-inline-field"><span>Time</span>{active === 'time' ? <div className="new-inline-time"><input type="time" aria-label="Start time" value={startTime} autoFocus onChange={(event) => setStartTime(event.target.value)} /><span>–</span><input type="time" aria-label="End time" value={endTime} onChange={(event) => setEndTime(event.target.value)} onBlur={() => setActive(null)} /></div> : <button type="button" onClick={() => setActive('time')}>{friendlyTime(startTime)} – {friendlyTime(endTime)}</button>}</div>
        <div className="new-inline-field is-last"><span>Location</span>{active === 'city' ? <input aria-label="Location" value={city} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => setCity(event.target.value)} onBlur={() => setActive(null)} /> : <button type="button" onClick={() => setActive('city')}>{city || 'Add a location'}</button>}{city && <a aria-label="Open location in Maps" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`} target="_blank" rel="noreferrer"><ExternalLink size={18} /></a>}</div>
      </div>

      <div className="new-comments" aria-label="Comments">{comments.map((entry) => <SwipeReveal key={entry.id} label="comment" onDelete={() => removeComment(entry)}><article className="new-comment"><p>{entry.body}</p><time>{commentTime(entry.createdAt)}</time></article></SwipeReveal>)}</div>
      {error && <p className="new-form__error" role="alert">{error}</p>}
    </div>
    <form className="new-comment-composer" onSubmit={addComment}><input aria-label="Add a comment" maxLength={1000} placeholder="Add a comment" value={comment} onChange={(event) => setComment(event.target.value)} />{comment.trim() && <button type="submit" disabled={pending}>Send</button>}</form>
  </MobileDrawer>;
}

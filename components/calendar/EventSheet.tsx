'use client';

import { type FocusEvent, type FormEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, X } from 'lucide-react';
import { createScheduleComment, deleteScheduleComment, updateScheduleItem } from '@/app/schedule/actions';
import { MobileDrawer } from '@/components/calendar/MobileDrawer';
import { SwipeReveal } from '@/components/calendar/SwipeReveal';
import { formatDateTimeInput, localDateTimeToIso } from '@/lib/datetime';
import type { ScheduleComment } from '@/lib/schedule-comments';
import type { ScheduleItem } from '@/lib/schedule';

export type InlineEventUpdate = { title: string; startsAt: string; endsAt: string | null; city: string; notes: string; mapsUrl: string; websiteUrl: string };

function commentTime(value: string) {
  const age = Date.now() - Date.parse(value);
  if (age < 60_000) return 'just now';
  if (age < 3_600_000) return `${Math.floor(age / 60_000)}m ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function validateLink(value: string, label: string, googleMaps = false) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    if (googleMaps && !(url.hostname === 'goo.gl' || url.hostname.endsWith('.goo.gl') || url.hostname.endsWith('.google.com') || url.hostname === 'google.com')) return 'Enter a Google Maps link.';
    return null;
  } catch {
    return `Enter a valid ${label} link.`;
  }
}

export function EventSheet({ item, preview = false, onPreviewSave, onPreviewComments, onClose }: {
  item: ScheduleItem;
  preview?: boolean;
  onPreviewSave?: (update: InlineEventUpdate) => void;
  onPreviewComments?: (comments: ScheduleComment[]) => void;
  onClose: () => void;
}) {
  const initialStart = formatDateTimeInput(item.startsAt, item.timezone);
  const initialEnd = formatDateTimeInput(item.endsAt, item.timezone);
  const initialCity = item.activity ? item.activity.city ?? '' : item.idea ? item.idea.city ?? '' : item.booking ? item.booking.cityRoute ?? '' : item.detail?.split(/[·,]/)[0]?.trim() ?? '';
  const initialNotes = item.activity?.notes ?? item.idea?.notes ?? item.booking?.notes ?? '';
  const initialMapsUrl = item.activity?.mapsUrl ?? item.idea?.mapsUrl ?? item.booking?.mapsUrl ?? '';
  const initialWebsiteUrl = item.activity?.websiteUrl ?? item.idea?.websiteUrl ?? item.booking?.websiteUrl ?? '';
  const [title, setTitle] = useState(item.title);
  const [date, setDate] = useState(initialStart.slice(0, 10));
  const [startTime, setStartTime] = useState(initialStart.slice(11, 16));
  const [endTime, setEndTime] = useState(initialEnd.slice(11, 16));
  const [city, setCity] = useState(initialCity);
  const [mapsUrl, setMapsUrl] = useState(initialMapsUrl);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [active, setActive] = useState<string | null>(null);
  const [comments, setComments] = useState<ScheduleComment[]>(item.comments);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pending, startTransition] = useTransition();
  const savingRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const savedTimerRef = useRef<number | null>(null);
  const router = useRouter();
  const initialDraft = { title: item.title, date: initialStart.slice(0, 10), startTime: initialStart.slice(11, 16), endTime: initialEnd.slice(11, 16), city: initialCity, mapsUrl: initialMapsUrl, websiteUrl: initialWebsiteUrl };
  const lastSavedRef = useRef(JSON.stringify(initialDraft));
  const draftRef = useRef(initialDraft);
  draftRef.current = { title, date, startTime, endTime, city, mapsUrl, websiteUrl };

  const friendlyDate = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)), [date]);
  const friendlyTime = (value: string) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${value}:00Z`));

  useEffect(() => () => { if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current); }, []);

  const showSaved = () => {
    setSaveStatus('saved');
    if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const saveDraft = async () => {
    const draft = draftRef.current;
    const draftKey = JSON.stringify(draft);
    if (draftKey === lastSavedRef.current) return;
    if (savingRef.current) { queuedSaveRef.current = true; return; }
    const startsAt = localDateTimeToIso(`${draft.date}T${draft.startTime}`, item.timezone);
    const endsAt = draft.endTime ? localDateTimeToIso(`${draft.date}T${draft.endTime}`, item.timezone) : null;
    const linkError = validateLink(draft.mapsUrl, 'Google Maps', true) ?? validateLink(draft.websiteUrl, 'website');
    if (!draft.title.trim() || !startsAt || (endsAt && endsAt <= startsAt)) { setError('Check the title and make sure the end time is after the start time.'); setSaveStatus('error'); return; }
    if (linkError) { setError(linkError); setSaveStatus('error'); return; }
    const update = { title: draft.title.trim(), startsAt, endsAt, city: draft.city.trim(), notes: initialNotes, mapsUrl: draft.mapsUrl.trim(), websiteUrl: draft.websiteUrl.trim() };
    savingRef.current = true;
    setSaveStatus('saving');
    setError(null);
    if (preview) {
      onPreviewSave?.(update);
      lastSavedRef.current = draftKey;
      savingRef.current = false;
      showSaved();
      return;
    }
    const data = new FormData();
    data.set('itemId', item.id); data.set('source', item.source); data.set('title', update.title); data.set('startsAt', `${draft.date}T${draft.startTime}`); data.set('endsAt', draft.endTime ? `${draft.date}T${draft.endTime}` : ''); data.set('city', update.city); data.set('clearCity', String(Boolean(initialCity) && !update.city)); data.set('notes', update.notes); data.set('mapsUrl', update.mapsUrl); data.set('websiteUrl', update.websiteUrl);
    const result = await updateScheduleItem({ error: null }, data);
    savingRef.current = false;
    if (result.error) { setError(result.error); setSaveStatus('error'); }
    else { lastSavedRef.current = draftKey; setError(null); showSaved(); router.refresh(); }
    if (queuedSaveRef.current) { queuedSaveRef.current = false; window.setTimeout(() => void saveDraft(), 0); }
  };

  const finishEdit = () => {
    setActive(null);
    window.requestAnimationFrame(() => void saveDraft());
  };

  const finishTimeEdit = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    finishEdit();
  };

  const markEditing = () => { setSaveStatus('idle'); setError(null); };
  const changeStartTime = (value: string) => {
    markEditing();
    draftRef.current = { ...draftRef.current, startTime: value };
    setStartTime(value);
  };
  const changeEndTime = (value: string) => {
    markEditing();
    draftRef.current = { ...draftRef.current, endTime: value };
    setEndTime(value);
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
    <div className="new-event-sheet" data-drawer-scroll>
      <div className="new-event-sheet__title-row">
        {active === 'title' ? <input className="new-inline-title" aria-label="Title" value={title} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => { markEditing(); setTitle(event.target.value); }} onBlur={finishEdit} /> : <button id="event-sheet-title" className="new-inline-title-view" type="button" onClick={() => setActive('title')}>{title}</button>}
        <span className={`new-inline-status is-${saveStatus}`} role="status" aria-live="polite">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Not saved' : ''}</span>
      </div>

      <div className="new-inline-fields">
        <div className="new-inline-field is-first"><span>Date</span>{active === 'date' ? <input type="date" aria-label="Date" value={date} autoFocus onChange={(event) => { markEditing(); setDate(event.target.value); }} onBlur={finishEdit} /> : <button type="button" onClick={() => setActive('date')}>{friendlyDate}</button>}</div>
        <div className="new-inline-field"><span>Start time</span>{active === 'startTime' ? <div className="new-time-entry" onBlur={finishTimeEdit}><input type="time" aria-label="Start time" value={startTime} autoFocus onChange={(event) => changeStartTime(event.target.value)} /></div> : <button type="button" onClick={() => setActive('startTime')}>{friendlyTime(startTime)}</button>}</div>
        <div className={`new-inline-field${endTime ? '' : ' is-empty'}`}><span>End time</span>{active === 'endTime' ? <div className="new-time-entry" onBlur={finishTimeEdit}><input type="time" aria-label="End time (optional)" value={endTime} autoFocus onChange={(event) => changeEndTime(event.target.value)} />{endTime && <button className="new-time-clear" type="button" aria-label="Clear end time" onClick={() => changeEndTime('')}><X size={18} aria-hidden="true" /></button>}</div> : <div className="new-time-entry"><button className="new-time-value" type="button" onClick={() => setActive('endTime')}>{endTime ? friendlyTime(endTime) : 'when does it end?'}</button>{endTime && <button className="new-time-clear" type="button" aria-label="Clear end time" onClick={() => { changeEndTime(''); window.requestAnimationFrame(() => void saveDraft()); }}><X size={18} aria-hidden="true" /></button>}</div>}</div>
        <div className={`new-inline-field${city ? '' : ' is-empty'}`}>{city && <span>Location</span>}{active === 'city' ? <input aria-label="Location" placeholder="Where is it?" value={city} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => { markEditing(); setCity(event.target.value); }} onBlur={finishEdit} /> : <button type="button" onClick={() => setActive('city')}>{city || 'Where is it?'}</button>}</div>
        <div className={`new-inline-field${mapsUrl ? ' has-action' : ' is-empty'}`}>{mapsUrl && <span>Google Maps link</span>}{active === 'mapsUrl' ? <input aria-label="Google Maps link" inputMode="url" placeholder="Google Maps link" value={mapsUrl} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => { markEditing(); setMapsUrl(event.target.value); }} onBlur={finishEdit} /> : <button type="button" onClick={() => setActive('mapsUrl')}>{mapsUrl || 'Google Maps link'}</button>}{mapsUrl && <a aria-label="Open location in Google Maps" href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /></a>}</div>
        <div className={`new-inline-field is-last${websiteUrl ? '' : ' is-empty'}`}>{websiteUrl && <span>Website</span>}{active === 'websiteUrl' ? <input aria-label="Website" inputMode="url" placeholder="Website" value={websiteUrl} autoFocus onFocus={(event) => event.currentTarget.select()} onChange={(event) => { markEditing(); setWebsiteUrl(event.target.value); }} onBlur={finishEdit} /> : <button type="button" onClick={() => setActive('websiteUrl')}>{websiteUrl || 'Website'}</button>}{websiteUrl && <a aria-label="Open website" href={websiteUrl} target="_blank" rel="noreferrer"><ExternalLink size={18} /></a>}</div>
      </div>

      <div className="new-comments" aria-label="Comments">{comments.map((entry) => <SwipeReveal key={entry.id} label="comment" onDelete={() => removeComment(entry)}><article className="new-comment"><p>{entry.body}</p><time>{commentTime(entry.createdAt)}</time></article></SwipeReveal>)}</div>
      {error && <p className="new-form__error" role="alert">{error}</p>}
    </div>
    <form className="new-comment-composer" onSubmit={addComment}><input aria-label="Add a comment" maxLength={1000} placeholder="Add a comment" value={comment} onChange={(event) => setComment(event.target.value)} />{comment.trim() && <button type="submit" disabled={pending}>Send</button>}</form>
  </MobileDrawer>;
}

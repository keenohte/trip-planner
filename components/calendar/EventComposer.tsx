'use client';

import { type FocusEvent, type FormEvent, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { createScheduleActivity, updateScheduleItem, type ActivityFormState } from '@/app/schedule/actions';
import { MobileDrawer } from '@/components/calendar/MobileDrawer';
import { formatDateTimeInput, localDateTimeToIso } from '@/lib/datetime';
import type { ScheduleItem } from '@/lib/schedule';

const initialState: ActivityFormState = { error: null };

function friendlyDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

function friendlyTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${value}:00Z`));
}

export type PreviewEventInput = { item: ScheduleItem | null; title: string; startsAt: string; endsAt: string | null; city: string; notes: string; mapsUrl: string; websiteUrl: string };

export function EventComposer({ initialStartsAt, timezone, items, item = null, preview = false, onPreviewSave, onClose }: {
  initialStartsAt: string;
  timezone: string;
  items: ScheduleItem[];
  item?: ScheduleItem | null;
  preview?: boolean;
  onPreviewSave?: (input: PreviewEventInput) => void;
  onClose: () => void;
}) {
  const actionHandler = item ? updateScheduleItem : createScheduleActivity;
  const [state, action, pending] = useActionState(actionHandler, initialState);
  const initialStart = item ? formatDateTimeInput(item.startsAt, timezone) : initialStartsAt;
  const initialEnd = item?.endsAt ? formatDateTimeInput(item.endsAt, timezone) : '';
  const [startsAt, setStartsAt] = useState(initialStart);
  const [endsAt, setEndsAt] = useState(initialEnd);
  const [activeField, setActiveField] = useState<'date' | 'startTime' | 'endTime' | null>(null);
  const [overlapAccepted, setOverlapAccepted] = useState(false);
  const [overlapTitle, setOverlapTitle] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const city = item?.activity ? item.activity.city ?? '' : item?.idea ? item.idea.city ?? '' : item?.booking ? item.booking.cityRoute ?? '' : item?.detail?.split(/[·,]/)[0]?.trim() ?? '';
  const notes = item?.activity?.notes ?? item?.idea?.notes ?? item?.booking?.notes ?? '';
  const mapsUrl = item?.activity?.mapsUrl ?? item?.idea?.mapsUrl ?? item?.booking?.mapsUrl ?? '';
  const websiteUrl = item?.activity?.websiteUrl ?? item?.idea?.websiteUrl ?? item?.booking?.websiteUrl ?? '';
  const otherItems = useMemo(() => items.filter((candidate) => !item || candidate.id !== item.id || candidate.source !== item.source), [item, items]);

  useEffect(() => { if (state.saved) { router.refresh(); onClose(); } }, [onClose, router, state.saved]);
  useEffect(() => {
    const timer = window.setTimeout(() => { titleRef.current?.focus(); titleRef.current?.select(); }, 380);
    return () => window.clearTimeout(timer);
  }, []);

  const changeDate = (value: string) => {
    setStartsAt(`${value}T${startTime}`);
    if (endsAt) setEndsAt(`${value}T${endTime}`);
    setOverlapAccepted(false);
    setOverlapTitle(null);
  };

  const changeStartTime = (value: string) => {
    setStartsAt(`${date}T${value}`);
    setOverlapAccepted(false);
    setOverlapTitle(null);
  };

  const changeEndTime = (value: string) => {
    setEndsAt(value ? `${date}T${value}` : '');
    setOverlapAccepted(false);
    setOverlapTitle(null);
  };

  const finishTimeEdit = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setActiveField(null);
  };

  const date = startsAt.slice(0, 10);
  const startTime = startsAt.slice(11, 16);
  const endTime = endsAt.slice(11, 16);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    const startIso = localDateTimeToIso(startsAt, timezone);
    const endIso = endsAt ? localDateTimeToIso(endsAt, timezone) : null;
    const conflict = startIso && endIso ? otherItems.find((candidate) => startIso < (candidate.endsAt ?? candidate.startsAt) && endIso > candidate.startsAt) : null;
    if (conflict && !overlapAccepted) {
      event.preventDefault();
      setOverlapAccepted(true);
      setOverlapTitle(conflict.title);
      return;
    }
    if (preview) {
      event.preventDefault();
      if (!startIso) return;
      const data = new FormData(event.currentTarget);
      onPreviewSave?.({ item, title: String(data.get('title') ?? '').trim(), startsAt: startIso, endsAt: endIso, city: String(data.get('city') ?? '').trim(), notes: String(data.get('notes') ?? '').trim(), mapsUrl: String(data.get('mapsUrl') ?? '').trim(), websiteUrl: String(data.get('websiteUrl') ?? '').trim() });
      onClose();
    }
  };

  return <MobileDrawer labelledBy="composer-title" onClose={onClose} className="new-sheet--composer">
    <form className="new-sheet__form" action={action} onSubmit={submit}>
      {item && <><input name="itemId" type="hidden" value={item.id} /><input name="source" type="hidden" value={item.source} /></>}
      <input name="startsAt" type="hidden" value={startsAt} /><input name="endsAt" type="hidden" value={endsAt} /><input name="notes" type="hidden" value={item ? notes : ''} />{item && city && <input name="clearCity" type="hidden" value="true" />}
      <div className="new-sheet__body new-composer-body" data-drawer-scroll>
        <h2 id="composer-title">{item ? 'Update your plan' : 'Add to your day'}</h2>
        <div className="new-composer-fields">
          <input ref={titleRef} className="is-first" name="title" required maxLength={160} placeholder="What are you doing?" defaultValue={item?.title ?? ''} onFocus={(event) => event.currentTarget.select()} />
          <div className="new-composer-field">{activeField === 'date' ? <input aria-label="Date" type="date" value={date} autoFocus onChange={(event) => changeDate(event.target.value)} onBlur={() => setActiveField(null)} /> : <button type="button" onClick={() => setActiveField('date')}>{friendlyDate(date)}</button>}</div>
          <div className="new-composer-field has-label"><span className="new-composer-field__label">Start time</span>{activeField === 'startTime' ? <div className="new-time-entry" onBlur={finishTimeEdit}><input aria-label="Start time" type="time" value={startTime} autoFocus onChange={(event) => changeStartTime(event.target.value)} /></div> : <button type="button" onClick={() => setActiveField('startTime')}>{friendlyTime(startTime)}</button>}</div>
          <div className={`new-composer-field has-label${endTime ? '' : ' is-empty'}`}><span className="new-composer-field__label">End time</span>{activeField === 'endTime' ? <div className="new-time-entry" onBlur={finishTimeEdit}><input aria-label="End time (optional)" type="time" value={endTime} autoFocus onChange={(event) => changeEndTime(event.target.value)} />{endTime && <button className="new-time-clear" type="button" aria-label="Clear end time" onClick={() => changeEndTime('')}><X size={18} aria-hidden="true" /></button>}</div> : <div className="new-time-entry"><button className="new-time-value" type="button" onClick={() => setActiveField('endTime')}>{endTime ? friendlyTime(endTime) : 'when does it end?'}</button>{endTime && <button className="new-time-clear" type="button" aria-label="Clear end time" onClick={() => changeEndTime('')}><X size={18} aria-hidden="true" /></button>}</div>}</div>
          <input name="city" placeholder="Where is it?" defaultValue={city} />
          <input name="mapsUrl" type="url" inputMode="url" placeholder="Google Maps link" defaultValue={mapsUrl} />
          <input className="is-last" name="websiteUrl" type="url" inputMode="url" placeholder="Website" defaultValue={websiteUrl} />
        </div>
        <div className="new-composer-feedback">
          {overlapTitle && <p className="new-form__warning"><AlertTriangle size={17} /><span><strong>This overlaps “{overlapTitle}”.</strong> Overlaps are allowed—submit again to save anyway.</span></p>}
          {state.error && <p className="new-form__error" role="alert">{state.error}</p>}
        </div>
      </div>
      <footer className="new-composer-footer"><button type="submit" disabled={pending}>{pending ? 'Saving…' : overlapTitle ? 'Save anyway' : 'Save'}</button></footer>
    </form>
  </MobileDrawer>;
}

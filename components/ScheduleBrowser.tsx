'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, Clock3, Landmark, Moon, Plane, ShoppingBag, Soup, Sparkles, Sun, Sunrise, UtensilsCrossed } from 'lucide-react';
import { EventComposer, type PreviewEventInput } from '@/components/calendar/EventComposer';
import { EventSheet, type InlineEventUpdate } from '@/components/calendar/EventSheet';
import { SwipeReveal } from '@/components/calendar/SwipeReveal';
import { NewBottomNav } from '@/components/NewBottomNav';
import { deleteScheduleItem } from '@/app/schedule/actions';
import { dateKey, formatScheduleTime } from '@/lib/datetime';
import type { ScheduleGroup, ScheduleItem } from '@/lib/schedule';
import type { ScheduleComment } from '@/lib/schedule-comments';

type View = 'week' | 'day';
type Period = 'Morning' | 'Afternoon' | 'Evening';
type ComposerState = { initialStartsAt: string; item: ScheduleItem | null };

function addDays(key: string, amount: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function todayKey(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function formatDate(key: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`));
}

function dayNumber(key: string, tripStart: string | null, tripEnd: string | null) {
  if (!tripStart || key < tripStart || (tripEnd && key > tripEnd)) return null;
  return Math.floor((Date.parse(`${key}T00:00:00Z`) - Date.parse(`${tripStart}T00:00:00Z`)) / 86400000) + 1;
}

function periodFor(item: ScheduleItem): Period {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: item.timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date(item.startsAt)));
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function timeRange(item: ScheduleItem) {
  const start = formatScheduleTime(item.startsAt, item.timezone);
  return item.endsAt ? `${start} – ${formatScheduleTime(item.endsAt, item.timezone)}` : start;
}

function eventPresentation(item: ScheduleItem) {
  const value = `${item.title} ${item.type} ${item.types.join(' ')}`.toLowerCase();
  if (/airport|flight|plane/.test(value)) return { Icon: Plane, tone: 'blue' };
  if (/hotel|check-in|accommodation|stay/.test(value)) return { Icon: BedDouble, tone: 'pink' };
  if (/dinner|lunch|breakfast|food|restaurant/.test(value)) return { Icon: UtensilsCrossed, tone: 'orange' };
  if (/market|shop|store/.test(value)) return { Icon: ShoppingBag, tone: 'violet' };
  if (/temple|shrine|museum|castle|sight/.test(value)) return { Icon: Landmark, tone: 'green' };
  if (/cafe|coffee|noodle/.test(value)) return { Icon: Soup, tone: 'orange' };
  return { Icon: Sparkles, tone: 'blue' };
}

function AgendaCard({ item, onOpen }: { item: ScheduleItem; onOpen: () => void }) {
  const { Icon, tone } = eventPresentation(item);
  const place = item.detail?.split(/[·,]/)[0]?.trim();
  return <button className="new-event-card" type="button" onClick={onOpen}>
    <span className={`new-event-card__icon is-${tone}`}><Icon size={22} strokeWidth={2.2} /></span>
    <span className="new-event-card__content"><span className="new-event-card__title">{item.title}</span><span className="new-event-card__meta">{timeRange(item)}{place ? ` · ${place}` : ''}</span></span>
  </button>;
}

export function ScheduleBrowser({ groups, timezone, tripStart, tripEnd, preview = false, openComposerOnLoad = false }: { groups: ScheduleGroup[]; timezone: string; tripStart: string | null; tripEnd: string | null; preview?: boolean; openComposerOnLoad?: boolean }) {
  const current = todayKey(timezone);
  const firstDate = tripStart ?? groups[0]?.key ?? current;
  const initialDate = tripStart && tripEnd && current >= tripStart && current <= tripEnd ? current : firstDate;
  const [view, setView] = useState<View>('week');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weekStart, setWeekStart] = useState(firstDate);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [previewItems, setPreviewItems] = useState<ScheduleItem[]>(() => groups.flatMap((group) => group.items));
  const dayRefs = useRef(new Map<string, HTMLElement>());
  const stickyRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const dateStripSwiped = useRef(false);
  const routeComposerOpened = useRef(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const allItems = useMemo(() => preview ? previewItems : groups.flatMap((group) => group.items), [groups, preview, previewItems]);
  const byDate = useMemo(() => {
    const result = new Map<string, ScheduleItem[]>();
    for (const item of allItems) {
      const key = dateKey(item.startsAt, item.timezone);
      result.set(key, [...(result.get(key) ?? []), item].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
    }
    return result;
  }, [allItems]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const periods: Period[] = ['Morning', 'Afternoon', 'Evening'];

  useEffect(() => {
    if (!openComposerOnLoad || routeComposerOpened.current) return;
    routeComposerOpened.current = true;
    setComposer({ initialStartsAt: `${initialDate}T09:00`, item: null });
    window.history.replaceState(window.history.state, '', '/schedule');
  }, [initialDate, openComposerOnLoad]);

  const scrollToDay = (key: string, behavior: ScrollBehavior = 'smooth') => {
    const card = dayRefs.current.get(key);
    const sticky = stickyRef.current;
    if (!card || !sticky) return;
    const anchor = sticky.offsetHeight + 16;
    const top = Math.max(0, window.scrollY + card.getBoundingClientRect().top - anchor);
    window.scrollTo({ top, behavior });
  };

  useEffect(() => {
    if (view !== 'week') return;

    let frame = 0;
    const syncDateToFirstCard = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const boundary = (stickyRef.current?.getBoundingClientRect().bottom ?? 0) + 1;
        const firstVisibleDate = weekDates.find((key) => {
          const card = dayRefs.current.get(key);
          return card ? card.getBoundingClientRect().bottom > boundary : false;
        });
        const nextDate = firstVisibleDate ?? weekDates.at(-1);
        if (nextDate) setSelectedDate((currentDate) => currentDate === nextDate ? currentDate : nextDate);
      });
    };

    syncDateToFirstCard();
    window.addEventListener('scroll', syncDateToFirstCard, { passive: true });
    window.addEventListener('resize', syncDateToFirstCard);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', syncDateToFirstCard);
      window.removeEventListener('resize', syncDateToFirstCard);
    };
  }, [view, weekDates]);

  const openDay = (key: string) => { setSelectedDate(key); setView('day'); };
  const moveWeek = (amount: number) => {
    const next = addDays(weekStart, amount * 7);
    setWeekStart(next);
    setSelectedDate(next);
    window.setTimeout(() => scrollToDay(next), 40);
  };
  const selectDate = (key: string) => {
    if (dateStripSwiped.current) { dateStripSwiped.current = false; return; }
    setSelectedDate(key);
    if (view === 'week') requestAnimationFrame(() => scrollToDay(key));
  };
  const addEvent = (hour = '09:00') => { setSelectedItem(null); setComposer({ initialStartsAt: `${selectedDate}T${hour}`, item: null }); };
  const savePreviewEvent = ({ item, title, startsAt, endsAt, city, notes, mapsUrl, websiteUrl }: PreviewEventInput) => {
    if (item) {
      setPreviewItems((currentItems) => currentItems.map((candidate) => candidate.id === item.id && candidate.source === item.source
        ? { ...candidate, title, startsAt, endsAt, detail: city || null, activity: candidate.activity ? { ...candidate.activity, title, startsAt, endsAt, city: city || null, notes: notes || null, mapsUrl: mapsUrl || null, websiteUrl: websiteUrl || null } : candidate.activity }
        : candidate));
    } else {
      const id = `preview-${Date.now()}`;
      const created: ScheduleItem = {
        id, source: 'activity', title, startsAt, endsAt, type: 'Activity', types: ['Activity'], detail: city || null,
        timezone, imageUrl: null, idea: null, booking: null, href: '/schedule',
        activity: { id, tripId: 'preview', title, country: null, city: city || null, neighborhood: null, startsAt, endsAt, imageUrl: null, externalImageUrl: null, coverPath: null, notes: notes || null, mapsUrl: mapsUrl || null, locationAddress: null, latitude: null, longitude: null, websiteUrl: websiteUrl || null, createdBy: 'preview', createdAt: new Date().toISOString() }, comments: [],
      };
      setPreviewItems((currentItems) => [...currentItems, created].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
    }
    setSelectedDate(dateKey(startsAt, timezone));
  };

  const updatePreviewItem = (item: ScheduleItem, update: InlineEventUpdate) => {
    const updated: ScheduleItem = { ...item, title: update.title, startsAt: update.startsAt, endsAt: update.endsAt, detail: update.city || null, activity: item.activity ? { ...item.activity, title: update.title, startsAt: update.startsAt, endsAt: update.endsAt, city: update.city || null, notes: update.notes || null, mapsUrl: update.mapsUrl || null, websiteUrl: update.websiteUrl || null } : item.activity };
    setPreviewItems((items) => items.map((candidate) => candidate.id === item.id && candidate.source === item.source ? updated : candidate));
    setSelectedItem(updated);
  };

  const updatePreviewComments = (item: ScheduleItem, comments: ScheduleComment[]) => {
    const updated = { ...item, comments };
    setPreviewItems((items) => items.map((candidate) => candidate.id === item.id && candidate.source === item.source ? updated : candidate));
    setSelectedItem(updated);
  };

  const removeItem = async (item: ScheduleItem) => {
    if (preview) {
      setPreviewItems((items) => items.filter((candidate) => candidate.id !== item.id || candidate.source !== item.source));
      if (selectedItem?.id === item.id && selectedItem.source === item.source) setSelectedItem(null);
      return;
    }
    const data = new FormData(); data.set('itemId', item.id); data.set('source', item.source);
    await new Promise<void>((resolve) => startTransition(async () => { const result = await deleteScheduleItem(data); if (!result.error) { if (selectedItem?.id === item.id && selectedItem.source === item.source) setSelectedItem(null); router.refresh(); } resolve(); }));
  };

  const agendaRow = (item: ScheduleItem) => <SwipeReveal key={`${item.source}-${item.id}`} label={item.title} onDelete={() => removeItem(item)}><AgendaCard item={item} onOpen={() => setSelectedItem(item)} /></SwipeReveal>;

  return <div className="new-app">
    <header className="new-app-header">
      <p className="new-trip-range">{tripStart && tripEnd ? `${formatDate(tripStart, { month: 'short', day: 'numeric' })} – ${formatDate(tripEnd, { month: 'short', day: 'numeric' })}` : 'Trip dates'}{preview && <span className="new-preview-label">Preview</span>}</p>
      <h1 className="new-trip-title">Your trip to Korea &amp; Japan</h1>
    </header>

    <div className="new-calendar-sticky" ref={stickyRef}>
      <div className="new-calendar-heading">
        <div className="new-segmented" aria-label="Calendar view"><button className={view === 'week' ? 'is-active' : ''} onClick={() => setView('week')} type="button">Week</button><button className={view === 'day' ? 'is-active' : ''} onClick={() => setView('day')} type="button">Day</button></div>
      </div>

      <nav
        className="new-date-strip"
        aria-label={`${formatDate(weekStart, { month: 'short', day: 'numeric' })} to ${formatDate(addDays(weekStart, 6), { month: 'short', day: 'numeric' })}`}
        onPointerDown={(event) => { swipeStartX.current = event.clientX; dateStripSwiped.current = false; }}
        onPointerUp={(event) => { if (swipeStartX.current === null) return; const distance = event.clientX - swipeStartX.current; swipeStartX.current = null; if (Math.abs(distance) > 48) { dateStripSwiped.current = true; moveWeek(distance < 0 ? 1 : -1); window.setTimeout(() => { dateStripSwiped.current = false; }, 0); } }}
        onPointerCancel={() => { swipeStartX.current = null; }}
      >{weekDates.map((key) => <button className={`${key === selectedDate ? 'is-active' : ''}${key === current ? ' is-today' : ''}`} type="button" onClick={() => selectDate(key)} key={key}><span>{formatDate(key, { weekday: 'narrow' })}</span><strong>{formatDate(key, { day: 'numeric' })}</strong></button>)}</nav>
    </div>

    {view === 'week' ? <div className="new-week-list">{weekDates.map((key) => {
      const items = byDate.get(key) ?? [];
      const number = dayNumber(key, tripStart, tripEnd);
      if (!number) return null;
      return <section className="new-week-day" ref={(node) => { if (node) dayRefs.current.set(key, node); else dayRefs.current.delete(key); }} key={key}>
        <button className="new-week-day__header" type="button" onClick={() => openDay(key)}><span><small>Day {number}</small><strong>{formatDate(key, { weekday: 'long' })}</strong></span><span>{formatDate(key, { month: 'short', day: 'numeric' })}</span></button>
        {items.length ? <div className="new-week-day__events">{items.map(agendaRow)}</div> : <button className="new-empty-row" type="button" onClick={() => openDay(key)}>Nothing planned yet</button>}
      </section>;
    })}</div> : <div className="new-day-view">
      <div className="new-day-title"><span><small>Day {dayNumber(selectedDate, tripStart, tripEnd) ?? '—'}</small><strong>{formatDate(selectedDate, { weekday: 'long' })}</strong></span><span>{formatDate(selectedDate, { month: 'short', day: 'numeric' })}</span></div>
      <div className="new-day-agenda">{periods.map((period) => {
        const items = (byDate.get(selectedDate) ?? []).filter((item) => periodFor(item) === period);
        const hour = period === 'Morning' ? '09:00' : period === 'Afternoon' ? '13:00' : '18:00';
        const PeriodIcon = period === 'Morning' ? Sunrise : period === 'Afternoon' ? Sun : Moon;
        return <section className="new-period" key={period}><div className="new-period__label" aria-label={period}><PeriodIcon aria-hidden="true" size={24} strokeWidth={1.8} /><span /></div><div className="new-period__body">{items.map(agendaRow)}{items.length === 0 && <button className="new-empty-row" type="button" onClick={() => addEvent(hour)}><Clock3 size={15} />Open time</button>}</div></section>;
      })}</div>
    </div>}

    <NewBottomNav active="schedule" addLabel="Add event" onAdd={() => addEvent()} />

    {selectedItem && <EventSheet item={selectedItem} preview={preview} onPreviewSave={(update) => updatePreviewItem(selectedItem, update)} onPreviewComments={(comments) => updatePreviewComments(selectedItem, comments)} onClose={() => setSelectedItem(null)} />}
    {composer && <EventComposer key={`${composer.item?.source ?? 'new'}-${composer.item?.id ?? composer.initialStartsAt}`} initialStartsAt={composer.initialStartsAt} item={composer.item} items={allItems} timezone={timezone} preview={preview} onPreviewSave={savePreviewEvent} onClose={() => setComposer(null)} />}
  </div>;
}

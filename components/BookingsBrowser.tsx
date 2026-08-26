'use client';

import { useMemo, useRef, useState } from 'react';
import { Plus, SlidersHorizontal, X } from 'lucide-react';
import { NewBookingTrigger } from '@/components/CreateRecordTriggers';
import { BookingCard } from '@/components/BookingCard';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/FormControls';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';
import type { Booking } from '@/lib/bookings';

type TimingFilter = 'all' | 'scheduled' | 'unscheduled';

export function BookingsBrowser({ bookings, timezone }: { bookings: Booking[]; timezone: string }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [provider, setProvider] = useState('all');
  const [timing, setTiming] = useState<TimingFilter>('all');
  const filterRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(filterRef);

  const types = useMemo(() => [...new Set(bookings.map((booking) => booking.type))].sort(), [bookings]);
  const providers = useMemo(
    () => [...new Set(bookings.map((booking) => booking.provider).filter((value): value is string => Boolean(value)))].sort(),
    [bookings],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = bookings.filter((booking) => {
    const haystack = [
      booking.title,
      booking.type,
      booking.cityRoute,
      booking.provider,
      booking.confirmation,
      booking.notes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesTiming =
      timing === 'all' || (timing === 'scheduled' ? Boolean(booking.startsAt) : !booking.startsAt);
    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (type === 'all' || booking.type === type) &&
      (provider === 'all' || booking.provider === provider) &&
      matchesTiming
    );
  });

  const hasFilters = type !== 'all' || provider !== 'all' || timing !== 'all';
  const isNarrowed = Boolean(query) || hasFilters;
  const clearFilters = () => {
    setType('all');
    setProvider('all');
    setTiming('all');
  };

  return (
    <>
      <div className="toolbar">
        <div>
          <h2 className="toolbar__title">Bookings</h2>
          <p className="toolbar__subtitle">Flights, stays, tickets, and reservations.</p>
        </div>

        <div className="toolbar__actions">
          <details ref={filterRef} className={`filter${hasFilters ? ' filter--active' : ''}`}>
            <summary aria-label="Filter bookings">
              <SlidersHorizontal size={18} aria-hidden="true" />
            </summary>
            <div className="filter__popover">
              <div className="filter__header">
                <strong>Filters</strong>
                {hasFilters && (
                  <button className="filter__clear" type="button" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
              </div>
              <label>
                Type
                <Select value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="all">All types</option>
                  {types.map((value) => (
                    <option value={value} key={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>
                  ))}
                </Select>
              </label>
              <label>
                Provider
                <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
                  <option value="all">All providers</option>
                  {providers.map((value) => (
                    <option value={value} key={value}>{value}</option>
                  ))}
                </Select>
              </label>
              <label>
                Schedule
                <Select value={timing} onChange={(event) => setTiming(event.target.value as TimingFilter)}>
                  <option value="all">Any schedule</option>
                  <option value="scheduled">Date added</option>
                  <option value="unscheduled">Date missing</option>
                </Select>
              </label>
              <div className="filter__count">Showing {filtered.length} of {bookings.length}</div>
            </div>
          </details>

          <div className="search">
            <SearchInput aria-label="Search bookings" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" />
            {query && (
              <button className="search__clear" type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <NewBookingTrigger className="btn btn--primary" timezone={timezone}>
            <Plus size={18} aria-hidden="true" />
            New
          </NewBookingTrigger>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map((booking) => <BookingCard booking={booking} key={booking.id} />)}
        </div>
      ) : (
        <section className="empty-state">
          <h3>{isNarrowed ? 'No matching bookings' : 'No bookings yet'}</h3>
          <p>
            {isNarrowed
              ? 'Try a broader search or clear your filters.'
              : 'Add a flight, hotel, train, restaurant, ticket, or experience.'}
          </p>
          {hasFilters ? (
            <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
          ) : (
            <NewBookingTrigger className="btn btn--primary" timezone={timezone}>Add your first booking</NewBookingTrigger>
          )}
        </section>
      )}
    </>
  );
}

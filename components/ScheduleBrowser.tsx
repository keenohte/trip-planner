'use client';

import { useState } from 'react';
import { BedDouble, CalendarDays, Clock3, ImageIcon, Plane, Plus, Ticket, TrainFront } from 'lucide-react';
import { IdeaModal } from '@/components/IdeaModal';
import { ScheduleActivityModal } from '@/components/ScheduleActivityModal';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardButton, CardMedia, CardTitle, ChipList } from '@/components/ui/Card';
import { formatScheduleTime } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';
import type { ScheduleGroup, ScheduleItem } from '@/lib/schedule';
import type { ScheduleActivity } from '@/lib/schedule-activities';

const bookingIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: BedDouble,
  train: TrainFront,
  ticket: Ticket,
};

function ItemMedia({ item }: { item: ScheduleItem }) {
  if (item.imageUrl) return <img src={item.imageUrl} alt="" />;
  const Icon = item.source === 'booking' ? bookingIcons[item.type] ?? CalendarDays : ImageIcon;
  return (
    <div className="card__placeholder">
      <Icon size={26} strokeWidth={1.6} aria-hidden="true" />
    </div>
  );
}

function ItemBody({ item }: { item: ScheduleItem }) {
  return (
    <CardBody>
      <CardTitle>{item.title}</CardTitle>
      {item.detail && <p className="schedule-card__detail">{item.detail}</p>}
      <ChipList items={item.types} max={3} />
      <div className="schedule-card__time">
        <Clock3 size={15} aria-hidden="true" />
        <span>
          {formatScheduleTime(item.startsAt, item.timezone)}
          {item.endsAt && <> → {formatScheduleTime(item.endsAt, item.timezone)}</>}
        </span>
      </div>
    </CardBody>
  );
}

function dayLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: timezone }).format(new Date(iso));
}

export function ScheduleBrowser({ groups, timezone }: { groups: ScheduleGroup[]; timezone: string }) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [activity, setActivity] = useState<ScheduleActivity | null | undefined>(undefined);

  const open = (item: ScheduleItem) => {
    if (item.idea) setIdea(item.idea);
    else if (item.activity) setActivity(item.activity);
  };

  return (
    <>
      <div className="toolbar">
        <div>
          <h2 className="toolbar__title">Schedule</h2>
          <p className="toolbar__subtitle">Confirmed plans, bookings, and activities by trip day.</p>
        </div>
        <div className="toolbar__actions">
          <Button variant="primary" onClick={() => setActivity(null)}>
            <Plus size={18} aria-hidden="true" />
            Add activity
          </Button>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="schedule">
          {groups.map((group) => (
            <section className="schedule-day" key={group.key}>
              <div className="schedule-day__rail">
                <span className="schedule-day__date">{dayLabel(group.startsAt, group.timezone)}</span>
                {group.dayNumber && (
                  <strong className="schedule-day__number" aria-label={`Trip day ${group.dayNumber}`}>
                    {group.dayNumber}
                  </strong>
                )}
                <i className="schedule-day__line" aria-hidden="true" />
              </div>

              <div className="schedule-day__cards">
                {group.items.map((item) =>
                  item.source === 'booking' ? (
                    <Card row key={`${item.source}-${item.id}`}>
                      <CardMedia aspect="square">
                        <ItemMedia item={item} />
                      </CardMedia>
                      <ItemBody item={item} />
                    </Card>
                  ) : (
                    <CardButton
                      row
                      key={`${item.source}-${item.id}`}
                      onClick={() => open(item)}
                      aria-label={`Open ${item.title}`}
                    >
                      <CardMedia aspect="square">
                        <ItemMedia item={item} />
                      </CardMedia>
                      <ItemBody item={item} />
                    </CardButton>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h3>Nothing scheduled yet</h3>
          <p>Add an activity, or give a confirmed idea or booking a start time.</p>
          <Button variant="primary" onClick={() => setActivity(null)}>
            Add activity
          </Button>
        </section>
      )}

      {idea && <IdeaModal idea={idea} timezone={timezone} onClose={() => setIdea(null)} />}
      {activity !== undefined && (
        <ScheduleActivityModal activity={activity ?? undefined} timezone={timezone} onClose={() => setActivity(undefined)} />
      )}
    </>
  );
}

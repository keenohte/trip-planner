'use client';

import { useState } from 'react';
import { CalendarClock, ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { deleteScheduleActivity } from '@/app/schedule/actions';
import { ModalFrame } from '@/components/ModalFrame';
import { ScheduleActivityForm } from '@/components/ScheduleActivityForm';
import { formatBookingDateTime } from '@/lib/datetime';
import { DismissibleDetails } from '@/components/DismissibleDetails';
import { Chip } from '@/components/ui/Card';
import type { ScheduleActivity } from '@/lib/schedule-activities';

export function ScheduleActivityModal({activity,timezone,onClose}:{activity?:ScheduleActivity;timezone:string;onClose:()=>void}){
  const [editing,setEditing]=useState(!activity);const location=activity?[activity.city,activity.country,activity.neighborhood].filter(Boolean).join(', '):'';
  return <ModalFrame className={editing?'is-editing':''} onClose={onClose} labelledBy={!editing?'activity-modal-title':undefined}>{editing?<ScheduleActivityForm activity={activity} timezone={timezone} onCancel={()=>activity?setEditing(false):onClose()} onSaved={onClose}/>:activity&&<><div className="idea-modal-media">{activity.imageUrl?<img src={activity.imageUrl} alt=""/>:<div className="idea-modal-placeholder"><ImageIcon size={34} strokeWidth={1.6} aria-hidden="true"/></div>}<div className="idea-modal-media-actions card__overlay"><DismissibleDetails className="idea-kebab" summary={<MoreHorizontal size={20} aria-hidden="true"/>} summaryLabel="Activity actions"><div><button type="button" onClick={()=>setEditing(true)}><Pencil size={14}/>Edit</button><form action={deleteScheduleActivity}><input type="hidden" name="activityId" value={activity.id}/><button className="danger-menu-action" type="submit"><Trash2 size={14}/>Delete</button></form></div></DismissibleDetails></div></div><div className="idea-modal-content"><h2 id="activity-modal-title">{activity.title}</h2>{location&&<p className="idea-modal-location">{location}</p>}<div className="chip-list"><Chip>Activity</Chip></div><div className="idea-modal-facts"><div><strong>Schedule</strong><span><CalendarClock size={14}/>{formatBookingDateTime(activity.startsAt,timezone)}{activity.endsAt&&<> → {formatBookingDateTime(activity.endsAt,timezone)}</>}</span></div>{activity.notes&&<div><strong>Notes</strong><span>{activity.notes}</span></div>}</div></div></>}</ModalFrame>;
}

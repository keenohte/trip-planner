'use client';

import { useState } from 'react';
import { BedDouble, CalendarDays, Clock3, ImageIcon, Plane, Plus, Ticket, TrainFront } from 'lucide-react';
import { IdeaModal } from '@/components/IdeaModal';
import { ScheduleActivityModal } from '@/components/ScheduleActivityModal';
import { formatScheduleTime } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';
import type { ScheduleGroup, ScheduleItem } from '@/lib/schedule';
import type { ScheduleActivity } from '@/lib/schedule-activities';

function BookingIcon({type}:{type:string}){const Icon=type==='flight'?Plane:type==='hotel'?BedDouble:type==='train'?TrainFront:type==='ticket'?Ticket:CalendarDays;return <Icon size={30} strokeWidth={1.5} aria-hidden="true"/>}
function dayLabel(iso:string,timezone:string){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:timezone}).format(new Date(iso));}

function Card({item,onOpen}:{item:ScheduleItem;onOpen:()=>void}){
  const content=<><div className="schedule-card-image">{item.imageUrl?<img src={item.imageUrl} alt=""/>:item.source==='booking'?<BookingIcon type={item.type}/>:<ImageIcon size={30} strokeWidth={1.6} aria-hidden="true"/>}</div><div className="schedule-card-content"><div><h3>{item.title}</h3>{item.detail&&<p>{item.detail}</p>}{item.types.length>0&&<div className="type-list">{item.types.slice(0,3).map((type)=><span className="type-chip" key={type}>{type}</span>)}</div>}</div><div className="schedule-card-time"><Clock3 size={15} aria-hidden="true"/><span>{formatScheduleTime(item.startsAt,item.timezone)}{item.endsAt&&<> → {formatScheduleTime(item.endsAt,item.timezone)}</>}</span></div></div></>;
  return item.source==='booking'?<article className="schedule-card booking-schedule-card">{content}</article>:<button className="schedule-card schedule-card-button" type="button" onClick={onOpen} aria-label={`Open ${item.title}`}>{content}</button>;
}

export function ScheduleBrowser({groups,timezone}:{groups:ScheduleGroup[];timezone:string}){
  const [idea,setIdea]=useState<Idea|null>(null);const [activity,setActivity]=useState<ScheduleActivity|null|undefined>(undefined);
  return <><div className="schedule-page-toolbar"><div><h2>Schedule</h2><p>Confirmed plans, bookings, and activities by trip day.</p></div><button className="new-idea-button" type="button" onClick={()=>setActivity(null)}><Plus size={18} aria-hidden="true"/>Add activity</button></div>
    {groups.length?<div className="schedule-days">{groups.map((group)=><section className="schedule-day" key={group.key}><div className="schedule-day-rail"><span>{dayLabel(group.startsAt,group.timezone)}</span>{group.dayNumber&&<strong aria-label={`Trip day ${group.dayNumber}`}>{group.dayNumber}</strong>}<i aria-hidden="true"/></div><div className="schedule-day-cards">{group.items.map((item)=><Card item={item} key={`${item.source}-${item.id}`} onOpen={()=>item.idea?setIdea(item.idea):item.activity?setActivity(item.activity):undefined}/>)}</div></section>)}</div>:<section className="empty-state"><h3>Nothing scheduled yet</h3><p>Add a custom activity or give a confirmed Idea or Booking a start time.</p><button className="primary-button" type="button" onClick={()=>setActivity(null)}>Add activity</button></section>}
    {idea&&<IdeaModal idea={idea} timezone={timezone} onClose={()=>setIdea(null)}/>} {activity!==undefined&&<ScheduleActivityModal activity={activity??undefined} timezone={timezone} onClose={()=>setActivity(undefined)}/>}</>;
}

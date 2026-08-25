import { createClient } from '@/lib/supabase/server';
import { dateKey } from '@/lib/datetime';
import { getIdeas, type Idea } from '@/lib/ideas';
import { getScheduleActivities, type ScheduleActivity } from '@/lib/schedule-activities';
import type { CurrentTrip } from '@/lib/trips';

export type ScheduleItem = {
  id: string;
  source: 'idea' | 'booking' | 'activity';
  title: string;
  startsAt: string;
  endsAt: string | null;
  type: string;
  types: string[];
  detail: string | null;
  timezone: string;
  imageUrl: string | null;
  idea: Idea | null;
  activity: ScheduleActivity | null;
  href: string;
};

export type ScheduleGroup = { key:string;startsAt:string;timezone:string;dayNumber:number|null;items:ScheduleItem[] };

function tripDayNumber(key:string,startDate:string|null,endDate:string|null){
  if(!startDate||key<startDate||(endDate&&key>endDate))return null;
  const start=Date.parse(`${startDate}T00:00:00Z`);const current=Date.parse(`${key}T00:00:00Z`);
  return Math.floor((current-start)/86400000)+1;
}

export async function getSchedule(trip:CurrentTrip):Promise<ScheduleGroup[]>{
  const supabase=await createClient();
  const [ideas,{data:bookings},activities]=await Promise.all([
    getIdeas(trip.id),
    supabase.from('bookings').select('id, title, type, starts_at, ends_at, timezone, city_route, provider').eq('trip_id',trip.id).not('starts_at','is',null),
    getScheduleActivities(trip.id),
  ]);
  const items:ScheduleItem[]=[
    ...ideas.filter((idea)=>idea.isConfirmed&&idea.scheduledAt).map((idea)=>({id:idea.id,source:'idea' as const,title:idea.title,startsAt:idea.scheduledAt!,endsAt:idea.scheduledEndAt,type:idea.types[0]??'Idea',types:idea.types,detail:[idea.city,idea.country].filter(Boolean).join(', ')||null,timezone:trip.timezone,imageUrl:idea.imageUrl,idea,activity:null,href:`/ideas/${idea.id}`})),
    ...(bookings??[]).map((booking)=>({id:booking.id,source:'booking' as const,title:booking.title,startsAt:booking.starts_at as string,endsAt:booking.ends_at,type:booking.type,types:[booking.type],detail:[booking.city_route,booking.provider].filter(Boolean).join(' · ')||null,timezone:booking.timezone||trip.timezone,imageUrl:null,idea:null,activity:null,href:`/bookings/${booking.id}`})),
    ...activities.map((activity)=>({id:activity.id,source:'activity' as const,title:activity.title,startsAt:activity.startsAt,endsAt:activity.endsAt,type:'Activity',types:['Activity'],detail:[activity.city,activity.country].filter(Boolean).join(', ')||null,timezone:trip.timezone,imageUrl:activity.imageUrl,idea:null,activity,href:'/schedule'})),
  ].sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
  const groups=new Map<string,ScheduleGroup>();
  for(const item of items){const key=dateKey(item.startsAt,item.timezone);const group=groups.get(key);if(group)group.items.push(item);else groups.set(key,{key,startsAt:item.startsAt,timezone:item.timezone,dayNumber:tripDayNumber(key,trip.startDate,trip.endDate),items:[item]});}
  return [...groups.values()];
}

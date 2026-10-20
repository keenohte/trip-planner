import { getBookings, type Booking } from '@/lib/bookings';
import { dateKey } from '@/lib/datetime';
import { getIdeas, type Idea } from '@/lib/ideas';
import { getScheduleActivities, type ScheduleActivity } from '@/lib/schedule-activities';
import type { CurrentTrip } from '@/lib/trips';
import { getScheduleComments, type ScheduleComment } from '@/lib/schedule-comments';

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
  booking: Booking | null;
  activity: ScheduleActivity | null;
  href: string;
  comments: ScheduleComment[];
};

export type ScheduleGroup = { key:string;startsAt:string;timezone:string;dayNumber:number|null;items:ScheduleItem[] };

function previewActivity(id: string, title: string, startsAt: string, endsAt: string, city: string, notes: string): ScheduleActivity {
  return { id, tripId:'00000000-0000-0000-0000-000000000000',title,country:'Japan',city,neighborhood:null,startsAt,endsAt,imageUrl:null,externalImageUrl:null,coverPath:null,notes,createdBy:'preview',createdAt:startsAt };
}

function previewItem(activity: ScheduleActivity): ScheduleItem {
  return { id:activity.id,source:'activity',title:activity.title,startsAt:activity.startsAt,endsAt:activity.endsAt,type:'Activity',types:['Activity'],detail:[activity.city,activity.country].filter(Boolean).join(', '),timezone:'Asia/Tokyo',imageUrl:null,idea:null,booking:null,activity,href:'/schedule',comments:[] };
}

function previewSchedule(): ScheduleGroup[] {
  const days = [
    ['2026-10-23', [
      previewActivity('00000000-0000-0000-0000-000000000101','Arrive at Haneda Airport','2026-10-23T00:30:00.000Z','2026-10-23T01:30:00.000Z','Tokyo','Pick up luggage and transit card.'),
      previewActivity('00000000-0000-0000-0000-000000000102','Hotel check-in','2026-10-23T06:00:00.000Z','2026-10-23T07:00:00.000Z','Tokyo','Leave bags if the room is not ready.'),
      previewActivity('00000000-0000-0000-0000-000000000103','Dinner in Shibuya','2026-10-23T10:30:00.000Z','2026-10-23T12:00:00.000Z','Tokyo','Keep the first night easy and nearby.'),
    ]],
    ['2026-10-24', [
      previewActivity('00000000-0000-0000-0000-000000000104','Meiji Shrine and Yoyogi Park','2026-10-24T00:00:00.000Z','2026-10-24T02:00:00.000Z','Tokyo','Start before the crowds.'),
      previewActivity('00000000-0000-0000-0000-000000000105','Lunch in Harajuku','2026-10-24T03:00:00.000Z','2026-10-24T04:00:00.000Z','Tokyo','Choose the restaurant that morning.'),
      previewActivity('00000000-0000-0000-0000-000000000106','Daikanyama and Nakameguro','2026-10-24T05:00:00.000Z','2026-10-24T08:00:00.000Z','Tokyo','Shops, coffee, and a walk along the river.'),
    ]],
    ['2026-10-25', [
      previewActivity('00000000-0000-0000-0000-000000000107','Tsukiji outer market','2026-10-25T00:00:00.000Z','2026-10-25T02:00:00.000Z','Tokyo','Breakfast and market stalls.'),
      previewActivity('00000000-0000-0000-0000-000000000108','TeamLab Borderless','2026-10-25T05:00:00.000Z','2026-10-25T07:00:00.000Z','Tokyo','Timed ticket.'),
    ]],
  ] as const;
  return days.map(([key, activities], index) => ({ key,startsAt:activities[0].startsAt,timezone:'Asia/Tokyo',dayNumber:index + 1,items:activities.map(previewItem) }));
}

function tripDayNumber(key:string,startDate:string|null,endDate:string|null){
  if(!startDate||key<startDate||(endDate&&key>endDate))return null;
  const start=Date.parse(`${startDate}T00:00:00Z`);const current=Date.parse(`${key}T00:00:00Z`);
  return Math.floor((current-start)/86400000)+1;
}

export async function getSchedule(trip:CurrentTrip):Promise<ScheduleGroup[]>{
  if (trip.preview) return previewSchedule();
  const [ideas,bookings,activities,comments]=await Promise.all([
    getIdeas(trip.id),
    getBookings(trip.id, trip.timezone),
    getScheduleActivities(trip.id),
    getScheduleComments(trip.id),
  ]);
  const items:ScheduleItem[]=[
    ...ideas.filter((idea)=>idea.isConfirmed&&idea.scheduledAt).map((idea)=>({id:idea.id,source:'idea' as const,title:idea.title,startsAt:idea.scheduledAt!,endsAt:idea.scheduledEndAt,type:idea.types[0]??'Idea',types:idea.types,detail:[idea.city,idea.country].filter(Boolean).join(', ')||null,timezone:trip.timezone,imageUrl:idea.imageUrl,idea,booking:null,activity:null,href:`/ideas/${idea.id}`,comments:comments.filter((comment)=>comment.source==='idea'&&comment.itemId===idea.id)})),
    ...bookings.filter((booking)=>booking.startsAt).map((booking)=>({id:booking.id,source:'booking' as const,title:booking.title,startsAt:booking.startsAt!,endsAt:booking.endsAt,type:booking.type,types:[booking.type],detail:[booking.cityRoute,booking.provider].filter(Boolean).join(' · ')||null,timezone:booking.timezone,imageUrl:null,idea:null,booking,activity:null,href:'/bookings',comments:comments.filter((comment)=>comment.source==='booking'&&comment.itemId===booking.id)})),
    ...activities.map((activity)=>({id:activity.id,source:'activity' as const,title:activity.title,startsAt:activity.startsAt,endsAt:activity.endsAt,type:'Activity',types:['Activity'],detail:[activity.city,activity.country].filter(Boolean).join(', ')||null,timezone:trip.timezone,imageUrl:activity.imageUrl,idea:null,booking:null,activity,href:'/schedule',comments:comments.filter((comment)=>comment.source==='activity'&&comment.itemId===activity.id)})),
  ].sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime());
  const groups=new Map<string,ScheduleGroup>();
  for(const item of items){const key=dateKey(item.startsAt,item.timezone);const group=groups.get(key);if(group)group.items.push(item);else groups.set(key,{key,startsAt:item.startsAt,timezone:item.timezone,dayNumber:tripDayNumber(key,trip.startDate,trip.endDate),items:[item]});}
  return [...groups.values()];
}

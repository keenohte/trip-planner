'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { localDateTimeToIso } from '@/lib/datetime';
import { createClient } from '@/lib/supabase/server';
import { getTripForMutation } from '@/lib/trips';

export type ActivityFormState = { error: string | null; saved?: boolean };
const allowedImageTypes = new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp'],['image/gif','gif']]);
const text = (data:FormData,name:string) => String(data.get(name) ?? '').trim();
const optional = (data:FormData,name:string) => text(data,name) || null;
const databaseError = (message?: string) => message?.includes("schedule_activities") && message.includes('schema cache')
  ? 'Custom activities need one database setup step. Run the latest schedule migration in Supabase, then refresh this page.'
  : message ?? 'Could not save the activity.';

function parseUrl(data: FormData) {
  const value = optional(data, 'imageUrl');
  if (!value) return { value:null,error:null };
  try { const url = new URL(value); if (!['http:','https:'].includes(url.protocol)) throw new Error(); return { value:url.toString(),error:null }; }
  catch { return { value:null,error:'Enter a valid image link.' }; }
}

function photo(data:FormData) { const value=data.get('photo'); return value instanceof File && value.size>0 ? value : null; }
async function upload(tripId:string,id:string,file:File) {
  const extension=allowedImageTypes.get(file.type); if (!extension) return {path:null,error:'Use a JPEG, PNG, WebP, or GIF image.'};
  if (file.size>10*1024*1024) return {path:null,error:'Images must be 10 MB or smaller.'};
  const path=`${tripId}/schedule-activities/${id}/${randomUUID()}.${extension}`;
  const supabase=await createClient();
  const {error}=await supabase.storage.from('idea-images').upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:false});
  return error ? {path:null,error:error.message} : {path,error:null};
}

function parse(data:FormData,timezone:string) {
  const title=text(data,'title'); if (!title || title.length>160) return {error:'Enter a title under 160 characters.'} as const;
  const startInput=text(data,'startsAt'); const endInput=text(data,'endsAt');
  const startsAt=startInput ? localDateTimeToIso(startInput,timezone) : null; const endsAt=endInput ? localDateTimeToIso(endInput,timezone) : null;
  if (!startsAt) return {error:`Choose a valid start date and time in ${timezone}.`} as const;
  if (!endsAt) return {error:`Choose a valid end date and time in ${timezone}.`} as const;
  if (endsAt<=startsAt) return {error:'The end time must be after the start time.'} as const;
  const imageUrl=parseUrl(data); if (imageUrl.error) return {error:imageUrl.error} as const;
  return {error:null,values:{title,country:optional(data,'country'),city:optional(data,'city'),neighborhood:optional(data,'neighborhood'),starts_at:startsAt,ends_at:endsAt,image_url:imageUrl.value,notes:optional(data,'notes')}} as const;
}

function refresh(id?:string){ revalidatePath('/');revalidatePath('/schedule');if(id)revalidatePath(`/schedule/${id}`); }

export async function createScheduleActivity(_state:ActivityFormState,data:FormData):Promise<ActivityFormState>{
  const trip=await getTripForMutation(); if(!trip)return{error:'Could not reach the server. Please try again.'};
  const input=parse(data,trip.timezone);if(input.error||!input.values)return{error:input.error};
  const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)return{error:'Your session expired. Sign in again.'};
  const {data:created,error}=await supabase.from('schedule_activities').insert({...input.values,trip_id:trip.id,created_by:auth.user.id}).select('id').single();
  if(error||!created)return{error:databaseError(error?.message)};
  const file=photo(data);if(file){const result=await upload(trip.id,created.id,file);if(result.error||!result.path){await supabase.from('schedule_activities').delete().eq('id',created.id);return{error:result.error};}const {error:coverError}=await supabase.from('schedule_activities').update({cover_url:result.path,image_url:null}).eq('id',created.id);if(coverError)return{error:coverError.message};}
  refresh(created.id);return{error:null,saved:true};
}

export async function updateScheduleActivity(_state:ActivityFormState,data:FormData):Promise<ActivityFormState>{
  const trip=await getTripForMutation();const id=text(data,'activityId');if(!trip)return{error:'Could not reach the server. Please try again.'};if(!/^[0-9a-f-]{36}$/i.test(id))return{error:'Activity not found.'};
  const input=parse(data,trip.timezone);if(input.error||!input.values)return{error:input.error};
  const supabase=await createClient();const {data:existing,error:findError}=await supabase.from('schedule_activities').select('cover_url').eq('id',id).eq('trip_id',trip.id).maybeSingle();if(findError)return{error:databaseError(findError.message)};if(!existing)return{error:'Activity not found.'};
  const file=photo(data);let path:string|null=null;if(file){const result=await upload(trip.id,id,file);if(result.error||!result.path)return{error:result.error};path=result.path;}
  const {error}=await supabase.from('schedule_activities').update({...input.values,...(path?{cover_url:path,image_url:null}:{})}).eq('id',id).eq('trip_id',trip.id);if(error)return{error:databaseError(error.message)};
  if(path&&existing.cover_url)await supabase.storage.from('idea-images').remove([existing.cover_url]);refresh(id);return{error:null,saved:true};
}

export async function deleteScheduleActivity(data:FormData){const trip=await getTripForMutation();const id=text(data,'activityId');if(!trip||!/^[0-9a-f-]{36}$/i.test(id))redirect('/schedule');const supabase=await createClient();const {data:existing}=await supabase.from('schedule_activities').select('cover_url').eq('id',id).eq('trip_id',trip.id).maybeSingle();await supabase.from('schedule_activities').delete().eq('id',id).eq('trip_id',trip.id);if(existing?.cover_url)await supabase.storage.from('idea-images').remove([existing.cover_url]);refresh(id);redirect('/schedule');}

export async function updateScheduleItem(_state:ActivityFormState,data:FormData):Promise<ActivityFormState>{
  const trip=await getTripForMutation();
  const id=text(data,'itemId');
  const source=text(data,'source');
  if(!trip)return{error:'Could not reach the server. Please try again.'};
  if(!/^[0-9a-f-]{36}$/i.test(id)||!['activity','booking','idea'].includes(source))return{error:'Event not found.'};
  const input=parse(data,trip.timezone);
  if(input.error||!input.values)return{error:input.error};
  const {title,city,starts_at,ends_at,notes}=input.values;
  const supabase=await createClient();
  const table=source==='activity'?'schedule_activities':source==='booking'?'bookings':'ideas';
  const values=source==='activity'
    ? {title,city,starts_at,ends_at,notes}
    : source==='booking'
      ? {title,city_route:city,starts_at,ends_at,notes}
      : {title,city,scheduled_at:starts_at,scheduled_end_at:ends_at,notes};
  const {error}=await supabase.from(table).update(values).eq('id',id).eq('trip_id',trip.id);
  if(error)return{error:databaseError(error.message)};
  refresh(id);return{error:null,saved:true};
}

export async function deleteScheduleItem(data:FormData):Promise<ActivityFormState>{
  const trip=await getTripForMutation();
  const id=text(data,'itemId');
  const source=text(data,'source');
  if(!trip)return{error:'Could not reach the server. Please try again.'};
  if(!/^[0-9a-f-]{36}$/i.test(id)||!['activity','booking','idea'].includes(source))return{error:'Event not found.'};
  const supabase=await createClient();
  const table=source==='activity'?'schedule_activities':source==='booking'?'bookings':'ideas';
  const {error}=await supabase.from(table).delete().eq('id',id).eq('trip_id',trip.id);
  if(error)return{error:databaseError(error.message)};
  refresh(id);return{error:null,saved:true};
}

export async function createScheduleComment(data:FormData):Promise<{error:string|null;comment?:{id:string;body:string;createdAt:string}}>{
  const trip=await getTripForMutation();
  const itemId=text(data,'itemId');
  const source=text(data,'source');
  const body=text(data,'body');
  if(!trip)return{error:'Could not reach the server. Please try again.'};
  if(!/^[0-9a-f-]{36}$/i.test(itemId)||!['activity','booking','idea'].includes(source))return{error:'Event not found.'};
  if(!body||body.length>1000)return{error:'Enter a comment under 1,000 characters.'};
  const supabase=await createClient();
  const {data:auth}=await supabase.auth.getUser();
  if(!auth.user)return{error:'Your session expired. Sign in again.'};
  const {data:created,error}=await supabase.from('schedule_comments').insert({trip_id:trip.id,item_id:itemId,source,body,created_by:auth.user.id}).select('id, body, created_at').single();
  if(error||!created)return{error:error?.message?.includes('schema cache')?'Comments need the latest database migration before they can be saved.':error?.message??'Could not add the comment.'};
  refresh(itemId);return{error:null,comment:{id:created.id,body:created.body,createdAt:created.created_at}};
}

export async function deleteScheduleComment(data:FormData):Promise<ActivityFormState>{
  const trip=await getTripForMutation();
  const commentId=text(data,'commentId');
  if(!trip)return{error:'Could not reach the server. Please try again.'};
  if(!/^[0-9a-f-]{36}$/i.test(commentId))return{error:'Comment not found.'};
  const supabase=await createClient();
  const {error}=await supabase.from('schedule_comments').delete().eq('id',commentId).eq('trip_id',trip.id);
  if(error)return{error:error.message};
  refresh();return{error:null,saved:true};
}

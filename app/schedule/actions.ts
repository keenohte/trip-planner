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
  if (endInput && !endsAt) return {error:`Choose a valid end date and time in ${timezone}.`} as const;
  if (endsAt && endsAt<startsAt) return {error:'The end time must be after the start time.'} as const;
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

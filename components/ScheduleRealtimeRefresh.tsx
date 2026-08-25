'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function ScheduleRealtimeRefresh({tripId}:{tripId:string}){const router=useRouter();useEffect(()=>{const supabase=createClient();const channel=supabase.channel(`trip-activities-${tripId}`).on('postgres_changes',{event:'*',schema:'public',table:'schedule_activities',filter:`trip_id=eq.${tripId}`},()=>router.refresh()).subscribe();return()=>{void supabase.removeChannel(channel)}},[router,tripId]);return null;}

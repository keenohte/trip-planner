'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { formatDateTimeInput } from '@/lib/datetime';
import type { ScheduleActivity } from '@/lib/schedule-activities';
import { createScheduleActivity, updateScheduleActivity, type ActivityFormState } from '@/app/schedule/actions';

const initialState: ActivityFormState = { error: null };

export function ScheduleActivityForm({ activity, timezone, onCancel, onSaved }: { activity?: ScheduleActivity; timezone: string; onCancel: () => void; onSaved: () => void }) {
  const [state, action, pending] = useActionState(activity ? updateScheduleActivity : createScheduleActivity, initialState);
  const [fileName, setFileName] = useState('');
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved(); } }, [onSaved, router, state.saved]);

  return <ModalFormLayout action={action} error={state.error} pending={pending} onCancel={onCancel} className="activity-form">
    {activity && <input type="hidden" name="activityId" value={activity.id} />}
    <div className="form-field"><label htmlFor="activity-title">Title <span aria-hidden="true">*</span></label><input id="activity-title" name="title" required maxLength={160} defaultValue={activity?.title ?? ''} placeholder="Morning walk" /></div>
    <div className="form-columns form-columns-three"><div className="form-field"><label htmlFor="activity-country">Country</label><input id="activity-country" name="country" defaultValue={activity?.country ?? ''} placeholder="Japan" /></div><div className="form-field"><label htmlFor="activity-city">City</label><input id="activity-city" name="city" defaultValue={activity?.city ?? ''} placeholder="Kyoto" /></div><div className="form-field"><label htmlFor="activity-neighborhood">Neighborhood</label><input id="activity-neighborhood" name="neighborhood" defaultValue={activity?.neighborhood ?? ''} placeholder="Gion" /></div></div>
    <div className="form-columns date-time-fields"><div className="form-field"><label htmlFor="activity-start">Start date <span aria-hidden="true">*</span></label><DateTimePicker id="activity-start" name="startsAt" initialValue={formatDateTimeInput(activity?.startsAt ?? null, timezone)} /></div><div className="form-field"><label htmlFor="activity-end">End date</label><DateTimePicker id="activity-end" name="endsAt" initialValue={formatDateTimeInput(activity?.endsAt ?? null, timezone)} /></div></div>
    <small className="timezone-field-note">Times use {timezone}.</small>
    <div className="form-field"><label htmlFor="activity-image">Image</label><div className="image-upload-control"><input id="activity-image" name="imageUrl" type="url" defaultValue={activity?.externalImageUrl ?? ''} placeholder={fileName || (activity?.coverPath ? 'Current uploaded image' : 'Image link…')} /><label className="image-upload-button" htmlFor="activity-photo">Upload file</label><input id="activity-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /></div>{fileName && <small>{fileName} will be uploaded when you save.</small>}</div>
    <div className="form-field"><label htmlFor="activity-notes">Notes</label><textarea id="activity-notes" name="notes" rows={5} defaultValue={activity?.notes ?? ''} placeholder="Anything useful for the day…" /></div>
  </ModalFormLayout>;
}

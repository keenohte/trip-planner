'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { Field, ImageInput, Input, Textarea } from '@/components/ui/FormControls';
import { formatDateTimeInput } from '@/lib/datetime';
import type { ScheduleActivity } from '@/lib/schedule-activities';
import { createScheduleActivity, updateScheduleActivity, type ActivityFormState } from '@/app/schedule/actions';

const initialState: ActivityFormState = { error: null };

export function ScheduleActivityForm({ activity, timezone, onCancel, onSaved }: { activity?: ScheduleActivity; timezone: string; onCancel: () => void; onSaved: () => void }) {
  const [state, action, pending] = useActionState(activity ? updateScheduleActivity : createScheduleActivity, initialState);
  const [fileName, setFileName] = useState('');
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved(); } }, [onSaved, router, state.saved]);

  return <ModalFormLayout action={action} error={state.error} pending={pending} onCancel={onCancel} className="activity-form" title={activity ? 'Edit activity' : 'Add activity'}>
    {activity && <input type="hidden" name="activityId" value={activity.id} />}
    <Field htmlFor="activity-title" label="Title" required><Input id="activity-title" name="title" required maxLength={160} defaultValue={activity?.title ?? ''} placeholder="Morning walk" /></Field>
    <div className="form-columns form-columns-three"><Field htmlFor="activity-country" label="Country"><Input id="activity-country" name="country" defaultValue={activity?.country ?? ''} placeholder="Japan" /></Field><Field htmlFor="activity-city" label="City"><Input id="activity-city" name="city" defaultValue={activity?.city ?? ''} placeholder="Kyoto" /></Field><Field htmlFor="activity-neighborhood" label="Neighborhood"><Input id="activity-neighborhood" name="neighborhood" defaultValue={activity?.neighborhood ?? ''} placeholder="Gion" /></Field></div>
    <div className="form-columns date-time-fields"><Field htmlFor="activity-start" label="Start date" required><DateTimePicker id="activity-start" name="startsAt" initialValue={formatDateTimeInput(activity?.startsAt ?? null, timezone)} /></Field><Field htmlFor="activity-end" label="End date"><DateTimePicker id="activity-end" name="endsAt" initialValue={formatDateTimeInput(activity?.endsAt ?? null, timezone)} /></Field></div>
    <small className="timezone-field-note">Times use {timezone}.</small>
    <Field htmlFor="activity-image" label="Image" hint={fileName ? `${fileName} will be uploaded when you save.` : undefined}><ImageInput id="activity-image" name="imageUrl" fileId="activity-photo" defaultValue={activity?.externalImageUrl ?? ''} placeholder={fileName || (activity?.coverPath ? 'Current uploaded image' : 'Image link…')} accept="image/jpeg,image/png,image/webp,image/gif" onFileChange={setFileName} /></Field>
    <Field htmlFor="activity-notes" label="Notes"><Textarea id="activity-notes" name="notes" rows={5} defaultValue={activity?.notes ?? ''} placeholder="Anything useful for the day…" /></Field>
  </ModalFormLayout>;
}

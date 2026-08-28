'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { Field, ImageInput, Input, Select, Textarea } from '@/components/ui/FormControls';
import { categoryMeta, ideaCategories } from '@/lib/categories';
import { formatDateTimeInput } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';
import { createIdea, updateIdea, type IdeaFormState } from './actions';
import { lookupPlace } from './lookup';

const initialState: IdeaFormState = { error: null };

export function IdeaForm({ idea, timezone, presentation = 'page', onCancel, onSaved }: { idea?: Idea; timezone: string; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, formAction, isPending] = useActionState(idea ? updateIdea : createIdea, initialState);
  const [fileName, setFileName] = useState('');
  const [looking, setLooking] = useState(false);
  const [filled, setFilled] = useState<string[]>([]);
  const [lookupFailed, setLookupFailed] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const neighborhoodRef = useRef<HTMLInputElement>(null);

  /* Guards against the two ways a naive lookup misbehaves: repeating work
     for a value already resolved, and letting a slow earlier response
     overwrite a newer one. */
  const lastLookup = useRef('');
  const requestId = useRef(0);

  const runLookup = useCallback(async (value: string) => {
    const url = value.trim();
    if (!url || url === lastLookup.current) return;
    lastLookup.current = url;

    const id = ++requestId.current;
    setLooking(true);
    setLookupFailed(false);
    try {
      const place = await lookupPlace(url);
      if (id !== requestId.current) return; // a newer paste already won

      const applied: string[] = [];
      const apply = (ref: React.RefObject<HTMLInputElement | null>, value: string | null, label: string) => {
        if (!value || !ref.current || ref.current.value.trim()) return;
        ref.current.value = value;
        applied.push(label);
      };
      apply(titleRef, place.title, 'title');
      apply(countryRef, place.country, 'country');
      apply(cityRef, place.city, 'city');
      apply(neighborhoodRef, place.neighborhood, 'neighborhood');

      setFilled(applied);
      setLookupFailed(applied.length === 0);
    } catch {
      if (id === requestId.current) setLookupFailed(true);
    } finally {
      if (id === requestId.current) setLooking(false);
    }
  }, []);

  /* Paste rather than blur: nobody types a Maps URL, and firing on paste
     starts the request while attention is still on the field — about a
     second earlier than blur, and before a Save tap can race it. Blur
     stays as a fallback for a hand-edited value. */
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (pasted) setTimeout(() => runLookup(pasted), 0);
  };
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => runLookup(event.target.value);

  /* Status lives in the field as an icon rather than a line of copy
     below it — the message pushed every field down as it appeared and
     disappeared. `title` gives the explanation on hover; the sr-only
     span carries it to screen readers, which never see a title. */
  const lookupStatus = looking
    ? { icon: <Loader2 className="field-status__spin" size={16} aria-hidden="true" />, tone: 'busy', label: 'Looking up this link…' }
    : filled.length > 0
      ? { icon: <CircleCheck size={16} aria-hidden="true" />, tone: 'success', label: `Filled ${filled.join(', ')} from this link.` }
      : lookupFailed
        ? { icon: <CircleAlert size={16} aria-hidden="true" />, tone: 'error', label: "Couldn't read that link. Fill the fields below." }
        : null;

  const router = useRouter();
  const modal = presentation === 'modal';
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);

  const fields = <>
    {idea && <input type="hidden" name="ideaId" value={idea.id} />}

    <Field htmlFor="mapsUrl" label="Google Maps">
      <Input
        id="mapsUrl"
        name="mapsUrl"
        type="url"
        defaultValue={idea?.mapsUrl ?? ''}
        placeholder="https://maps.google.com/…"
        /* Always rendered so the reserved padding never changes width —
           otherwise a long URL shifts sideways as the icon appears. */
        trailingIcon={
          <span className="field-status" data-tone={lookupStatus?.tone} title={lookupStatus?.label}>
            {lookupStatus?.icon}
            {lookupStatus && <span className="sr-only">{lookupStatus.label}</span>}
          </span>
        }
        onPaste={handlePaste}
        onBlur={handleBlur}
      />
    </Field>

    <Field htmlFor="title" label="Title" required>
      <Input id="title" name="title" ref={titleRef} maxLength={160} defaultValue={idea?.title} placeholder="Fushimi Inari Taisha" />
    </Field>

    {/* One grid so the columns can REGROUP between breakpoints, not just
        stack: desktop is country/city/neighborhood then category/tags;
        mobile is country/city, neighborhood/category, then tags. */}
    <div className="form-grid">
      <Field span={2} htmlFor="country" label="Country">
        <Input id="country" name="country" ref={countryRef} defaultValue={idea?.country ?? ''} placeholder="Japan" />
      </Field>
      <Field span={2} htmlFor="city" label="City">
        <Input id="city" name="city" ref={cityRef} defaultValue={idea?.city ?? ''} placeholder="Kyoto" />
      </Field>
      <Field span={2} htmlFor="neighborhood" label="Neighborhood">
        <Input id="neighborhood" name="neighborhood" ref={neighborhoodRef} defaultValue={idea?.neighborhood ?? ''} placeholder="Fushimi" />
      </Field>
      <Field span={3} htmlFor="category" label="Category" required>
        <Select id="category" name="category" defaultValue={idea?.category ?? 'sight'}>
          {ideaCategories.map((value) => <option value={value} key={value}>{categoryMeta[value].label}</option>)}
        </Select>
      </Field>
      <Field span={3} htmlFor="tags" label="Tags">
        <Input id="tags" name="tags" defaultValue={idea?.tags.join(', ') ?? ''} placeholder="Sushi, counter seating" />
      </Field>
    </div>

    <div className="form-columns">
      <Field htmlFor="websiteUrl" label="Website"><Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={idea?.websiteUrl ?? ''} placeholder="https://…" /></Field>
      <Field htmlFor="socialUrl" label="Social"><Input id="socialUrl" name="socialUrl" type="url" defaultValue={idea?.socialUrl ?? ''} placeholder="https://…" /></Field>
    </div>

    <div className="form-columns date-time-fields">
      <Field htmlFor="scheduledAt" label="Start date"><DateTimePicker id="scheduledAt" name="scheduledAt" initialValue={formatDateTimeInput(idea?.scheduledAt ?? null, timezone)} /></Field>
      <Field htmlFor="scheduledEndAt" label="End date"><DateTimePicker id="scheduledEndAt" name="scheduledEndAt" initialValue={formatDateTimeInput(idea?.scheduledEndAt ?? null, timezone)} /></Field>
    </div>

    <Field htmlFor="imageUrl" label="Image" hint={fileName ? `${fileName} will be uploaded when you save.` : undefined}>
      <ImageInput id="imageUrl" name="imageUrl" fileId="photo" defaultValue={idea?.externalImageUrl ?? ''} placeholder={fileName || (idea?.coverPath ? 'Current uploaded image' : 'Image link…')} accept="image/jpeg,image/png,image/webp,image/gif" onFileChange={setFileName} />
    </Field>

    <Field htmlFor="notes" label="Notes">
      <Textarea id="notes" name="notes" rows={5} defaultValue={idea?.notes ?? ''} placeholder="What makes this worth considering?" />
    </Field>
  </>;

  if (modal) return <ModalFormLayout action={formAction} error={state.error} pending={isPending} onCancel={() => onCancel?.()} title={idea ? 'Edit idea' : 'Add idea'} subtitle="Fields will try to auto-fill from a Google Maps link.">{fields}</ModalFormLayout>;
  return <form className="idea-form" action={formAction}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={idea ? `/ideas/${idea.id}` : '/ideas'}>Cancel</a><button className="primary-button" disabled={isPending} type="submit">{isPending ? 'Saving…' : 'Save'}</button></div></form>;
}

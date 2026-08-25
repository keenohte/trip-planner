'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import type { WishlistItem } from '@/lib/wishlist';
import { wishlistKinds, wishlistPriorities } from '@/lib/wishlist-types';
import { createWishlistItem, updateWishlistItem, type WishlistFormState } from './actions';

const initial: WishlistFormState = { error: null };
const label = (value: string) => value.replace('_', ' ').replace(/^./, (letter) => letter.toUpperCase());

export function WishlistForm({ item, presentation = 'page', onCancel, onSaved }: { item?: WishlistItem; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(item ? updateWishlistItem : createWishlistItem, initial);
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);
  const fields = <>
    {item && <input type="hidden" name="itemId" value={item.id} />}
    <div className="form-field"><label htmlFor="wishlist-title">Title <span aria-hidden="true">*</span></label><input id="wishlist-title" name="title" required maxLength={160} defaultValue={item?.title ?? ''} placeholder="Matcha KitKats" /></div>
    <div className="form-columns"><div className="form-field"><label htmlFor="wishlist-kind">Kind</label><select id="wishlist-kind" name="kind" defaultValue={item?.kind ?? ''}><option value="">Not specified</option>{wishlistKinds.map((kind) => <option value={kind} key={kind}>{label(kind)}</option>)}</select></div><div className="form-field"><label htmlFor="wishlist-priority">Priority</label><select id="wishlist-priority" name="priority" defaultValue={item?.priority ?? ''}><option value="">Not specified</option>{wishlistPriorities.map((priority) => <option value={priority} key={priority}>{label(priority)}</option>)}</select></div></div>
    <div className="form-columns"><div className="form-field"><label htmlFor="wishlist-country">Country</label><input id="wishlist-country" name="country" defaultValue={item?.country ?? ''} placeholder="Japan" /></div><div className="form-field"><label htmlFor="wishlist-area">City or area</label><input id="wishlist-area" name="cityArea" defaultValue={item?.cityArea ?? ''} placeholder="Tokyo" /></div></div>
    <div className="form-field"><label htmlFor="wishlist-notes">Notes</label><textarea id="wishlist-notes" name="notes" rows={5} defaultValue={item?.notes ?? ''} placeholder="Sizes, shops, or anything else to remember…" /></div>
  </>;
  if (presentation === 'modal') return <ModalFormLayout action={action} error={state.error} pending={pending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form compact-form" action={action}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href="/wishlist">Cancel</a><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save'}</button></div></form>;
}

'use client';

import { useState } from 'react';
import { CalendarClock, ImageIcon, Link2, MapPin, MoreHorizontal, NotebookText, Pencil, Trash2 } from 'lucide-react';
import { IdeaForm } from '@/app/ideas/IdeaForm';
import { deleteIdea } from '@/app/ideas/actions';
import { GoogleMapEmbed } from '@/components/GoogleMapEmbed';
import { ModalFrame } from '@/components/ModalFrame';
import { MODAL_FORM_TITLE_ID } from '@/components/ModalFormLayout';
import { VoteControls } from '@/components/VoteControls';
import { DismissibleDetails } from '@/components/DismissibleDetails';
import { CategoryTagList } from '@/components/ui/Card';
import { DetailPanel, DetailRow } from '@/components/ui/DetailPanel';
import { formatBookingDateTime } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';

export function IdeaModal({ idea, timezone, onClose }: { idea: Idea; timezone: string; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const location = [idea.city, idea.country, idea.neighborhood].filter(Boolean).join(', ');
  const displayAddress = idea.locationAddress ?? location;
  const mapQuery = displayAddress || idea.title;
  const links = [['Website', idea.websiteUrl], ['Social', idea.socialUrl]].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return <ModalFrame className={editing ? 'is-editing' : ''} onClose={onClose} labelledBy={editing ? MODAL_FORM_TITLE_ID : 'idea-modal-title'}>
    {editing ? <IdeaForm idea={idea} timezone={timezone} presentation="modal" onCancel={() => setEditing(false)} onSaved={onClose} /> : <>
      <div className="idea-modal-media">
        {idea.imageUrl ? <img src={idea.imageUrl} alt="" /> : <div className="idea-modal-placeholder"><ImageIcon size={34} strokeWidth={1.6} aria-hidden="true" /></div>}
        <div className="idea-modal-media-actions card__overlay">
          <VoteControls ideaId={idea.id} viewerId={idea.viewerId} viewerTraveler={idea.viewerTraveler} currentVote={idea.currentVote} partnerVote={idea.partnerVote} />
          <DismissibleDetails className="idea-kebab" summary={<MoreHorizontal size={20} aria-hidden="true" />} summaryLabel="Idea actions"><div><button type="button" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden="true" />Edit</button><form action={deleteIdea}><input type="hidden" name="ideaId" value={idea.id} /><button className="danger-menu-action" type="submit"><Trash2 size={14} aria-hidden="true" />Delete</button></form></div></DismissibleDetails>
        </div>
      </div>
      <div className="idea-modal-content">
        <header className="idea-modal-summary">
          <h2 id="idea-modal-title">{idea.title}</h2>
          {(location || true) && <div className="idea-modal-summary-meta">
            {location && <p className="idea-modal-location">{location}</p>}
            <CategoryTagList category={idea.category} tags={idea.tags} max={4} />
          </div>}
        </header>
        {(idea.scheduledAt || idea.notes || links.length > 0 || (idea.mapsUrl && displayAddress)) && <DetailPanel>
          {idea.scheduledAt && <DetailRow icon={<CalendarClock aria-hidden="true" />} label="Schedule">
            {formatBookingDateTime(idea.scheduledAt, timezone)}{idea.scheduledEndAt && <> → {formatBookingDateTime(idea.scheduledEndAt, timezone)}</>}
          </DetailRow>}
          {idea.notes && <DetailRow icon={<NotebookText aria-hidden="true" />} label="Notes">{idea.notes}</DetailRow>}
          {links.length > 0 && <DetailRow icon={<Link2 aria-hidden="true" />} label="Links">
            <span className="detail-link-list">{links.map(([label, url], index) => <span key={label}>{index > 0 && <span aria-hidden="true">·</span>}<a href={url} target="_blank" rel="noreferrer">{label}</a></span>)}</span>
          </DetailRow>}
          {idea.mapsUrl && displayAddress && <DetailRow icon={<MapPin aria-hidden="true" />} label="Location">{displayAddress}</DetailRow>}
        </DetailPanel>}
        {idea.mapsUrl && <GoogleMapEmbed address={mapQuery} mapsUrl={idea.mapsUrl} />}
      </div>
    </>}
  </ModalFrame>;
}

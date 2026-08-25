'use client';

import { useState } from 'react';
import { CalendarClock, ExternalLink, ImageIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { IdeaForm } from '@/app/ideas/IdeaForm';
import { deleteIdea } from '@/app/ideas/actions';
import { GoogleMapEmbed } from '@/components/GoogleMapEmbed';
import { ModalFrame } from '@/components/ModalFrame';
import { VoteControls } from '@/components/VoteControls';
import { DismissibleDetails } from '@/components/DismissibleDetails';
import { formatBookingDateTime } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';

export function IdeaModal({ idea, timezone, onClose }: { idea: Idea; timezone: string; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const location = [idea.city, idea.country, idea.neighborhood].filter(Boolean).join(', ');
  const displayAddress = idea.locationAddress ?? location;
  const mapQuery = displayAddress || idea.title;
  const links = [['Website', idea.websiteUrl], ['Social', idea.socialUrl]].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return <ModalFrame className={editing ? 'is-editing' : ''} onClose={onClose} labelledBy={editing ? undefined : 'idea-modal-title'}>
    {editing ? <IdeaForm idea={idea} timezone={timezone} presentation="modal" onCancel={() => setEditing(false)} onSaved={onClose} /> : <>
      <div className="idea-modal-media">
        {idea.imageUrl ? <img src={idea.imageUrl} alt="" /> : <div className="idea-modal-placeholder"><ImageIcon size={34} strokeWidth={1.6} aria-hidden="true" /></div>}
        <div className="idea-modal-media-actions">
          <VoteControls ideaId={idea.id} viewerId={idea.viewerId} currentVote={idea.currentVote} partnerVote={idea.partnerVote} />
          <DismissibleDetails className="idea-kebab" summary={<MoreHorizontal size={20} aria-hidden="true" />} summaryLabel="Idea actions"><div><button type="button" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden="true" />Edit</button><form action={deleteIdea}><input type="hidden" name="ideaId" value={idea.id} /><button className="danger-menu-action" type="submit"><Trash2 size={14} aria-hidden="true" />Delete</button></form></div></DismissibleDetails>
        </div>
      </div>
      <div className="idea-modal-content">
        <h2 id="idea-modal-title">{idea.title}</h2>
        {location && <p className="idea-modal-location">{location}</p>}
        {idea.types.length > 0 && <div className="type-list">{idea.types.map((type) => <span className="type-chip" key={type}>{type}</span>)}</div>}
        {(idea.scheduledAt || idea.notes) && <div className="idea-modal-facts">
          {idea.scheduledAt && <div><strong>Schedule</strong><span><CalendarClock size={14} aria-hidden="true" />{formatBookingDateTime(idea.scheduledAt, timezone)}{idea.scheduledEndAt && <> → {formatBookingDateTime(idea.scheduledEndAt, timezone)}</>}</span></div>}
          {idea.notes && <div><strong>Notes</strong><span>{idea.notes}</span></div>}
        </div>}
        {idea.mapsUrl && <div className="idea-modal-location-section"><div><strong>Location</strong></div>{displayAddress && <span>{displayAddress}</span>}<GoogleMapEmbed address={mapQuery} mapsUrl={idea.mapsUrl} /></div>}
        {links.length > 0 && <div className="idea-modal-links">{links.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}>{label}<ExternalLink size={13} aria-hidden="true" /></a>)}</div>}
      </div>
    </>}
  </ModalFrame>;
}

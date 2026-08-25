'use client';

import { ImageIcon, MapPin } from 'lucide-react';
import { VoteControls } from '@/components/VoteControls';
import type { Idea } from '@/lib/ideas';

export function PersistedIdeaCard({ idea, onOpen }: { idea: Idea; onOpen: (idea: Idea) => void }) {
  const location = [idea.city, idea.country].filter(Boolean).join(', ');
  return (
    <article className="card idea-card">
      <button className="idea-card-open" type="button" onClick={() => onOpen(idea)} aria-label={`Open ${idea.title}`}>
        <div className="idea-card-media">{idea.imageUrl ? <img className="idea-photo" src={idea.imageUrl} alt="" /> : <div className="idea-photo-placeholder"><ImageIcon size={30} strokeWidth={1.7} aria-hidden="true" /></div>}</div>
        <div className="cardbody">
          <h3>{idea.title}</h3>
          {location && <div className="meta"><MapPin size={12} aria-hidden="true" />{location}</div>}
          {idea.types.length > 0 && <div className="type-list">{idea.types.slice(0, 2).map((type) => <span className="type-chip" key={type}>{type}</span>)}{idea.types.length > 2 && <span className="type-chip type-chip-more">+{idea.types.length - 2}</span>}</div>}
        </div>
      </button>
      <VoteControls ideaId={idea.id} viewerId={idea.viewerId} currentVote={idea.currentVote} partnerVote={idea.partnerVote} />
    </article>
  );
}

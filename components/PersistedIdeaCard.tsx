'use client';
import { ImageIcon, MapPin } from 'lucide-react';
import { Card, CardBody, CardMedia, CardMeta, CardTitle, ChipList } from '@/components/ui/Card';
import { VoteControls } from '@/components/VoteControls';
import type { Idea } from '@/lib/ideas';

export function PersistedIdeaCard({ idea, onOpen }: { idea: Idea; onOpen: (idea: Idea) => void }) {
  const location = [idea.city, idea.country].filter(Boolean).join(', ');
  return (
    <Card interactive>
      <button className="card__open" type="button" onClick={() => onOpen(idea)} aria-label={`Open ${idea.title}`}>
        <CardMedia aspect="square">
          {idea.imageUrl ? (
            <img src={idea.imageUrl} alt="" />
          ) : (
            <div className="card__placeholder">
              <ImageIcon size={30} strokeWidth={1.7} aria-hidden="true" />
            </div>
          )}
        </CardMedia>
        <CardBody>
          <CardTitle>{idea.title}</CardTitle>
          {location && (
            <CardMeta>
              <MapPin size={12} aria-hidden="true" />
              {location}
            </CardMeta>
          )}
          <ChipList items={idea.types} max={2} />
        </CardBody>
      </button>
      <div className="card__overlay">
        <VoteControls
          ideaId={idea.id}
          viewerId={idea.viewerId}
          viewerTraveler={idea.viewerTraveler}
          currentVote={idea.currentVote}
          partnerVote={idea.partnerVote}
        />
      </div>
    </Card>
  );
}

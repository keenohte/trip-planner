import type { ReactNode } from 'react';
import { categoryMeta, type ChipMeta, type IdeaCategory } from '@/lib/categories';

type CardProps = {
  children: ReactNode;
  /** Adds hover elevation. Use when the whole card is clickable. */
  interactive?: boolean;
  /** Horizontal media-beside-body layout, for schedule rows. */
  row?: boolean;
};

export function Card({ children, interactive, row }: CardProps) {
  const className = ['card', interactive && 'card--interactive', row && 'card--row']
    .filter(Boolean)
    .join(' ');
  return <article className={className}>{children}</article>;
}

export function CardMedia({ children, aspect = 'wide' }: { children: ReactNode; aspect?: 'wide' | 'square' }) {
  return <div className={`card__media card__media--${aspect}`}>{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="card__body">{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="card__title">{children}</h3>;
}

export function CardMeta({ children }: { children: ReactNode }) {
  return <div className="card__meta">{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="card__footer">{children}</div>;
}

/* `state` is the only thing that colours a chip. Categories stay neutral —
   see app/styles/components/chip.css for why. */
export function Chip({ children, state }: { children: string; state?: 'mutual' | 'love' }) {
  return (
    <span className="chip" data-state={state}>
      {children}
    </span>
  );
}

/* The primary category, with its icon. Icon rather than colour because
   colour is reserved for vote state — see chip.css. */
export function CategoryChip({ category }: { category: IdeaCategory }) {
  const { label, icon: Icon } = categoryMeta[category];
  return (
    <span className="chip chip--category">
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

/* Renders a booking or activity with the same shape as a category chip,
   so Schedule shows one vocabulary instead of three. */
export function SourceChip({ meta }: { meta: ChipMeta }) {
  const Icon = meta.icon;
  return (
    <div className="chip-list">
      <span className="chip chip--category">
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
        {meta.label}
      </span>
    </div>
  );
}

/* Category first, then tags. `max` counts tags only — the category is
   never dropped, since it is the one label every idea is guaranteed to
   have and the one the eye scans for. */
export function CategoryTagList({ category, tags, max = 1 }: { category: IdeaCategory; tags: string[]; max?: number }) {
  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;
  return (
    <div className="chip-list">
      <CategoryChip category={category} />
      {shown.map((tag) => <Chip key={tag}>{tag}</Chip>)}
      {extra > 0 && <span className="chip">+{extra}</span>}
    </div>
  );
}

export function ChipList({ items, max = 2 }: { items: string[]; max?: number }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div className="chip-list">
      {shown.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
      {extra > 0 && <span className="chip">+{extra}</span>}
    </div>
  );
}

/* Same surface as Card, rendered as a button. For cards where the whole
   surface is the click target and there is no separate media click area. */
export function CardButton({
  children,
  row,
  onClick,
  ...rest
}: {
  children: ReactNode;
  row?: boolean;
  onClick: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'onClick'>) {
  const className = ['card', 'card--interactive', row && 'card--row'].filter(Boolean).join(' ');
  return (
    <button className={className} type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

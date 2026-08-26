import type { ReactNode } from 'react';

export function DetailPanel({ children }: { children: ReactNode }) {
  return <dl className="detail-panel">{children}</dl>;
}

export function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <dt className="detail-row__label">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="detail-row__value">{children}</dd>
    </div>
  );
}

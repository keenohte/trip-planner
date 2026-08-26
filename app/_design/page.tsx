import { CalendarClock, Heart, ImageIcon, Link2, MapPin, NotebookText, Plus, Sparkles, UserRound } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardMedia, CardMeta, CardTitle, Chip, ChipList } from '@/components/ui/Card';
import { Field, Input, SearchInput, Select, Textarea } from '@/components/ui/FormControls';
import { DetailPanel, DetailRow } from '@/components/ui/DetailPanel';

/* Kitchen sink. Every component, every variant, every state, adjacent.
   Inconsistency is invisible when two buttons live on different screens
   and obvious when they are 40px apart.

   Dev only — returns 404 in a production build. View at /_design
   after `npm run dev`. */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{ display: 'grid', gap: 48, paddingBlock: 32 }}>
      <section>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <Button variant="primary">Save changes</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Delete idea</Button>
          <Button variant="primary" disabled>Saving…</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="primary" icon aria-label="Add idea"><Plus size={18} /></Button>
          <ButtonLink href="/ideas" variant="secondary">Link as button</ButtonLink>
        </div>
        <div style={{ marginTop: 12, maxWidth: 320 }}>
          <Button variant="primary" block>Full width (mobile)</Button>
        </div>
      </section>

      <section>
        <h2>Form controls</h2>
        <div style={{ display: 'grid', gap: 16, maxWidth: 560, marginTop: 16 }}>
          <Field htmlFor="design-title" label="Title" required>
            <Input id="design-title" placeholder="Fushimi Inari Taisha" />
          </Field>
          <Field htmlFor="design-type" label="Type" hint="Choose the closest match.">
            <Select id="design-type" defaultValue="sight">
              <option value="sight">Sight</option>
              <option value="food">Food</option>
            </Select>
          </Field>
          <Field htmlFor="design-notes" label="Notes">
            <Textarea id="design-notes" placeholder="Anything useful for both travelers…" />
          </Field>
          <SearchInput aria-label="Search example" placeholder="Search…" />
          <Field htmlFor="design-readonly" label="Read only">
            <Input id="design-readonly" readOnly value="Shared trip value" />
          </Field>
          <Field htmlFor="design-error" label="Error">
            <Input id="design-error" aria-invalid="true" defaultValue="Invalid value" />
          </Field>
        </div>
      </section>

      <section>
        <h2>Chips</h2>
        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
          Categories are neutral. Colour is reserved for state.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {['food', 'outdoors', 'museum', 'beach', 'nightlife'].map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          <Chip state="love">Loved</Chip>
          <Chip state="mutual">Both said yes</Chip>
        </div>
      </section>

      <section>
        <h2>Vote states — the app&rsquo;s subject</h2>
        <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
          Gold appears here and nowhere else. Shown on a photo-like backdrop, which is the only place hearts appear.
        </p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16 }}>
          {([
            ['none', <span key="n" className="vote"><span className="vote__heart"><Heart /></span></span>],
            ['theirs', <span key="t" className="vote"><span className="vote__avatar"><UserRound size={13} /></span><span className="vote__heart"><Heart /></span></span>],
            ['yours', <span key="y" className="vote"><span className="vote__heart" aria-pressed="true"><Heart /></span></span>],
            ['mutual', <span key="m" className="vote"><span className="vote__mutual"><Sparkles size={13} />Both</span><span className="vote__heart" aria-pressed="true"><Heart /></span></span>],
          ] as const).map(([label, node]) => (
            <div key={label} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', minHeight: 56, padding: '0 8px', background: 'linear-gradient(135deg, #8fa8b8, #d8d2c4)', borderRadius: 'var(--radius-control)' }}>{node}</div>
              <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{label}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Palette</h2>
        {([
          ['Surfaces', ['--canvas', '--surface', '--surface-subtle', '--surface-sunken', '--border-subtle', '--border-strong']],
          ['Text', ['--text-primary', '--text-muted']],
          ['Actions', ['--primary', '--primary-hover', '--primary-soft', '--danger']],
          ['State — the app\u2019s subject', ['--love', '--love-soft', '--mutual', '--mutual-ink', '--mutual-soft']],
          ['Travellers', ['--traveler-a-bg', '--traveler-a-fg', '--traveler-b-bg', '--traveler-b-fg']],
        ] as const).map(([group, vars]) => (
          <div key={group} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 8 }}>{group}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {vars.map((v) => (
                <div key={v} style={{ display: 'grid', gap: 6, fontSize: 'var(--text-xs)' }}>
                  <div style={{ width: 104, height: 56, background: `var(${v})`, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-control)' }} />
                  <code style={{ color: 'var(--text-muted)' }}>{v}</code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Cards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, marginTop: 16 }}>
          <Card interactive>
            <CardMedia aspect="wide">
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                <ImageIcon size={30} strokeWidth={1.7} />
              </div>
            </CardMedia>
            <CardBody>
              <CardTitle>Teamlab Planets</CardTitle>
              <CardMeta><MapPin size={12} />Koto, Tokyo</CardMeta>
              <ChipList items={['museum', 'art']} />
            </CardBody>
          </Card>

          <Card interactive>
            <CardMedia aspect="wide">
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                <ImageIcon size={30} strokeWidth={1.7} />
              </div>
            </CardMedia>
            <CardBody>
              <CardTitle>A title long enough to truncate cleanly</CardTitle>
              <CardMeta><MapPin size={12} />Somewhere with a long name, Japan</CardMeta>
              <ChipList items={['food', 'drinks', 'outdoors', 'view']} />
            </CardBody>
            <CardFooter>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Confirmed</span>
            </CardFooter>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>No media</CardTitle>
              <CardMeta>Bookings use this shape</CardMeta>
            </CardBody>
          </Card>
        </div>

        <h3 style={{ marginTop: 24 }}>Row variant (schedule)</h3>
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <Card row interactive>
            <CardMedia aspect="square">
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                <ImageIcon size={24} strokeWidth={1.6} />
              </div>
            </CardMedia>
            <CardBody>
              <CardTitle>Dinner at Narisawa</CardTitle>
              <CardMeta>19:00 → 21:30</CardMeta>
              <ChipList items={['food']} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section>
        <h2>Detail panel</h2>
        <div style={{ maxWidth: 702, marginTop: 16 }}>
          <DetailPanel>
            <DetailRow icon={<CalendarClock aria-hidden="true" />} label="Schedule">Oct 25, 9:00 AM → Oct 25, 11:00 AM</DetailRow>
            <DetailRow icon={<NotebookText aria-hidden="true" />} label="Notes">Arrive early to explore the surrounding neighborhood.</DetailRow>
            <DetailRow icon={<Link2 aria-hidden="true" />} label="Links"><a href="#detail-panel">Website</a></DetailRow>
            <DetailRow icon={<MapPin aria-hidden="true" />} label="Location">Gion, Kyoto, Japan</DetailRow>
          </DetailPanel>
        </div>
      </section>

      <section>
        <h2>Type scale</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {(['2xl', 'xl', 'lg', 'base', 'xs'] as const).map((s) => (
            <div key={s} style={{ fontSize: `var(--text-${s})` }}>
              {s} — Planning a trip together
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

-- Primary category + free tags for ideas.
--
-- `types` was a free-text array, so "Sight"/"sight"/"Sights" were three
-- different tags and nothing downstream could key off them. This adds a
-- required category drawn from the vocabulary actually in use, and keeps
-- everything else as tags.
--
-- Mapping rule: the FIRST recognised term wins, because array order is
-- what the person typed and carries intent — "Bar, Vinyl" is a vinyl bar,
-- "Vinyl, Bar" would be a record shop. A generic term is dropped only
-- when it names the category that won, so "Sight, Outdoors" keeps
-- `outdoors` as a tag.

create type public.idea_category as enum
  ('food', 'drink', 'shopping', 'sight', 'activity');

alter table public.ideas
  add column if not exists category public.idea_category,
  add column if not exists tags text[] not null default '{}';

-- Term -> category, transcribed from lib/categories.ts. Kept as a
-- temporary table so the backfill below is readable rather than a
-- 26-branch CASE expression.
create temporary table term_category (term text primary key, category public.idea_category) on commit drop;
insert into term_category (term, category) values
  ('food','food'),('restaurant','food'),('noodles','food'),('izakaya','food'),
  ('pizza','food'),('yakiniku','food'),('sushi','food'),('american','food'),
  ('drink','drink'),('bar','drink'),('cafe','drink'),('matcha','drink'),
  ('speakeasy','drink'),('wine','drink'),
  ('shopping','shopping'),('thrift','shopping'),('jewelry','shopping'),
  ('market','shopping'),('vinyl','shopping'),
  ('sight','sight'),('temple','sight'),('neighborhood','sight'),
  ('activity','activity'),('transit','activity'),
  -- outdoors rolls into activity; both survive as tags
  ('outdoors','activity'),('forest','activity');

with first_match as (
  select i.id,
         (select tc.category
            from unnest(i.types) with ordinality as t(term, position)
            join term_category tc on tc.term = lower(trim(t.term))
           order by t.position
           limit 1) as category
    from public.ideas i
)
update public.ideas i
   set category = coalesce(fm.category, 'activity')
  from first_match fm
 where fm.id = i.id;

-- Tags: every term except the one that merely restates the chosen category.
update public.ideas i
   set tags = coalesce((
     select array_agg(distinct lower(trim(t.term)))
       from unnest(i.types) as t(term)
      where trim(t.term) <> ''
        and not (
          lower(trim(t.term)) in ('food','restaurant','drink','shopping','sight','activity')
          and (select tc.category from term_category tc where tc.term = lower(trim(t.term))) = i.category
        )
   ), '{}');

alter table public.ideas alter column category set default 'activity';
alter table public.ideas alter column category set not null;

create index if not exists ideas_category_idx on public.ideas (trip_id, category);

comment on column public.ideas.category is 'Primary category. Required; drives icon, filter and map marker.';
comment on column public.ideas.tags is 'Free-text secondary labels. No controlled vocabulary by design.';

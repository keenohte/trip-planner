begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'traveler-a@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'traveler-b@example.test');

insert into public.trips (id, name, created_by)
values
  ('20000000-0000-0000-0000-000000000001', 'Trip A', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Trip B', '10000000-0000-0000-0000-000000000002');

insert into public.ideas (id, trip_id, title, created_by)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Trip A idea', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Trip B idea', '10000000-0000-0000-0000-000000000002');

insert into public.idea_votes (idea_id, user_id, vote)
values ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'love');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select id from public.trips order by id$$,
  $$values ('20000000-0000-0000-0000-000000000001'::uuid)$$,
  'a user can read their own trip'
);
select is_empty(
  $$select id from public.trips where id = '20000000-0000-0000-0000-000000000002'$$,
  'a user cannot read another trip'
);
select is_empty(
  $$select id from public.ideas where trip_id = '20000000-0000-0000-0000-000000000002'$$,
  'a user cannot read another trip''s ideas'
);
select throws_ok(
  $$insert into public.notes (trip_id, title, created_by) values ('20000000-0000-0000-0000-000000000002', 'No access', '10000000-0000-0000-0000-000000000001')$$,
  '42501',
  null,
  'a user cannot insert into another trip'
);
select lives_ok(
  $$insert into public.notes (trip_id, title, created_by) values ('20000000-0000-0000-0000-000000000001', 'Allowed', '10000000-0000-0000-0000-000000000001')$$,
  'a member can insert into their own trip'
);
select is_empty(
  $$update public.idea_votes set vote = 'pass' where user_id = '10000000-0000-0000-0000-000000000002' returning idea_id$$,
  'a user cannot update another user''s vote'
);
select throws_ok(
  $$insert into public.idea_votes (idea_id, user_id, vote) values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'love')$$,
  '42501',
  null,
  'a user cannot create a vote for someone else'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is_empty(
  $$select id from public.trips$$,
  'anonymous users cannot read trip data'
);

select * from finish();
rollback;

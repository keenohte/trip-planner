begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email)
values
  ('12000000-0000-0000-0000-000000000001', 'schedule-owner@example.test'),
  ('12000000-0000-0000-0000-000000000002', 'schedule-outsider@example.test');

insert into public.trips (id, name, created_by)
values
  ('22000000-0000-0000-0000-000000000001', 'Visible schedule', '12000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002', 'Private schedule', '12000000-0000-0000-0000-000000000002');

insert into public.schedule_activities (id, trip_id, title, starts_at, created_by)
values
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Owner activity', '2026-10-23 10:00:00+09', '12000000-0000-0000-0000-000000000001'),
  ('32000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'Hidden activity', '2026-10-24 10:00:00+09', '12000000-0000-0000-0000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select id from public.schedule_activities order by id$$,
  $$values ('32000000-0000-0000-0000-000000000001'::uuid)$$,
  'a member can read activities in their trip only'
);
select lives_ok(
  $$insert into public.schedule_activities (trip_id, title, starts_at, created_by) values ('22000000-0000-0000-0000-000000000001', 'New activity', '2026-10-25 10:00:00+09', '12000000-0000-0000-0000-000000000001')$$,
  'a member can create an activity in their trip'
);
select throws_ok(
  $$insert into public.schedule_activities (trip_id, title, starts_at, created_by) values ('22000000-0000-0000-0000-000000000002', 'Not allowed', '2026-10-25 10:00:00+09', '12000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'a member cannot create an activity in another trip'
);
select throws_ok(
  $$insert into public.schedule_activities (trip_id, title, starts_at, created_by) values ('22000000-0000-0000-0000-000000000001', 'Spoofed', '2026-10-25 10:00:00+09', '12000000-0000-0000-0000-000000000002')$$,
  '42501', null, 'a member cannot create an activity for another user'
);
select results_eq(
  $$update public.schedule_activities set title = 'Updated activity' where id = '32000000-0000-0000-0000-000000000001' returning title$$,
  $$values ('Updated activity'::text)$$,
  'a member can update an activity in their trip'
);
select throws_ok(
  $$update public.schedule_activities set created_by = '12000000-0000-0000-0000-000000000002' where id = '32000000-0000-0000-0000-000000000001'$$,
  '42501', null, 'activity identity cannot be reassigned'
);
select results_eq(
  $$delete from public.schedule_activities where id = '32000000-0000-0000-0000-000000000001' returning id$$,
  $$values ('32000000-0000-0000-0000-000000000001'::uuid)$$,
  'a member can delete an activity in their trip'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is_empty(
  $$select id from public.schedule_activities$$,
  'anonymous users cannot read schedule activities'
);

select * from finish();
rollback;

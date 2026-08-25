begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email)
values
  ('11000000-0000-0000-0000-000000000001', 'owner@example.test'),
  ('11000000-0000-0000-0000-000000000002', 'partner@example.test'),
  ('11000000-0000-0000-0000-000000000003', 'unrelated@example.test');

insert into public.trips (id, name, created_by)
values ('21000000-0000-0000-0000-000000000001', 'Shared trip', '11000000-0000-0000-0000-000000000001');

insert into public.trip_invites (id, trip_id, token_hash, created_by, expires_at)
values
  (
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    encode(extensions.digest('partner-invite-token-00000000000001', 'sha256'), 'hex'),
    '11000000-0000-0000-0000-000000000001',
    now() + interval '7 days'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    encode(extensions.digest('extra-invite-token-0000000000000002', 'sha256'), 'hex'),
    '11000000-0000-0000-0000-000000000001',
    now() + interval '7 days'
  );

select results_eq(
  $$select role::text from public.trip_members where trip_id = '21000000-0000-0000-0000-000000000001' and user_id = '11000000-0000-0000-0000-000000000001'$$,
  $$values ('owner'::text)$$,
  'trip creator automatically becomes owner'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000003', true);

select is_empty(
  $$select id from public.trips where id = '21000000-0000-0000-0000-000000000001'$$,
  'an unrelated user cannot read the trip'
);
select is_empty(
  $$select id from public.trip_invites where trip_id = '21000000-0000-0000-0000-000000000001'$$,
  'an unrelated user cannot read invite records'
);
select throws_ok(
  $$insert into public.trip_members (trip_id, user_id, role) values ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 'member')$$,
  '42501',
  null,
  'users cannot join by directly inserting membership'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
select results_eq(
  $$select public.accept_trip_invite('partner-invite-token-00000000000001')$$,
  $$values ('21000000-0000-0000-0000-000000000001'::uuid)$$,
  'a valid invite adds the partner'
);
select results_eq(
  $$select id from public.trips where id = '21000000-0000-0000-0000-000000000001'$$,
  $$values ('21000000-0000-0000-0000-000000000001'::uuid)$$,
  'the partner can read the shared trip after joining'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select public.accept_trip_invite('partner-invite-token-00000000000001')$$,
  'P0001',
  null,
  'an accepted invite cannot be reused'
);
select throws_ok(
  $$select public.accept_trip_invite('extra-invite-token-0000000000000002')$$,
  '23514',
  null,
  'a third user cannot join a full two-person trip'
);

select * from finish();
rollback;


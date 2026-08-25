do $$
begin
  alter publication supabase_realtime add table public.wishlist_items;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception
  when duplicate_object then null;
end
$$;

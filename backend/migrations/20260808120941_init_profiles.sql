create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  first_name text,
  last_name text
);

alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, first_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'first_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

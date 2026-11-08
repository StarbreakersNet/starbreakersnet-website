-- Paramètres propres à chaque utilisateur (une ligne par compte), prévus pour accueillir
-- d'autres préférences que le thème.
create table public.user_settings
(
    user_id    uuid primary key references auth.users (id) on delete cascade,
    theme      text        not null default 'dark' check (theme in ('dark', 'light')),
    updated_at timestamptz not null default now()
);

alter table public.user_settings
    enable row level security;

create policy "users read own settings" on public.user_settings
    for select to authenticated
    using ((select auth.uid()) = user_id);

create policy "users update own settings" on public.user_settings
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Droits explicites plutôt que les privilèges par défaut du schéma public (que Supabase
-- n'accorde plus automatiquement aux nouvelles tables) : lecture et modification de sa
-- propre ligne uniquement. La ligne est créée par le trigger ci-dessous, pas par l'API.
revoke all on table public.user_settings from anon, authenticated;
grant select, update on table public.user_settings to authenticated;

-- Mise à jour automatique de updated_at (extension moddatetime fournie par Supabase)
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at
    before update
    on public.user_settings
    for each row
execute procedure extensions.moddatetime(updated_at);

-- Création de la ligne à l'inscription, avec le thème choisi avant de créer le compte
-- (transmis dans les métadonnées de signUp), sinon la valeur par défaut.
create function public.handle_new_user_settings()
    returns trigger as
$$
begin
    insert into public.user_settings (user_id, theme)
    values (new.id,
            case
                when new.raw_user_meta_data ->> 'theme' in ('dark', 'light')
                    then new.raw_user_meta_data ->> 'theme'
                else 'dark'
                end);
    return new;
end;
$$ language plpgsql security definer
                    set search_path = '';

revoke execute on function public.handle_new_user_settings() from public;
revoke execute on function public.handle_new_user_settings() from anon;
revoke execute on function public.handle_new_user_settings() from authenticated;

create trigger on_auth_user_created_settings
    after insert
    on auth.users
    for each row
execute function public.handle_new_user_settings();

-- Comptes créés avant cette migration
insert into public.user_settings (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

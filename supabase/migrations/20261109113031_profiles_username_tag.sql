-- Pseudos : règles vérifiées en base, nom de repli à la création du compte, et numéro à 4 chiffres
-- (« Renard#0421 ») qui distingue les membres ayant le même pseudo.
--
-- Avant : profiles.username est NOT NULL et rempli par handle_new_user depuis les métadonnées.
-- Un compte créé sans username (invitation ou création depuis Studio, API admin, futur OAuth)
-- faisait échouer la création du compte (erreur 500). Et rien ne vérifiait le pseudo côté base.

-- Règles du pseudo, alignées avec src/lib/validation.ts (USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
create function public.is_valid_username(value text)
    returns boolean
    language sql
    immutable
    set search_path = ''
as
$$
select value ~ '^[A-Za-z0-9]{3,32}$'
$$;

-- Pseudo de repli : « user » suivi des 8 premiers caractères de l'id (conforme aux règles)
create function public.default_username(user_id uuid)
    returns text
    language sql
    immutable
    set search_path = ''
as
$$
select 'user' || left(replace(user_id::text, '-', ''), 8)
$$;

-- Numéro libre pour ce pseudo (sans tenir compte des majuscules), tiré au hasard entre 1 et 9999.
-- Le profil exclude_id est ignoré, pour qu'un membre puisse garder son numéro en changeant de pseudo.
-- security definer : avec la RLS, un membre ne voit que son profil, donc pas les numéros déjà pris.
create function public.pick_username_tag(p_username text, exclude_id uuid)
    returns smallint
    language plpgsql
    volatile
    security definer
    set search_path = ''
as
$$
declare
    tag smallint;
begin
    select candidate::smallint
    into tag
    from generate_series(1, 9999) as candidate
    where not exists (select 1
                      from public.profiles p
                      where lower(p.username) = lower(p_username)
                        and p.tag = candidate
                        and p.id is distinct from exclude_id)
    order by random()
    limit 1;

    if tag is null then
        raise exception 'Plus aucun numéro libre pour le pseudo %', p_username
            using errcode = 'P0001', hint = 'username_full';
    end if;

    return tag;
end;
$$;

-- --- Colonne tag et données existantes ---

alter table public.profiles
    add column tag smallint;

-- Pseudos existants hors règles (créés par l'API, sans passer par le formulaire) : remplacés
-- par le pseudo de repli, sinon la contrainte ci-dessous ferait échouer la migration.
update public.profiles
set username = public.default_username(id)
where not public.is_valid_username(username);

-- Un numéro par profil existant. Une requête par ligne : chaque tirage voit les précédents.
do
$$
    declare
        profile record;
    begin
        for profile in select id, username from public.profiles where tag is null
            loop
                update public.profiles
                set tag = public.pick_username_tag(profile.username, profile.id)
                where id = profile.id;
            end loop;
    end;
$$;

alter table public.profiles
    alter column tag set not null,
    add constraint profiles_username_valid check (public.is_valid_username(username)),
    add constraint profiles_tag_range check (tag between 1 and 9999);

-- Le couple pseudo + numéro est unique (« Renard#0421 » et « renard#0421 » sont le même)
create unique index profiles_username_tag_key on public.profiles (lower(username), tag);

-- --- Attribution du numéro ---

-- À la création, et quand le pseudo change : le membre garde son numéro s'il est libre pour le
-- nouveau pseudo, sinon il en reçoit un autre. Le numéro n'est jamais choisi par le client.
-- security definer, pour la même raison que pick_username_tag.
create function public.handle_profile_tag()
    returns trigger
    language plpgsql
    security definer
    set search_path = ''
as
$$
begin
    if tg_op = 'INSERT' then
        new.tag := public.pick_username_tag(new.username, new.id);
    elsif lower(new.username) is distinct from lower(old.username) then
        if exists (select 1
                   from public.profiles p
                   where lower(p.username) = lower(new.username)
                     and p.tag = old.tag
                     and p.id <> new.id) then
            new.tag := public.pick_username_tag(new.username, new.id);
        else
            new.tag := old.tag;
        end if;
    else
        new.tag := old.tag;
    end if;
    return new;
end;
$$;

create trigger handle_profile_tag
    before insert or update
    on public.profiles
    for each row
execute function public.handle_profile_tag();

-- --- Création du compte : pseudo de repli si absent ou hors règles ---

create or replace function public.handle_new_user()
    returns trigger as
$$
declare
    new_username text := btrim(new.raw_user_meta_data ->> 'username');
begin
    if new_username is null or not public.is_valid_username(new_username) then
        new_username := public.default_username(new.id);
    end if;

    insert into public.profiles (id, username, first_name)
    values (new.id, new_username, new.raw_user_meta_data ->> 'first_name');
    return new;
end;
$$ language plpgsql security definer
                    set search_path = public, auth, pg_temp;

-- --- Droits ---

-- Comme user_settings : droits explicites plutôt que les privilèges par défaut. Lecture de son
-- profil, et modification des seules colonnes éditables (le numéro reste géré par la base).
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (username, first_name, last_name) on table public.profiles to authenticated;

revoke execute on function public.pick_username_tag(text, uuid) from public, anon, authenticated;
revoke execute on function public.handle_profile_tag() from public, anon, authenticated;

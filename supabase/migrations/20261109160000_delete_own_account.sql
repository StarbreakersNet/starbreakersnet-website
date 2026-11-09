-- Suppression de son propre compte (droit à l'effacement, RGPD), depuis la page « Mon compte ».
--
-- Supprime la ligne de auth.users : le profil et les paramètres suivent (on delete cascade), ainsi
-- que les sessions et identités gérées par GoTrue. Le front vérifie le mot de passe avant l'appel,
-- en se reconnectant avec (limites d'essais de GoTrue) : la fonction ne sert pas d'oracle pour
-- deviner un mot de passe.
--
-- security definer : un membre n'a aucun droit sur le schéma auth. La fonction ne supprime que le
-- compte de la session (auth.uid()), jamais un autre.
create function public.delete_own_account()
    returns void
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    current_id uuid := auth.uid();
begin
    if current_id is null then
        raise exception 'Aucune session' using errcode = '42501';
    end if;

    delete from auth.users where id = current_id;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

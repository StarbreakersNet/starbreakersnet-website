-- Fond d'écran de Buroh choisi sur l'ordinateur (image ou vidéo) : envoyé sur le compte pour le
-- retrouver sur un autre navigateur (src/stores/widgets.ts). Son chemin, <id du compte>/<id du
-- fichier>, est enregistré dans user_settings.widgets.
--
-- Bucket privé : chaque membre ne lit, n'ajoute et ne supprime que les fichiers de son dossier.
-- Pas de policy de modification : un nouveau fond est un nouveau fichier, l'ancien est supprimé.
-- La limite de taille ne peut pas dépasser celle du service de stockage (FILE_SIZE_LIMIT).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wallpapers', 'wallpapers', false, 52428800, array ['image/*', 'video/*'])
on conflict (id) do nothing;

create policy "users read own wallpaper" on storage.objects
    for select to authenticated
    using (bucket_id = 'wallpapers' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users add own wallpaper" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'wallpapers' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users delete own wallpaper" on storage.objects
    for delete to authenticated
    using (bucket_id = 'wallpapers' and (storage.foldername(name))[1] = (select auth.uid())::text);

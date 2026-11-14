-- Widgets de Buroh (/buroh) : disposition et réglages de chaque widget, enregistrés tels
-- quels par le front (src/stores/widgets.ts, format { version, widgets: [...] }).
-- Colonne facultative : null tant que le membre n'a pas encore ouvert la page, le front affiche
-- alors la disposition gardée dans le navigateur, ou celle par défaut.
-- Lecture et modification déjà couvertes par les policies et les grants de user_settings.
alter table public.user_settings
    add column widgets jsonb
        check (widgets is null or jsonb_typeof(widgets) = 'object');

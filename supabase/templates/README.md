# Modèles des mails d'authentification

Mails envoyés par GoTrue (service `auth`), en français ou en anglais.

| Fichier | Mail | Déclencheur |
|---|---|---|
| `confirmation.html` | Confirmation d'inscription | `signUp` (si `ENABLE_EMAIL_AUTOCONFIRM=false`) |
| `recovery.html` | Mot de passe oublié | `resetPasswordForEmail` |
| `email_change.html` | Changement d'email, envoyé à l'ancienne et à la nouvelle adresse | `updateUser({ email })` |
| `invite.html` | Invitation | Studio → Authentication → Invite user |

Les autres mails (lien magique, réauthentification, notifications) gardent le modèle par défaut de GoTrue : le site ne les utilise pas.

## Fonctionnement

- Le service `mail-templates` (`docker-compose.starbreakers.yml`) est une image nginx qui contient les `*.html` de ce dossier. Elle est servie sur le réseau interne de la stack et reconstruite à chaque `docker compose up` (`pull_policy: build`), donc à chaque déploiement. Les modèles sont copiés dans l'image plutôt que montés, parce que Dokploy re-clone le code à chaque déploiement : un conteneur qui monte le dossier supprimé continuerait de tourner, mais servirait un dossier vide.
- GoTrue télécharge chaque modèle par URL (`GOTRUE_MAILER_TEMPLATES_*`) et le garde **10 minutes en cache**. Après une modification : `docker compose up -d mail-templates`, puis attendre ce délai ou redémarrer `auth`. Si un modèle est inaccessible, GoTrue envoie son modèle par défaut, en anglais, pour le corps comme pour l'objet.
- Les objets des mails sont dans `GOTRUE_MAILER_SUBJECTS_*`, dans le même fichier compose. Ce sont aussi des modèles Go.
- Les modèles utilisent la syntaxe Go `html/template`. Variables disponibles : `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` (changement d'email), `{{ .SiteURL }}`, `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}` et `{{ .Data }}`, qui contient les métadonnées de l'utilisateur (`user_metadata`).
- La mise en page est recopiée dans chaque fichier, parce que GoTrue ne gère pas l'inclusion d'un fichier dans un autre. Une modification de la mise en page est donc à reporter dans les quatre fichiers.

## Langue

La langue vient de `user_metadata.locale`, que le front enregistre à l'inscription (`APP_LOCALE` dans `src/lib/locale.ts`).

- `"en"` : anglais.
- Toute autre valeur, ou pas de valeur (comptes créés avant, invitations) : français.

Le test, en tête de chaque modèle et dans chaque objet :

```gotemplate
{{- $en := and .Data (eq (printf "%v" .Data.locale) "en") -}}
```

`and` s'arrête dès que `.Data` est vide, et `printf "%v"` évite une erreur si `locale` n'est pas une chaîne.

Pour ajouter une langue : ajouter une branche `{{ else if … }}` dans les quatre modèles et les quatre objets, puis enregistrer la langue choisie par l'utilisateur dans `user_metadata.locale` (à l'inscription, et avec `updateUser({ data: { locale } })` s'il en change).

## Tester en local

Avec `ENABLE_EMAIL_AUTOCONFIRM=true` (valeur locale par défaut), GoTrue n'envoie pas de mail de confirmation à l'inscription. Pour tester les quatre mails, depuis `supabase/docker` :

```bash
ENABLE_EMAIL_AUTOCONFIRM=false docker compose up -d auth
```

Les mails arrivent dans Mailpit (https://mail.starbreakers.localhost). Pour revenir à la configuration locale : `docker compose up -d auth`.

Le logo est chargé depuis `{{ .SiteURL }}/icon-192.png` : en local, il ne s'affiche que si le front (`yarn dev`) tourne.

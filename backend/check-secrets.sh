#!/bin/sh
# Garde-fou lancé par le service `migrations` avant `supabase db push` : refuse de continuer
# si un secret est vide ou vaut encore sa valeur d'exemple (`change_me_…` de .env.example).
# Les valeurs se génèrent avec : node backend/generate-keys.js

status=0

for name in POSTGRES_PASSWORD JWT_SECRET ANON_KEY DASHBOARD_PASSWORD PG_META_CRYPTO_KEY; do
    eval "value=\${$name:-}"

    case "$value" in
        "" | change_me_*)
            echo "ERREUR : $name est vide ou vaut encore sa valeur d'exemple." >&2
            status=1
            ;;
    esac
done

if [ "$status" -ne 0 ]; then
    echo "Générez les secrets avec 'node backend/generate-keys.js' et reportez-les dans le .env." >&2
fi

exit "$status"

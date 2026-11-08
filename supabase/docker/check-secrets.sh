#!/bin/sh
# Garde-fou lancé par le service `migrations` (docker-compose.starbreakers.yml) avant `supabase db push`.
# Refuse de continuer si un secret est vide ou vaut encore la valeur d'exemple de .env.example.
# Les secrets se génèrent avec les scripts officiels :
#   sh utils/generate-keys.sh --update-env && sh utils/add-new-auth-keys.sh --update-env
#
# Usage : sh check-secrets.sh <chemin de .env.example>

example_file="$1"
status=0

example_value() {
    grep -m1 "^$1=" "$example_file" 2>/dev/null | cut -d= -f2-
}

for name in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY \
    SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY DASHBOARD_PASSWORD SECRET_KEY_BASE \
    REALTIME_DB_ENC_KEY VAULT_ENC_KEY PG_META_CRYPTO_KEY \
    S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET JWT_KEYS JWT_JWKS; do
    eval "value=\${$name:-}"

    if [ -z "$value" ]; then
        echo "ERREUR : $name est vide." >&2
        status=1
    elif [ "$value" = "$(example_value "$name")" ]; then
        echo "ERREUR : $name vaut encore sa valeur d'exemple (.env.example)." >&2
        status=1
    fi
done

if [ "$status" -ne 0 ]; then
    echo "Générez les secrets : sh utils/generate-keys.sh --update-env && sh utils/add-new-auth-keys.sh --update-env" >&2
fi

exit "$status"

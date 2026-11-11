<script lang="ts" setup>
import HCard from "@/components/c/hCard.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import HText from "@/components/c/hText.vue";

// Dernière mise à jour du texte, à changer à chaque modification
const UPDATED_AT = "9 novembre 2026";

// Éditeur : particulier, à titre non professionnel, sous pseudonyme (art. 6, III-2 de la LCEN).
// Son identité est connue de l'hébergeur. Cette adresse doit recevoir les messages : c'est aussi
// celle des demandes liées aux données personnelles.
const EDITOR = "TheRedfoox";
const CONTACT_EMAIL = "contact@starbreakers.net";

// Coordonnées de l'hébergeur du serveur, reprises de https://www.ovhcloud.com/fr/terms-and-conditions/
const HOST = {
  name: "OVH SAS",
  address: "2 rue Kellermann, 59100 Roubaix, France",
  phone: "1007 (depuis la France)",
};

const CNIL_COMPLAINT_URL = "https://www.cnil.fr/fr/plaintes";
</script>

<template>
  <h-card class="legal tw:max-w-3xl tw:self-start">
    <template #header>Mentions légales et confidentialité</template>
    <template #header-extra>
      <n-tag :bordered="false" round size="small">Mis à jour le {{ UPDATED_AT }}</n-tag>
    </template>
    <template #default>
      <h-flex vertical>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>
            <h-flex size="small">
              <font-awesome-icon icon="scale-balanced" />
              Mentions légales
            </h-flex>
          </template>
          <template #default>
            <h-flex vertical>
              <h-text>
                StarbreakersNet est un site communautaire, sans but lucratif, édité à titre
                personnel et non professionnel. Conformément à l'article 6, III-2 de la loi n°
                2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, l'éditeur a
                choisi de ne pas rendre publique son identité, qu'il a communiquée à l'hébergeur.
              </h-text>
              <n-descriptions
                :column="1"
                :label-style="{ whiteSpace: 'nowrap' }"
                bordered
                label-placement="left"
                size="small">
                <n-descriptions-item label="Éditeur">{{ EDITOR }}</n-descriptions-item>
                <n-descriptions-item label="Contact">
                  <n-a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</n-a>
                </n-descriptions-item>
                <n-descriptions-item label="Hébergeur">
                  <h-flex :size="0" vertical>
                    <strong>{{ HOST.name }}</strong>
                    <span>{{ HOST.address }}</span>
                    <span>Téléphone : {{ HOST.phone }}</span>
                  </h-flex>
                </n-descriptions-item>
              </n-descriptions>
            </h-flex>
          </template>
        </h-card>

        <h-card :bordered="false" embedded segmented size="small">
          <template #header>
            <h-flex size="small">
              <font-awesome-icon icon="database" />
              Données collectées
            </h-flex>
          </template>
          <template #default>
            <h-flex vertical>
              <h-text>
                Un compte n'est pas nécessaire pour consulter le site. Si vous en créez un, nous
                traitons les données ci-dessous. Le responsable du traitement est l'éditeur du site,
                {{ EDITOR }}, joignable à {{ CONTACT_EMAIL }}.
              </h-text>
              <n-ul class="tw:m-0 tw:list-disc">
                <n-li>votre adresse email et votre pseudo, à l'inscription ;</n-li>
                <n-li>
                  votre mot de passe, enregistré uniquement sous forme chiffrée (hachée) ;
                </n-li>
                <n-li>votre prénom et votre nom, seulement si vous les renseignez ;</n-li>
                <n-li>
                  vos préférences d'affichage (thème clair ou sombre) et les widgets de votre
                  bureau, avec leur contenu (notes, liens) ;
                </n-li>
                <n-li>
                  des données techniques de connexion (adresse IP, date, navigateur), conservées
                  dans les journaux du serveur pour la sécurité des comptes.
                </n-li>
              </n-ul>
            </h-flex>
          </template>
        </h-card>

        <n-grid cols="1 m:2" responsive="screen" :x-gap="12" :y-gap="12">
          <n-gi>
            <h-card :bordered="false" class="tw:h-full" embedded segmented size="small">
              <template #header>
                <h-flex size="small">
                  <font-awesome-icon icon="user-shield" />
                  Utilisation
                </h-flex>
              </template>
              <template #default>
                <h-text>
                  Ces données servent uniquement à faire fonctionner votre compte : vous connecter,
                  vous envoyer les emails liés au compte (confirmation d'inscription, mot de passe
                  oublié, changement d'adresse) et protéger le site contre les abus. Elles ne sont
                  ni vendues, ni utilisées à des fins publicitaires. Ce traitement repose sur
                  l'exécution du service que vous demandez en créant un compte.
                </h-text>
              </template>
            </h-card>
          </n-gi>
          <n-gi>
            <h-card :bordered="false" class="tw:h-full" embedded segmented size="small">
              <template #header>
                <h-flex size="small">
                  <font-awesome-icon icon="server" />
                  Stockage et accès
                </h-flex>
              </template>
              <template #default>
                <h-text>
                  Les données sont stockées sur un serveur loué chez {{ HOST.name }}, que nous
                  administrons nous-mêmes, sans service d'analyse ni de publicité. Seuls les
                  administrateurs du site y ont accès. Les emails liés au compte sont envoyés par le
                  service de messagerie d'OVHcloud.
                </h-text>
              </template>
            </h-card>
          </n-gi>
          <n-gi>
            <h-card :bordered="false" class="tw:h-full" embedded segmented size="small">
              <template #header>
                <h-flex size="small">
                  <font-awesome-icon icon="clock" />
                  Durée de conservation
                </h-flex>
              </template>
              <template #default>
                <h-text>
                  Vos données sont conservées tant que votre compte existe. Lorsque vous le
                  supprimez, votre compte, votre profil et vos préférences sont effacés
                  immédiatement ; les copies de sauvegarde du serveur disparaissent ensuite au fil
                  de leur renouvellement.
                </h-text>
              </template>
            </h-card>
          </n-gi>
          <n-gi>
            <h-card :bordered="false" class="tw:h-full" embedded segmented size="small">
              <template #header>
                <h-flex size="small">
                  <font-awesome-icon icon="cookie-bite" />
                  Cookies et stockage local
                </h-flex>
              </template>
              <template #default>
                <h-flex vertical>
                  <h-text>
                    Aucun cookie publicitaire ni de mesure d'audience. Votre navigateur garde
                    seulement votre session, votre choix de thème et les widgets de votre bureau,
                    nécessaires au fonctionnement du site : ils ne demandent donc pas de
                    consentement.
                  </h-text>
                  <h-text depth="3">
                    Les pages Discord et Le Zap affichent des contenus de services tiers, qui
                    peuvent déposer leurs propres cookies. La vidéo YouTube est intégrée en mode «
                    confidentialité renforcée ». Sur la page Bureau, les icônes du widget Liens
                    viennent de DuckDuckGo, qui ne reçoit que le nom de domaine de chaque lien, et
                    la météo d'Open-Meteo, qui ne reçoit que les coordonnées de la ville choisie.
                  </h-text>
                </h-flex>
              </template>
            </h-card>
          </n-gi>
        </n-grid>

        <h-card :bordered="false" embedded segmented size="small">
          <template #header>
            <h-flex size="small">
              <font-awesome-icon icon="envelope" />
              Vos droits
            </h-flex>
          </template>
          <template #default>
            <h-flex vertical>
              <h-text>
                Vous pouvez consulter, modifier et supprimer votre compte depuis la page « Mon
                compte ». Pour toute autre demande (accès, rectification, opposition, portabilité),
                écrivez-nous. Si vous estimez que vos droits ne sont pas respectés, vous pouvez
                saisir la CNIL (Commission nationale de l'informatique et des libertés).
              </h-text>
              <h-flex wrap>
                <h-button @click="$router.push({ name: 'account' })">Mon compte</h-button>
                <h-button :href="`mailto:${CONTACT_EMAIL}`" tag="a">Nous écrire</h-button>
                <h-button :href="CNIL_COMPLAINT_URL" tag="a" target="_blank">
                  Saisir la CNIL
                </h-button>
              </h-flex>
            </h-flex>
          </template>
        </h-card>
      </h-flex>
    </template>
  </h-card>
</template>

<style lang="scss" scoped>
// En-tête de la carte principale : sur un écran étroit, l'étiquette de mise à jour passe sous le
// titre au lieu de l'écraser
.legal > :deep(.n-card-header) {
  flex-wrap: wrap;
  row-gap: 0.5em;

  .n-card-header__main {
    flex: 1 1 auto;
    min-width: 14em;
  }
}
</style>

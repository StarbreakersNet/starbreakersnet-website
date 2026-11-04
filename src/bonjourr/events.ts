// Signal « changer de fond » à la demande. L'original passe par un message
// interne (features/backgrounds/index.ts l.176-194 : `backgroundUpdate` avec
// `{ refresh: true }`, traité par `update()` l.115-315). Le fork n'a pas de
// messagerie entre onglets : un simple compteur réactif Vue joue le rôle du
// message, et le composant des fonds s'y abonne.

import { ref } from "vue";

/** Compteur incrémenté à chaque demande manuelle. */
export const backgroundRefreshTick = ref(0);

/** Demande un nouveau fond (équivalent de `{ refresh: true }`). */
export function requestBackgroundRefresh(): void {
  backgroundRefreshTick.value++;
}

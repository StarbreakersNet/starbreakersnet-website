<script lang="ts" setup>
import { provide } from "vue";

const { notificationsMap } = defineProps<{
  notificationsMap: Record<string, unknown>;
}>();
const NOTIF_CTX = Symbol("NotificationContext");
provide(NOTIF_CTX, notificationsMap);
</script>

<template>
  <slot v-if="notificationsMap" />
</template>

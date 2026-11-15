<script lang="ts" setup>
import { provide } from "vue";

const props = defineProps({
  notificationsMap: {
    type: Object,
    required: true,
  },
});
const NOTIF_CTX = Symbol("NotificationContext");
provide(NOTIF_CTX, props.notificationsMap);
</script>

<template>
  <slot v-if="notificationsMap" />
</template>

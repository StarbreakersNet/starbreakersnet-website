<template>
    <slot v-if="notificationsMap" />
</template>

<script lang="ts" setup>
import { provide } from "vue";

const NOTIF_CTX = Symbol("NotificationContext");
const props = defineProps({
    notificationsMap: {
        type: Object,
        required: true,
    },
});

provide(NOTIF_CTX, props.notificationsMap);
</script>

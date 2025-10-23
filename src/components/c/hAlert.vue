<template>
    <n-alert
        :bordered="props.bordered"
        :closable="props.closable"
        :show-icon="props.showIcon"
        :title="props.title"
        :type="props.type"
        v-bind="$attrs">
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template v-if="slots.icon" #icon>
            <slot name="icon" />
        </template>
    </n-alert>
</template>

<script lang="ts" setup>
import { NAlert } from "naive-ui";
import { type PropType, useSlots } from "vue";

const props = defineProps({
    bordered: {
        type: Boolean,
        default: false,
    },
    closable: {
        type: Boolean,
        default: false,
    },
    showIcon: {
        type: Boolean,
        default: true,
    },
    title: {
        type: String,
        default: undefined,
    },
    type: {
        type: String as PropType<"default" | "info" | "success" | "warning" | "error">,
        default: "default",
    },
});

const slots = useSlots();
</script>

<style lang="sass" scoped></style>

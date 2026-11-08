<template>
    <n-anchor-link
        :href="props.href"
        :title="props.title"
        v-bind="$attrs"
        @click="$emit('click', $event)">
        <template v-if="slots.title" #title>
            <div class="tw:py-[.5rem]">
                <slot name="title" />
            </div>
        </template>
        <template v-if="slots.default">
            <slot />
        </template>
    </n-anchor-link>
</template>

<script lang="ts" setup>
import { type AnchorLinkProps, NAnchorLink } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    title: {
        type: [String, Number] as PropType<AnchorLinkProps["title"]>,
        default: undefined,
    },
    href: {
        type: String as PropType<AnchorLinkProps["href"]>,
        default: undefined,
    },
});

defineEmits<{
    (e: "click", event: MouseEvent): void;
}>();
</script>

<style scoped></style>

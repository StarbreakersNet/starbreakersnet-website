<script lang="ts" setup>
import { NListItem } from "naive-ui";
import { useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    href: {
        type: String,
        default: undefined,
    },
});

function handleClick() {
    if (props.href) {
        window.location.href = props.href;
    }
}

function handleMiddleClick() {
    if (props.href) {
        window.open(props.href, "_blank");
    }
}
</script>

<template>
    <n-list-item
        :class="{ clickable: href }"
        v-bind="$attrs"
        @click.middle="handleMiddleClick"
        @click.left="handleClick">
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.prefix" #prefix>
            <slot name="prefix" />
        </template>
        <template v-if="slots.suffix" #suffix>
            <slot name="suffix" />
        </template>
    </n-list-item>
</template>

<style scoped>
.clickable {
    cursor: pointer;
}
</style>

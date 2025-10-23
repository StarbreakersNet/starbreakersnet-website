<script generic="T = any" lang="ts" setup>
import HAlert from "@/components/c/hAlert.vue";
import HListItem from "@/components/c/hListItem.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { type ListProps, NList } from "naive-ui";
import { computed, type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    showDivider: {
        type: Boolean as PropType<ListProps["showDivider"]>,
        default: false,
    },
    hoverable: {
        type: Boolean as PropType<ListProps["hoverable"]>,
        default: false,
    },
    clickable: {
        type: Boolean as PropType<ListProps["clickable"]>,
        default: false,
    },
    bordered: {
        type: Boolean as PropType<ListProps["bordered"]>,
        default: false,
    },
    size: {
        type: String as PropType<ListProps["size"]>,
        default: "medium",
    },
    themeOverrides: {
        type: Object as PropType<ListProps["themeOverrides"]>,
    },
    items: {
        type: Array as PropType<T[]>,
        default: null,
    },
    animated: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits<{
    (e: "itemClick", item: T): void;
}>();

const isHoverable = computed(() => props.hoverable && (!props.items || props.items.length > 0));

defineSlots<{
    default: () => any;
    item: (props: { index: number; item: T }) => any;
    empty: () => any;
    header: () => any;
    footer: () => any;
    suffix: (props: { index: number; item: T }) => any;
}>();

function getItemHref(item: T): string | undefined {
    if (props.clickable) {
        return (item as any)?.href;
    } else {
        return undefined;
    }
}

function getItemKey(item: T, index: number): string | number {
    return (item as any)?.id ?? index;
}

function handleItemClick(item: T) {
    if (props.clickable) {
        emit("itemClick", item);
    }
}
</script>

<template>
    <n-list
        :bordered="props.bordered"
        :clickable="props.clickable"
        :hoverable="isHoverable"
        :show-divider="props.showDivider"
        :size="props.size"
        :theme-overrides="props.themeOverrides"
        v-bind="$attrs">
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template #default>
            <template v-if="props.items">
                <slot v-if="items.length <= 0" name="empty">
                    <h-list-item>
                        <h-alert :show-icon="false" type="info">
                            <div class="hm-list hm-subtitle">
                                <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
                                <span>Aucun élément disponible</span>
                            </div>
                        </h-alert>
                    </h-list-item>
                </slot>
                <template v-else>
                    <h-list-item
                        v-for="(item, index) in items"
                        :key="getItemKey(item, index)"
                        :href="getItemHref(item)"
                        @click="handleItemClick(item)">
                        <template #default>
                            <slot :index="index" :item="item" name="item">
                                <div>{{ item }}</div>
                            </slot>
                        </template>
                        <template v-if="slots.suffix" #suffix>
                            <slot :index="index" :item="item" name="suffix" />
                        </template>
                    </h-list-item>
                </template>
            </template>
            <template v-else-if="slots.default">
                <slot name="default" />
            </template>
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
    </n-list>
</template>

<style scoped></style>

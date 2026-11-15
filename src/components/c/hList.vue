<script generic="T = any" lang="ts" setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { NList, type ListProps } from "naive-ui";
import { computed, type VNode } from "vue";
import HAlert from "@/components/c/hAlert.vue";
import HListItem from "@/components/c/hListItem.vue";
import { slotsExcept } from "@/utils/slots";

interface Props extends /* @vue-ignore */ ListProps {
  /** Éléments affichés un par un (slot item), avec un message quand la liste est vide */
  items?: T[] | null;
  clickable?: boolean;
  hoverable?: boolean;
  showDivider?: boolean;
}

type ForwardedSlot = "header" | "footer";

defineOptions({ inheritAttrs: false });

const {
  items = null,
  clickable = false,
  hoverable = false,
  showDivider = false,
} = defineProps<Props>();

const emit = defineEmits<{
  itemClick: [item: T];
}>();

defineSlots<{
  default: () => VNode[];
  item: (props: { index: number; item: T }) => VNode[];
  empty: () => VNode[];
  header: () => VNode[];
  footer: () => VNode[];
  suffix: (props: { index: number; item: T }) => VNode[];
}>();

const isHoverable = computed(() => hoverable && (!items || items.length > 0));

function getItemHref(item: T): string | undefined {
  return clickable ? (item as { href?: string } | undefined)?.href : undefined;
}

function getItemKey(item: T, index: number): string | number {
  return (item as { id?: string | number } | undefined)?.id ?? index;
}

function handleItemClick(item: T) {
  if (clickable) {
    emit("itemClick", item);
  }
}
</script>

<template>
  <n-list
    :clickable="clickable"
    :hoverable="isHoverable"
    :show-divider="showDivider"
    v-bind="$attrs">
    <template
      v-for="(_, name) in slotsExcept($slots, 'default', 'item', 'empty', 'suffix')"
      #[name]>
      <slot :name="name as ForwardedSlot" />
    </template>
    <template #default>
      <template v-if="items">
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
            <template v-if="$slots.suffix" #suffix>
              <slot :index="index" :item="item" name="suffix" />
            </template>
          </h-list-item>
        </template>
      </template>
      <slot v-else-if="$slots.default" name="default" />
    </template>
  </n-list>
</template>

<script setup lang="ts">
import { NListItem, type ListItemSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

const { href } = defineProps<{
  /** Lien ouvert au clic, dans un nouvel onglet au clic du milieu */
  href?: string;
}>();

defineSlots<ListItemSlots>();

function handleClick() {
  if (href) {
    window.location.href = href;
  }
}

function handleMiddleClick() {
  if (href) {
    window.open(href, "_blank");
  }
}
</script>

<template>
  <n-list-item
    :class="{ clickable: href }"
    v-bind="$attrs"
    @click.middle="handleMiddleClick()"
    @click.left="handleClick()">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof ListItemSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-list-item>
</template>

<style scoped>
.clickable {
  cursor: pointer;
}
</style>

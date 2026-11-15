<script setup lang="ts">
import { NAnchorLink, type AnchorLinkProps, type AnchorLinkSlots } from "naive-ui";
import { slotsExcept } from "@/utils/slots";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ AnchorLinkProps>();

defineSlots<AnchorLinkSlots>();
</script>

<template>
  <n-anchor-link v-bind="$attrs">
    <template v-if="$slots.title" #title>
      <div class="tw:py-[.5rem]">
        <slot name="title" />
      </div>
    </template>
    <template v-for="(_, name) in slotsExcept($slots, 'title')" #[name]="slotProps">
      <slot :name="name as keyof AnchorLinkSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-anchor-link>
</template>

<script setup lang="ts">
import { NCard, type CardProps, type CardSlots } from "naive-ui";
import HFlex from "@/components/c/hFlex.vue";
import { slotsExcept } from "@/utils/slots";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ CardProps>();

defineSlots<CardSlots & { "action-float"?: () => unknown }>();
</script>

<template>
  <n-card v-bind="$attrs">
    <template
      v-for="(_, name) in slotsExcept($slots, 'default', 'action-float')"
      #[name]="slotProps">
      <slot :name="name as keyof CardSlots" v-bind="slotProps ?? {}" />
    </template>
    <template #default>
      <slot name="default" />
      <h-flex
        v-if="$slots['action-float']"
        align="end"
        class="tw:flex-1 tw:sticky tw:bottom-[2rem]"
        justify="end">
        <h-card embedded size="small">
          <h-flex justify="end">
            <slot name="action-float" />
          </h-flex>
        </h-card>
      </h-flex>
    </template>
  </n-card>
</template>

<style lang="scss" scoped>
.n-card {
  :deep(> .n-card__content) {
    display: flex;
    flex-direction: column;
  }
}
</style>

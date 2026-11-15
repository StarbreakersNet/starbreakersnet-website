<script setup lang="ts">
import { NAnchor, type AnchorProps, type AnchorInst } from "naive-ui";
import { useTemplateRef } from "vue";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ AnchorProps>();

const anchorRef = useTemplateRef<AnchorInst>("anchorRef");

function scrollTo(href: string) {
  anchorRef.value?.scrollTo(href);
}

defineExpose({ scrollTo });
</script>

<template>
  <n-anchor ref="anchorRef" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-anchor>
</template>

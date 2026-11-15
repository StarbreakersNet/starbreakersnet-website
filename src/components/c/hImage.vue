<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { NImage, type ImageProps, type ImageSlots } from "naive-ui";

interface Props extends /* @vue-ignore */ ImageProps {
  objectFit?: ImageProps["objectFit"];
}

defineOptions({ inheritAttrs: false });

const { objectFit = "cover" } = defineProps<Props>();

defineSlots<ImageSlots>();
</script>

<template>
  <n-image :object-fit="objectFit" v-bind="$attrs">
    <template #error>
      <font-awesome-icon :icon="['fas', 'image']" />
    </template>
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof ImageSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-image>
</template>

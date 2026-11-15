<script setup lang="ts">
import {
  NButton,
  useThemeVars,
  type ButtonProps,
  type ButtonSlots,
  type PopoverPlacement,
} from "naive-ui";
import { computed } from "vue";
import HTooltip from "@/components/c/hTooltip.vue";

interface Props extends /* @vue-ignore */ ButtonProps {
  /** Couleur d'accent du thème (variable `accentColor`) au lieu de la couleur primaire */
  accent?: boolean;
  /** Bouton en verre (glass.scss) : fond translucide, arrondi et sans bordure */
  glass?: boolean;
  /** Texte de l'infobulle, sans infobulle si vide */
  tooltip?: string;
  tooltipPosition?: PopoverPlacement;
  /** Fait du bouton un lien `<a>` */
  href?: string;
  /** Cible du lien (`_blank`…) */
  target?: string;
  bordered?: boolean;
  disabled?: boolean;
  round?: boolean;
  themeOverrides?: ButtonProps["themeOverrides"];
}

defineOptions({ inheritAttrs: false });

const {
  accent = false,
  glass = false,
  tooltip = "",
  tooltipPosition = "top",
  href,
  target,
  bordered = undefined,
  disabled = undefined,
  round = undefined,
  themeOverrides,
} = defineProps<Props>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineSlots<ButtonSlots>();

// Variables CSS de glass.scss passées telles quelles à Naive UI (types "default" et "primary",
// et variante transparente "quaternary")
const GLASS_FILL = "var(--glass-control)";
const GLASS_FILL_HOVER = "var(--glass-control-hover)";
const GLASS_TEXT = "var(--glass-text)";
const GLASS_BLUE = "rgb(10 132 255)";
const GLASS_BLUE_HOVER = "rgb(64 156 255)";

const GLASS_THEME_OVERRIDES: ButtonProps["themeOverrides"] = {
  heightSmall: "2rem",
  heightMedium: "2.25rem",
  paddingMedium: "0 1rem",
  fontWeight: "500",
  color: GLASS_FILL,
  colorHover: GLASS_FILL_HOVER,
  colorPressed: GLASS_FILL_HOVER,
  colorFocus: GLASS_FILL_HOVER,
  textColor: GLASS_TEXT,
  textColorHover: GLASS_TEXT,
  textColorPressed: GLASS_TEXT,
  textColorFocus: GLASS_TEXT,
  rippleColor: GLASS_TEXT,
  colorQuaternaryHover: GLASS_FILL_HOVER,
  colorQuaternaryPressed: GLASS_FILL_HOVER,
  colorPrimary: GLASS_BLUE,
  colorHoverPrimary: GLASS_BLUE_HOVER,
  colorPressedPrimary: GLASS_BLUE,
  colorFocusPrimary: GLASS_BLUE_HOVER,
  rippleColorPrimary: GLASS_BLUE,
};

// Verre : nativeFocusBehavior empêche Naive de forcer le focus au clic (il le fait sous Safari), sinon
// le contour clavier de glass.scss resterait affiché après un clic à la souris

const themeVars = useThemeVars();

const mergedThemeOverrides = computed<ButtonProps["themeOverrides"]>(() => ({
  ...themeOverrides,
  ...(accent && {
    common: { ...themeOverrides?.common, primaryColor: themeVars.value.accentColor },
  }),
  ...(glass && GLASS_THEME_OVERRIDES),
}));

function handleClick(event: MouseEvent) {
  // Un lien navigue de lui-même : pas d'événement click à remonter
  if (!href) {
    emit("click", event);
  }
}
</script>

<template>
  <h-tooltip v-if="tooltip" :placement="tooltipPosition">
    <template #trigger>
      <n-button
        :bordered="glass ? false : bordered"
        :class="{ 'h-button--glass': glass }"
        :disabled="disabled"
        :href="disabled ? undefined : href"
        :native-focus-behavior="glass ? true : undefined"
        :round="glass || round"
        :tag="href ? 'a' : undefined"
        :target="target"
        :theme-overrides="mergedThemeOverrides"
        v-bind="$attrs"
        @click="handleClick($event)">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name as keyof ButtonSlots" v-bind="slotProps ?? {}" />
        </template>
      </n-button>
    </template>
    {{ tooltip }}
  </h-tooltip>
  <n-button
    v-else
    :bordered="glass ? false : bordered"
    :class="{ 'h-button--glass': glass }"
    :disabled="disabled"
    :href="disabled ? undefined : href"
    :native-focus-behavior="glass ? true : undefined"
    :round="glass || round"
    :tag="href ? 'a' : undefined"
    :target="target"
    :theme-overrides="mergedThemeOverrides"
    v-bind="$attrs"
    @click="handleClick($event)">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof ButtonSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-button>
</template>

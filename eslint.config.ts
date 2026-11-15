import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";
import pluginOxlint from "eslint-plugin-oxlint";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

const NO_TS_EXTENSION = {
  regex: "^@/.*\\.ts$",
  message: "Importer sans l'extension .ts (voir docs/conventions/composants.md)",
};

const NAIVE_FEEDBACK_IMPORTS = {
  name: "naive-ui",
  importNames: ["useMessage", "useNotification"],
  message:
    "Utiliser useAppMessage ou useAppNotification de @/composables/ (voir docs/conventions/organisation.md)",
};

const NAIVE_COMPONENT_IMPORTS = {
  group: ["naive-ui"],
  importNamePattern: "^N[A-Z]",
  allowTypeImports: true,
  message:
    "Utiliser le wrapper h-* de components/c/, à créer s'il n'existe pas (voir docs/conventions/wrappers.md)",
};

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  // supabase/docker : copie du dossier officiel de Supabase, on ne touche pas à ses fichiers
  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**", "supabase/docker/**"]),

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  ...pluginOxlint.configs["flat/recommended"],

  // Règles de docs/conventions/, après oxlint qui désactive les règles ESLint qu'il vérifie déjà
  {
    name: "app/conventions",
    files: ["src/**/*.{ts,vue}"],
    rules: {
      "vue/block-order": ["error", { order: ["script", "template", "style"] }],
      "vue/define-macros-order": [
        "error",
        { order: ["defineOptions", "defineModel", "defineProps", "defineEmits", "defineSlots"] },
      ],
      "vue/component-api-style": ["error", ["script-setup"]],
      "vue/component-name-in-template-casing": ["error", "kebab-case"],
      "vue/no-empty-component-block": "error",
      "vue/require-macro-variable-name": "error",
      "no-restricted-imports": [
        "error",
        { paths: [NAIVE_FEEDBACK_IMPORTS], patterns: [NO_TS_EXTENSION] },
      ],

      "vue/prefer-use-template-ref": "error",
      "vue/no-unused-refs": "error",
      "vue/define-props-declaration": ["error", "type-based"],
      "vue/define-props-destructuring": "error",
      "vue/define-emits-declaration": ["error", "type-literal"],
      "func-style": ["error", "declaration"],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ReturnStatement[argument=null]",
          message:
            "Pas de return vide : écrire la condition en positif, avec la suite dans le if (voir docs/conventions/composants.md)",
        },
      ],
      "no-continue": "error",
      "max-depth": ["error", 3],
    },
  },

  // App.vue garde les providers Naive UI (n-config-provider…)
  {
    name: "app/wrappers-only",
    files: ["src/**/*.vue"],
    ignores: ["src/components/c/**", "src/App.vue"],
    rules: {
      "vue/no-undef-components": [
        "error",
        // Composants globaux qui ne viennent pas de Naive UI
        { ignorePatterns: ["^router-(view|link)$", "^font-awesome-icon$", "^vue-particles$"] },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [NAIVE_FEEDBACK_IMPORTS],
          patterns: [NO_TS_EXTENSION, NAIVE_COMPONENT_IMPORTS],
        },
      ],
    },
  },

  // AppLayout est sous les providers de messages et de notifications : il transmet leur API aux composables
  {
    name: "app/feedback-providers",
    files: ["src/AppLayout.vue"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_TS_EXTENSION, NAIVE_COMPONENT_IMPORTS] }],
    },
  },

  skipFormatting
);

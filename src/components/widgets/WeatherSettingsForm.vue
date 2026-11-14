<script lang="ts" setup>
import { computed, onBeforeUnmount, type PropType, ref } from "vue";
import _ from "lodash";
import HButton from "@/components/c/hButton.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInputGroup from "@/components/c/hInputGroup.vue";
import HRadioButton from "@/components/c/hRadioButton.vue";
import HRadioGroup from "@/components/c/hRadioGroup.vue";
import HSelect from "@/components/c/hSelect.vue";
import HText from "@/components/c/hText.vue";
import { locateDevice, searchCities } from "@/utils/weather";
import type { WeatherLocation, WeatherSettings } from "@/types/Widget";

const settings = defineModel("settings", {
  type: Object as PropType<WeatherSettings>,
  required: true,
});

// Attente après la dernière frappe avant de chercher la ville
const SEARCH_DELAY = 300;

// Valeur de la liste pour la ville actuelle ; les résultats de la recherche ont leur position
const CURRENT = "current";

const results = ref<WeatherLocation[]>([]);
const loading = ref(false);
const failed = ref(false);
const locating = ref(false);
const locateError = ref("");

const feedback = computed(() => {
  if (locateError.value) return locateError.value;

  return failed.value ? "Recherche indisponible, réessayez plus tard" : "";
});

const DEVICE_NAME = "Ma position";

function locationLabel(location: WeatherLocation) {
  return location.detail ? `${location.name}, ${location.detail}` : location.name;
}

const options = computed(() => [
  {
    label: settings.value.mode === "device" ? DEVICE_NAME : locationLabel(settings.value.location),
    value: CURRENT,
  },
  ...results.value.map((location, index) => ({
    label: locationLabel(location),
    value: String(index),
  })),
]);

async function searchNow(query: string) {
  loading.value = true;

  try {
    results.value = await searchCities(query);
    failed.value = false;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

const searchLater = _.debounce(searchNow, SEARCH_DELAY);

function search(input: string) {
  const query = input.trim();

  if (query.length >= 2) {
    searchLater(query);
  } else {
    searchLater.cancel();
    results.value = [];
  }
}

function select(value: string) {
  const location = value === CURRENT ? null : results.value[Number(value)];

  if (location) {
    settings.value = { ...settings.value, mode: "city", location };
    results.value = [];
    locateError.value = "";
  }
}

async function locate() {
  locating.value = true;
  locateError.value = "";

  try {
    const coordinates = await locateDevice();
    settings.value = {
      ...settings.value,
      mode: "device",
      location: { name: DEVICE_NAME, detail: "", ...coordinates },
    };
  } catch (error) {
    const previous = settings.value.mode === "device" ? "la dernière position" : "la ville";
    locateError.value = `${(error as Error).message}, ${previous} reste affichée.`;
  } finally {
    locating.value = false;
  }
}

function updateUnit(unit: WeatherSettings["unit"]) {
  settings.value = { ...settings.value, unit };
}

onBeforeUnmount(() => searchLater.cancel());
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item
      :feedback="feedback"
      :validation-status="failed || locateError ? 'error' : undefined"
      label="Ville">
      <h-input-group>
        <h-select
          :loading="loading"
          :options="options"
          :value="CURRENT"
          filterable
          placeholder="Rechercher une ville"
          remote
          @search="search"
          @update:value="select" />
        <h-button
          :loading="locating"
          :type="settings.mode === 'device' ? 'primary' : 'default'"
          aria-label="Ma position"
          title="Ma position"
          @click="locate">
          <template #icon>
            <font-awesome-icon icon="location-arrow" />
          </template>
          <span class="locate-label">Ma position</span>
        </h-button>
      </h-input-group>
    </h-form-item>
    <h-form-item label="Unité">
      <h-radio-group :value="settings.unit" @update:value="updateUnit">
        <h-radio-button value="celsius">°C</h-radio-button>
        <h-radio-button value="fahrenheit">°F</h-radio-button>
      </h-radio-group>
    </h-form-item>
    <h-text depth="3">
      Prévisions fournies par Open-Meteo. Ma position est arrondie à environ 1&nbsp;km.
    </h-text>
  </h-form>
</template>

<style lang="scss" scoped>
@media (max-width: 480px) {
  .locate-label {
    display: none;
  }
}
</style>

<script lang="ts" setup>
import { computed, onBeforeUnmount, type PropType, ref } from "vue";
import _ from "lodash";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HRadioButton from "@/components/c/hRadioButton.vue";
import HRadioGroup from "@/components/c/hRadioGroup.vue";
import HSelect from "@/components/c/hSelect.vue";
import HText from "@/components/c/hText.vue";
import { searchCities } from "@/utils/weather";
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

const feedback = computed(() =>
  failed.value ? "Recherche indisponible, réessayez plus tard" : ""
);

function locationLabel(location: WeatherLocation) {
  return location.detail ? `${location.name}, ${location.detail}` : location.name;
}

// Ville actuelle en tête, puis les résultats de la recherche
const options = computed(() => [
  { label: locationLabel(settings.value.location), value: CURRENT },
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
    settings.value = { ...settings.value, location };
    results.value = [];
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
      :validation-status="failed ? 'error' : undefined"
      label="Ville">
      <h-select
        :loading="loading"
        :options="options"
        :value="CURRENT"
        filterable
        placeholder="Rechercher une ville"
        remote
        @search="search"
        @update:value="select" />
    </h-form-item>
    <h-form-item label="Unité">
      <h-radio-group :value="settings.unit" @update:value="updateUnit">
        <h-radio-button value="celsius">°C</h-radio-button>
        <h-radio-button value="fahrenheit">°F</h-radio-button>
      </h-radio-group>
    </h-form-item>
    <h-text depth="3">Prévisions fournies par Open-Meteo.</h-text>
  </h-form>
</template>

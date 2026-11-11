<script lang="ts" setup>
import { computed, ref } from "vue";
import { searchCities } from "@/lib/weather";
import type { WeatherLocation, WeatherSettings } from "@/types/Widget";

const settings = defineModel<WeatherSettings>("settings", { required: true });

const results = ref<WeatherLocation[]>([]);
const loading = ref(false);
const failed = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

// Ville actuelle en tête, puis les résultats de la recherche
const options = computed(() =>
  [settings.value.location, ...results.value].map((location, index) => ({
    label: location.detail ? `${location.name}, ${location.detail}` : location.name,
    value: index === 0 ? "current" : `${index - 1}`,
  }))
);

function search(query: string) {
  clearTimeout(searchTimer);
  if (query.trim().length < 2) {
    results.value = [];
    return;
  }

  searchTimer = setTimeout(async () => {
    loading.value = true;
    try {
      results.value = await searchCities(query.trim());
      failed.value = false;
    } catch {
      failed.value = true;
    } finally {
      loading.value = false;
    }
  }, 300);
}

function select(value: string) {
  const location = value === "current" ? null : results.value[Number(value)];
  if (location) {
    settings.value = { ...settings.value, location };
    results.value = [];
  }
}
</script>

<template>
  <n-form label-placement="top">
    <n-form-item
      :feedback="failed ? 'Recherche indisponible, réessayez plus tard' : ''"
      :validation-status="failed ? 'error' : undefined"
      label="Ville">
      <n-select
        :loading="loading"
        :options="options"
        filterable
        placeholder="Rechercher une ville"
        remote
        value="current"
        @search="search"
        @update:value="select" />
    </n-form-item>
    <n-form-item label="Unité">
      <n-radio-group
        :value="settings.unit"
        @update:value="(unit: WeatherSettings['unit']) => (settings = { ...settings, unit })">
        <n-radio-button value="celsius">°C</n-radio-button>
        <n-radio-button value="fahrenheit">°F</n-radio-button>
      </n-radio-group>
    </n-form-item>
    <n-text depth="3">Prévisions fournies par Open-Meteo.</n-text>
  </n-form>
</template>

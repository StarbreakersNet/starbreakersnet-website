import _ from "lodash";
import { computed, ref } from "vue";

export type LoaderInstance = ReturnType<typeof useLoader>;
export type LoaderCollection = Record<string, LoaderInstance>;

export function useLoader() {
  const count = ref(0);

  const loading = computed(() => count.value > 0);

  function start() {
    count.value++;
  }

  function stop() {
    if (count.value > 0) {
      count.value--;
    }
  }

  function reset() {
    count.value = 0;
  }

  return {
    count: count.value,
    loading,
    start,
    stop,
    reset,
  };
}

function prepareLoadersFromArray(loadersCollections: LoaderCollection[]) {
  let loadersFormated: Record<string, LoaderInstance> = {};

  loadersCollections.forEach((loaders, index) => {
    Object.entries(loaders).forEach(([key, loader]) => {
      loadersFormated[key + "#" + index] = loader;
    });
  });

  return loadersFormated;
}

export function getLoaderComputed(loaderCollection: LoaderCollection | LoaderCollection[]) {
  let loaders: Record<string, LoaderInstance> = {};

  if (Array.isArray(loaderCollection)) {
    loaders = prepareLoadersFromArray(loaderCollection);
  } else if (typeof loaderCollection === "object") {
    loaders = prepareLoadersFromArray([loaderCollection]);
  }

  let loaderList = Object.values(loaders).map((loader: LoaderInstance) => {
    return loader.loading.value;
  });

  return _.some(loaderList);
}

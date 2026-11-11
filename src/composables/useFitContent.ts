import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref, type WatchSource } from "vue";

// Pas d'ascenseur dans les widgets : le contenu est réduit juste assez pour tenir dans son cadre.
// L'élément observé doit masquer ce qui dépasse (overflow: hidden) et dimensionner son contenu en
// em à partir de font-size: calc(var(--fit) * …) ; on y écrit --fit, entre minScale et 1.
// Si le contenu dépasse encore à minScale, overflowing passe à true (dernière ligne estompée).

const STEPS = 6;

export interface FitState {
  scale: number;
  overflowing: boolean;
}

export function useFitContent(
  element: Ref<HTMLElement | null>,
  sources: WatchSource[],
  // onFit : appelé après chaque calcul, même si l'échelle n'a pas changé (contenu modifié)
  { minScale = 0.6, onFit }: { minScale?: number; onFit?: (state: FitState) => void } = {}
) {
  const scale = ref(1);
  const overflowing = ref(false);

  function overflows(target: HTMLElement) {
    return (
      target.scrollHeight > target.clientHeight + 1 || target.scrollWidth > target.clientWidth + 1
    );
  }

  function apply(target: HTMLElement, value: number) {
    target.style.setProperty("--fit", String(value));
  }

  // Recherche par dichotomie de la plus grande échelle qui tient (lectures de mise en page
  // synchrones, quelques itérations seulement)
  function fit() {
    const target = element.value;
    if (!target || target.clientHeight === 0) return;

    apply(target, 1);
    if (!overflows(target)) {
      scale.value = 1;
      overflowing.value = false;
      onFit?.({ scale: 1, overflowing: false });
      return;
    }

    let low = minScale;
    let high = 1;
    for (let step = 0; step < STEPS; step++) {
      const middle = (low + high) / 2;
      apply(target, middle);
      if (overflows(target)) {
        high = middle;
      } else {
        low = middle;
      }
    }

    apply(target, low);
    scale.value = Math.round(low * 100) / 100;
    overflowing.value = overflows(target);
    onFit?.({ scale: scale.value, overflowing: overflowing.value });
  }

  const resizeObserver = new ResizeObserver(() => fit());

  onMounted(() => {
    if (element.value) resizeObserver.observe(element.value);
    fit();
  });
  onBeforeUnmount(() => resizeObserver.disconnect());

  watch(sources, () => nextTick(fit), { deep: true });

  return { scale, overflowing, fit };
}

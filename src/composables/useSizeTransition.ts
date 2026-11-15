import { computed, nextTick, toValue, type MaybeRefOrGetter } from "vue";

export type SizeTransitionMode = "width" | "height";

export function useSizeTransition(
  mode: MaybeRefOrGetter<SizeTransitionMode>,
  raw: MaybeRefOrGetter<boolean>
) {
  const naturalSizes = new WeakMap<HTMLElement, number>();
  const maxDimension = computed(() => `max-${toValue(mode)}`);

  function getNaturalSize(element: HTMLElement) {
    return toValue(mode) === "width" ? element.scrollWidth : element.scrollHeight;
  }

  function resetSize(element: HTMLElement) {
    element.style.setProperty(maxDimension.value, "");
    element.style.overflow = "";
    naturalSizes.delete(element);
  }

  async function handleBeforeEnter(el: Element) {
    if (!toValue(raw)) {
      const element = el as HTMLElement;
      await nextTick();
      const naturalSize = getNaturalSize(element);

      element.style.setProperty(maxDimension.value, "none");
      element.style.visibility = "hidden";

      naturalSizes.set(element, naturalSize);

      element.style.setProperty(maxDimension.value, "0");
      element.style.visibility = "visible";
    }
  }

  async function handleEnter(el: Element) {
    if (!toValue(raw)) {
      const element = el as HTMLElement;
      await nextTick();
      const naturalSize = naturalSizes.get(element);

      if (naturalSize) {
        void element.offsetHeight; // Forcer un reflow

        element.style.setProperty(maxDimension.value, naturalSize + "px");
        element.style.overflow = "hidden";
      }
    }
  }

  async function handleAfterEnter(el: Element) {
    if (!toValue(raw)) {
      await nextTick();
      resetSize(el as HTMLElement);
    }
  }

  async function handleBeforeLeave(el: Element) {
    if (!toValue(raw)) {
      const element = el as HTMLElement;
      await nextTick();
      const naturalSize = getNaturalSize(element);

      naturalSizes.set(element, naturalSize);

      element.style.setProperty(maxDimension.value, naturalSize + "px");
      element.style.overflow = "hidden";
    }
  }

  async function handleLeave(el: Element) {
    if (!toValue(raw)) {
      const element = el as HTMLElement;
      await nextTick();

      void element.offsetHeight; // Forcer un reflow

      element.style.setProperty(maxDimension.value, "0");
    }
  }

  async function handleAfterLeave(el: Element) {
    if (!toValue(raw)) {
      await nextTick();
      resetSize(el as HTMLElement);
    }
  }

  return {
    handleBeforeEnter,
    handleEnter,
    handleAfterEnter,
    handleBeforeLeave,
    handleLeave,
    handleAfterLeave,
  };
}

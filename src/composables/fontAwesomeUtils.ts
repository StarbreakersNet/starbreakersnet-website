import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { NIcon } from "naive-ui";
import { h } from "vue";

export function renderNaiveFontAwesomeIcon(option: any) {
  if (option.fas) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["fas", option.fas] }));
  } else if (option.far) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["far", option.far] }));
  } else if (option.fab) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["fab", option.fab] }));
  } else {
    return null;
  }
}

export function renderedFontAwesomeIcon(iconArray: string[]) {
  return () => h(NIcon, null, () => h(FontAwesomeIcon, { icon: iconArray }));
}

import type { Component } from "vue";
import type { WidgetType } from "@/types/Widget";
import ClockWidget from "@/components/widgets/ClockWidget.vue";
import CalendarSettingsForm from "@/components/widgets/CalendarSettingsForm.vue";
import CalendarWidget from "@/components/widgets/CalendarWidget.vue";
import ClockSettingsForm from "@/components/widgets/ClockSettingsForm.vue";
import CountdownSettingsForm from "@/components/widgets/CountdownSettingsForm.vue";
import CountdownWidget from "@/components/widgets/CountdownWidget.vue";
import LinksWidget from "@/components/widgets/LinksWidget.vue";
import LinksSettingsForm from "@/components/widgets/LinksSettingsForm.vue";
import MarkdownWidget from "@/components/widgets/MarkdownWidget.vue";
import MarkdownSettingsForm from "@/components/widgets/MarkdownSettingsForm.vue";
import WeatherSettingsForm from "@/components/widgets/WeatherSettingsForm.vue";
import WeatherWidget from "@/components/widgets/WeatherWidget.vue";

// Composants de chaque type de widget : affichage (props settings et size) et formulaire de
// réglages (v-model:settings). Les métadonnées sont dans models/widgets.ts.
export const WIDGET_COMPONENTS: Record<WidgetType, { view: Component; settings: Component }> = {
  clock: { view: ClockWidget, settings: ClockSettingsForm },
  markdown: { view: MarkdownWidget, settings: MarkdownSettingsForm },
  links: { view: LinksWidget, settings: LinksSettingsForm },
  weather: { view: WeatherWidget, settings: WeatherSettingsForm },
  countdown: { view: CountdownWidget, settings: CountdownSettingsForm },
  calendar: { view: CalendarWidget, settings: CalendarSettingsForm },
};

import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/lib/supabaseClient";
import { useMessage } from "@/composables/useMessage";
import {
  createId,
  defaultWidgets,
  findFreeSpot,
  fits,
  normalizeDocument,
  toDocument,
  WIDGET_DEFINITIONS,
  WIDGET_SIZES,
  widgetRect,
} from "@/models/widgets";
import { DEFAULT_WALLPAPER, normalizeWallpaper } from "@/models/wallpapers";
import { deleteWallpaperFile } from "@/lib/wallpaperFile";
import type { FitState } from "@/composables/useFitContent";
import type { Wallpaper } from "@/types/Wallpaper";
import type { Widget, WidgetSettingsMap, WidgetSize, WidgetType } from "@/types/Widget";

const STORAGE_KEY = "widgets";
// Délai avant d'enregistrer sur le compte : un déplacement ou une saisie n'envoie qu'une requête
const REMOTE_SAVE_DELAY = 800;
// En dessous de cette échelle, le texte d'un widget qu'on modifie devient trop petit : taille du dessus
const GROW_BELOW_SCALE = 0.85;

function readLocal(): { widgets: Widget[] | null; wallpaper: Wallpaper } {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const raw = value ? JSON.parse(value) : null;
    return { widgets: normalizeDocument(raw), wallpaper: normalizeWallpaper(raw?.wallpaper) };
  } catch {
    return { widgets: null, wallpaper: DEFAULT_WALLPAPER };
  }
}

function writeLocal(widgets: Widget[], wallpaper: Wallpaper) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toDocument(widgets, wallpaper)));
  } catch {
    // Pas de persistance locale possible : les widgets restent valables pour la session
  }
}

// Widgets de la page Bureau. Comme le thème (stores/settings.ts) : la copie du compte l'emporte à
// la connexion, la copie locale sert aux visiteurs et au premier affichage.
export const useWidgetsStore = defineStore("widgets", () => {
  const message = useMessage();

  const local = readLocal();
  const widgets = ref<Widget[]>(local.widgets ?? defaultWidgets());
  const wallpaper = ref<Wallpaper>(local.wallpaper);

  // Compte sur lequel enregistrer, connu une fois ses widgets chargés (null pour un visiteur, ou si
  // la colonne user_settings.widgets n'existe pas encore : front déployé avant la migration)
  let accountId: string | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  // Modification pas encore envoyée : un rechargement du compte ne doit pas l'écraser
  let savePending = false;

  async function load(userId: string) {
    accountId = null;
    const { data, error } = await supabase
      .from("user_settings")
      .select("widgets")
      .eq("user_id", userId)
      .maybeSingle();

    // En cas d'erreur, on garde simplement les widgets locaux, sans enregistrer sur le compte
    if (error || !data) return;

    accountId = userId;
    const remote = normalizeDocument(data.widgets);

    if (remote) {
      if (savePending) {
        scheduleRemoteSave();
        return;
      }
      widgets.value = remote;
      wallpaper.value = normalizeWallpaper(data.widgets?.wallpaper);
      writeLocal(remote, wallpaper.value);
    } else {
      // Premier passage du membre : son bureau actuel (local ou par défaut) devient celui du compte
      scheduleRemoteSave(0);
    }
  }

  // Déconnexion : on garde le bureau affiché, qui n'est plus enregistré que dans le navigateur
  function unload() {
    clearTimeout(saveTimer);
    savePending = false;
    accountId = null;
  }

  function scheduleRemoteSave(delay = REMOTE_SAVE_DELAY) {
    if (!accountId) return;
    const userId = accountId;

    clearTimeout(saveTimer);
    savePending = true;
    saveTimer = setTimeout(async () => {
      savePending = false;
      const { error } = await supabase
        .from("user_settings")
        .update({ widgets: toDocument(widgets.value, wallpaper.value) })
        .eq("user_id", userId);

      if (error) {
        message.error("Impossible d'enregistrer vos widgets sur votre compte");
      }
    }, delay);
  }

  function persist() {
    writeLocal(widgets.value, wallpaper.value);
    scheduleRemoteSave();
  }

  // Nouveau fond d'écran. Un fichier de l'ordinateur remplacé est supprimé du navigateur.
  function setWallpaper(next: Wallpaper) {
    if (wallpaper.value.source === "file" && next.source !== "file") {
      deleteWallpaperFile();
    }
    wallpaper.value = next;
    persist();
  }

  function others(id?: string) {
    return widgets.value.filter(widget => widget.id !== id).map(widgetRect);
  }

  function add(type: WidgetType, size?: WidgetSize) {
    const definition = WIDGET_DEFINITIONS[type];
    const widgetSize = size && definition.sizes.includes(size) ? size : definition.defaultSize;
    const widget = {
      id: createId(),
      type,
      size: widgetSize,
      ...findFreeSpot(widgetSize, others()),
      settings: definition.defaultSettings(),
    } as Widget;

    widgets.value.push(widget);
    persist();
    return widget;
  }

  function remove(id: string) {
    widgets.value = widgets.value.filter(widget => widget.id !== id);
    persist();
  }

  // Nouvelle taille : même place si elle tient, sinon la première place libre
  function resize(id: string, size: WidgetSize) {
    const widget = widgets.value.find(item => item.id === id);
    if (!widget || widget.size === size) return;

    const rect = { x: widget.x, y: widget.y, ...WIDGET_SIZES[size] };
    const position = fits(rect, others(id))
      ? { x: widget.x, y: widget.y }
      : findFreeSpot(size, others(id));

    Object.assign(widget, { size, ...position });
    persist();
  }

  function updateSettings<T extends WidgetType>(id: string, settings: WidgetSettingsMap[T]) {
    const widget = widgets.value.find(item => item.id === id);
    if (!widget) return;

    widget.settings = settings;
    growingId.value = id;
    persist();
  }

  // Widget dont on modifie le contenu : s'il ne tient plus qu'en réduisant trop son texte, il passe
  // à la taille du dessus (s'il en a une). Seulement pendant ses réglages, pour qu'une fenêtre plus
  // étroite ne change jamais la disposition enregistrée : le contenu est alors juste réduit.
  const growingId = ref<string | null>(null);

  function growIfCramped(id: string, { scale, overflowing }: FitState) {
    if (growingId.value !== id || (scale >= GROW_BELOW_SCALE && !overflowing)) return;

    const widget = widgets.value.find(item => item.id === id);
    if (!widget) return;

    const sizes = WIDGET_DEFINITIONS[widget.type].sizes;
    const next = sizes[sizes.indexOf(widget.size) + 1];
    if (next) resize(id, next);
  }

  function stopGrowing() {
    growingId.value = null;
  }

  // Positions après un glisser-déposer sur la grille
  function move(positions: { id: string; x: number; y: number }[]) {
    let changed = false;

    for (const { id, x, y } of positions) {
      const widget = widgets.value.find(item => item.id === id);
      if (widget && (widget.x !== x || widget.y !== y)) {
        widget.x = x;
        widget.y = y;
        changed = true;
      }
    }

    if (changed) persist();
  }

  function reset() {
    widgets.value = defaultWidgets();
    persist();
  }

  return {
    widgets,
    wallpaper,
    setWallpaper,
    load,
    unload,
    add,
    remove,
    resize,
    updateSettings,
    growIfCramped,
    stopGrowing,
    move,
    reset,
  };
});

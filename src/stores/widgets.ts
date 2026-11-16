import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import _ from "lodash";
import { supabase } from "@/utils/supabaseClient";
import { useAppMessage } from "@/composables/useAppMessage";
import { createId } from "@/utils/id";
import { defaultWidgets, normalizeDocument, toDocument } from "@/utils/widgetDocument";
import { findFreeSpot, fits, widgetRect } from "@/utils/widgetGrid";
import { WIDGET_DEFINITIONS } from "@/models/WidgetDefinition";
import { WIDGET_SIZES } from "@/models/WidgetSize";
import { DEFAULT_WALLPAPER } from "@/models/WallpaperPreset";
import { normalizeUnsplashKey, normalizeWallpaper } from "@/utils/wallpaper";
import {
  deleteWallpaperFile,
  loadWallpaperFile,
  saveWallpaperFile,
  WALLPAPER_REMOTE_MAX_SIZE,
} from "@/utils/wallpaperFile";
import type { FitState } from "@/composables/useFitContent";
import type { FileWallpaper, MediaKind, Wallpaper } from "@/types/Wallpaper";
import type {
  GridPosition,
  Widget,
  WidgetSettingsMap,
  WidgetSize,
  WidgetType,
} from "@/types/Widget";

const STORAGE_KEY = "widgets";

const WALLPAPER_BUCKET = "wallpapers";

// Délai avant d'enregistrer sur le compte : un déplacement ou une saisie n'envoie qu'une requête
const REMOTE_SAVE_DELAY = 800;

// En dessous de cette échelle, le texte d'un widget qu'on modifie devient trop petit : taille du dessus
const GROW_BELOW_SCALE = 0.85;

function readLocal(): { widgets: Widget[] | null; wallpaper: Wallpaper; unsplashKey: string } {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const raw = value ? JSON.parse(value) : null;

    return {
      widgets: normalizeDocument(raw),
      wallpaper: normalizeWallpaper(raw?.wallpaper),
      unsplashKey: normalizeUnsplashKey(raw?.unsplashKey),
    };
  } catch {
    return { widgets: null, wallpaper: DEFAULT_WALLPAPER, unsplashKey: "" };
  }
}

function writeLocal(widgets: Widget[], wallpaper: Wallpaper, unsplashKey: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toDocument(widgets, wallpaper, unsplashKey)));
  } catch {
    // Pas de persistance locale possible : les widgets restent valables pour la session
  }
}

// Widgets de Buroh. Comme le thème (stores/settings.ts) : la copie du compte l'emporte à
// la connexion, la copie locale sert aux visiteurs et au premier affichage.
export const useWidgetsStore = defineStore("widgets", () => {
  const message = useAppMessage();

  const local = readLocal();
  const widgets = ref<Widget[]>(local.widgets ?? defaultWidgets());
  const wallpaper = ref<Wallpaper>(local.wallpaper);
  const unsplashKey = ref(local.unsplashKey);

  // Compte sur lequel enregistrer, connu une fois ses widgets chargés (null pour un visiteur, ou si
  // la colonne user_settings.widgets n'existe pas encore : front déployé avant la migration)
  let accountId: string | null = null;

  // Modification pas encore envoyée : un rechargement du compte ne doit pas l'écraser
  let savePending = false;

  // --- Enregistrement sur le compte

  async function saveRemote() {
    savePending = false;

    if (accountId) {
      const { error } = await supabase
        .from("user_settings")
        .update({ widgets: toDocument(widgets.value, wallpaper.value, unsplashKey.value) })
        .eq("user_id", accountId);

      if (error) {
        message.error("Impossible d'enregistrer vos widgets sur votre compte");
      }
    }
  }

  // Une série de modifications rapprochées (glisser-déposer, saisie) n'envoie qu'une requête
  const saveRemoteLater = _.debounce(saveRemote, REMOTE_SAVE_DELAY);

  function scheduleRemoteSave() {
    if (accountId) {
      savePending = true;
      saveRemoteLater();
    }
  }

  function persist() {
    writeLocal(widgets.value, wallpaper.value, unsplashKey.value);
    scheduleRemoteSave();
  }

  async function load(userId: string) {
    accountId = null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("widgets")
      .eq("user_id", userId)
      .maybeSingle();

    // En cas d'erreur, on garde simplement les widgets locaux, sans enregistrer sur le compte
    if (!error && data) {
      accountId = userId;

      const remote = normalizeDocument(data.widgets);

      if (!remote || savePending) {
        // Premier passage du membre, ou modification en attente : le Buroh affiché devient celui du
        // compte
        scheduleRemoteSave();
      } else {
        widgets.value = remote;
        wallpaper.value = normalizeWallpaper(data.widgets?.wallpaper);
        unsplashKey.value = normalizeUnsplashKey(data.widgets?.unsplashKey);
        writeLocal(remote, wallpaper.value, unsplashKey.value);
      }

      syncWallpaperFile();
    }
  }

  // Déconnexion : on garde le Buroh affiché, qui n'est plus enregistré que dans le navigateur
  function unload() {
    saveRemoteLater.cancel();
    savePending = false;
    accountId = null;
  }

  // --- Fond d'écran

  // Fichier de l'ordinateur affiché en fond, relu du navigateur ou récupéré du compte
  const wallpaperFile = shallowRef<Blob | null>(null);
  let wallpaperFileAddedAt: string | null = null;
  let syncCount = 0;
  let uploadingAddedAt: string | null = null;

  // Le chemin d'un autre compte (Buroh gardé dans le navigateur après un changement de compte) ne
  // compte pas : le fichier est renvoyé sur celui-ci
  function remotePath(current: FileWallpaper) {
    return accountId && current.path?.startsWith(`${accountId}/`) ? current.path : null;
  }

  function isCurrentFile(current: FileWallpaper) {
    return wallpaper.value.source === "file" && wallpaper.value.addedAt === current.addedAt;
  }

  async function removeRemoteFile(path: string) {
    const { error } = await supabase.storage.from(WALLPAPER_BUCKET).remove([path]);

    if (error) {
      console.warn("Suppression du fond d'écran du compte", error);
    }
  }

  async function downloadWallpaperFile(current: FileWallpaper, path: string) {
    const { data, error } = await supabase.storage.from(WALLPAPER_BUCKET).download(path);

    if (error) {
      console.warn("Récupération du fond d'écran du compte", error);
    } else {
      await saveWallpaperFile(data, current.addedAt).catch(() => undefined);
    }

    return data;
  }

  async function uploadWallpaperFile(file: Blob, current: FileWallpaper, userId: string) {
    const path = `${userId}/${createId()}`;

    uploadingAddedAt = current.addedAt;

    const { error } = await supabase.storage
      .from(WALLPAPER_BUCKET)
      .upload(path, file, { contentType: file.type });

    uploadingAddedAt = null;

    if (error) {
      console.warn("Envoi du fond d'écran sur le compte", error);
    } else if (accountId === userId && isCurrentFile(current)) {
      wallpaper.value = { ...current, path };
      persist();
      saveRemoteLater.flush();
    } else {
      removeRemoteFile(path);
    }

    return !error;
  }

  // Fichier du navigateur pas encore sur le compte : envoyé. notify : seulement quand le membre
  // vient de le choisir, pas à chaque chargement de la page
  async function uploadIfMissing(file: Blob, current: FileWallpaper, notify: boolean) {
    const userId = accountId;
    const missing = userId !== null && !remotePath(current);
    const tooLarge = file.size > WALLPAPER_REMOTE_MAX_SIZE;

    if (missing && tooLarge && notify) {
      message.info(
        "Fichier de plus de 50 Mo : il reste dans ce navigateur, sans être enregistré sur votre compte"
      );
    }

    if (missing && !tooLarge && uploadingAddedAt !== current.addedAt) {
      const uploaded = await uploadWallpaperFile(file, current, userId);

      if (!uploaded && notify) {
        message.warning(
          "Impossible d'enregistrer ce fond d'écran sur votre compte : il reste dans ce navigateur"
        );
      }
    }
  }

  async function readWallpaperFile(current: FileWallpaper) {
    const path = remotePath(current);
    let file =
      wallpaperFileAddedAt === current.addedAt
        ? wallpaperFile.value
        : await loadWallpaperFile(current.addedAt, current.name);

    if (!file && path) {
      file = await downloadWallpaperFile(current, path);
    }

    return file;
  }

  async function syncWallpaperFile(notify = false) {
    const current = wallpaper.value;
    const count = ++syncCount;
    const file = current.source === "file" ? await readWallpaperFile(current) : null;

    // Fond changé pendant la lecture : la synchronisation suivante décide
    if (count === syncCount) {
      wallpaperFile.value = file;
      wallpaperFileAddedAt = current.source === "file" ? current.addedAt : null;

      if (file && current.source === "file") {
        await uploadIfMissing(file, current, notify);
      }
    }
  }

  // Un fichier de l'ordinateur remplacé est supprimé du navigateur et du compte
  function applyWallpaper(next: Wallpaper) {
    const previous = wallpaper.value;
    const previousPath = previous.source === "file" ? remotePath(previous) : null;

    if (previous.source === "file" && next.source !== "file") {
      deleteWallpaperFile();
    }

    if (previousPath && !(next.source === "file" && next.path === previousPath)) {
      removeRemoteFile(previousPath);
    }

    wallpaper.value = next;
    persist();
  }

  function setWallpaper(next: Wallpaper) {
    applyWallpaper(next);
    syncWallpaperFile();
  }

  async function setWallpaperFile(file: File, kind: MediaKind) {
    const addedAt = new Date().toISOString();
    let saved = true;

    try {
      await saveWallpaperFile(file, addedAt);
    } catch {
      saved = false;
      message.error("Impossible d'enregistrer ce fichier dans le navigateur");
    }

    if (saved) {
      applyWallpaper({ source: "file", kind, name: file.name, addedAt, path: null });
      await syncWallpaperFile(true);
    }

    return saved;
  }

  // Avant la suppression du compte : ses fichiers ne partent pas avec lui
  async function removeAccountFiles() {
    if (accountId) {
      const bucket = supabase.storage.from(WALLPAPER_BUCKET);
      const { data } = await bucket.list(accountId);

      if (data?.length) {
        await bucket.remove(data.map(file => `${accountId}/${file.name}`));
      }
    }
  }

  function setUnsplashKey(key: string) {
    unsplashKey.value = normalizeUnsplashKey(key);
    persist();
  }

  // --- Widgets

  function find(id: string) {
    return widgets.value.find(widget => widget.id === id);
  }

  function others(id?: string) {
    return widgets.value.filter(widget => widget.id !== id).map(widgetRect);
  }

  function add(type: WidgetType, size?: WidgetSize) {
    const definition = WIDGET_DEFINITIONS[type];
    const allowed = size !== undefined && definition.sizes.includes(size);
    const widgetSize = allowed ? size : definition.defaultSize;

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
    const widget = find(id);

    if (widget && widget.size !== size) {
      const rect = { x: widget.x, y: widget.y, ...WIDGET_SIZES[size] };
      const samePlace = fits(rect, others(id));
      const position = samePlace ? { x: widget.x, y: widget.y } : findFreeSpot(size, others(id));

      widget.size = size;
      widget.x = position.x;
      widget.y = position.y;
      persist();
    }
  }

  function updateSettings<T extends WidgetType>(id: string, settings: WidgetSettingsMap[T]) {
    const widget = find(id);

    if (widget) {
      widget.settings = settings;
      growingId.value = id;
      persist();
    }
  }

  // Widget dont on modifie le contenu : s'il ne tient plus qu'en réduisant trop son texte, il passe
  // à la taille du dessus (s'il en a une). Seulement pendant ses réglages, pour qu'une fenêtre plus
  // étroite ne change jamais la disposition enregistrée : le contenu est alors juste réduit.
  const growingId = ref<string | null>(null);

  function growIfCramped(id: string, { scale, overflowing }: FitState) {
    const cramped = scale < GROW_BELOW_SCALE || overflowing;
    const widget = growingId.value === id && cramped ? find(id) : undefined;

    if (widget) {
      const sizes = WIDGET_DEFINITIONS[widget.type].sizes;
      const next = sizes[sizes.indexOf(widget.size) + 1];

      if (next) {
        resize(id, next);
      }
    }
  }

  function stopGrowing() {
    growingId.value = null;
  }

  // Positions après un glisser-déposer, sur la grille de l'ordinateur ou sur celle du mobile (qui ne
  // change pas la disposition de l'ordinateur)
  function move(positions: GridPosition[], grid: "desktop" | "mobile") {
    let changed = false;

    for (const { id, x, y } of positions) {
      const widget = find(id);

      if (widget && grid === "mobile" && (widget.mobile?.x !== x || widget.mobile?.y !== y)) {
        widget.mobile = { x, y };
        changed = true;
      }

      if (widget && grid === "desktop" && (widget.x !== x || widget.y !== y)) {
        widget.x = x;
        widget.y = y;
        changed = true;
      }
    }

    if (changed) {
      persist();
    }
  }

  function reset() {
    widgets.value = defaultWidgets();
    persist();
  }

  syncWallpaperFile();

  return {
    widgets,
    wallpaper,
    wallpaperFile,
    setWallpaper,
    setWallpaperFile,
    removeAccountFiles,
    unsplashKey,
    setUnsplashKey,
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

// Export/import JSON de la config (case 21), contrat repris à la source :
// utils/stringify.ts (export ordonné d'après les clés des défauts),
// utils/parse.ts (JSON.parse silencieux), settings.ts l.1442-1505 (relecture
// avec repli base64 des anciennes versions, import refusé sans clé des défauts)
// et compatibility/apply.ts l.25-43 (fusion quand les comptes de clés
// diffèrent, remplacement sinon).
import { DEFAULTS, deepMerge, type BonjourrConfig } from "./config";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `flattenKeys` (stringify.ts l.38-50). */
function flattenKeys(obj: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    keys.push(key);
    const value = obj[key];
    if (isObject(value)) {
      for (const sub of flattenKeys(value)) {
        keys.push(`${key}.${sub}`);
      }
    }
  }
  return keys;
}

/**
 * `stringify` (stringify.ts l.6-36), sans `bundleLinks` (le fork garde les
 * liens dans la config) : les clés de l'export sont triées d'après l'ordre
 * aplati des défauts, ce qui rend la sortie déterministe. Le tableau de
 * `JSON.stringify` ne filtrant que par nom de propriété, les propriétés des
 * objets rangés dans des tableaux (liens, notes) sont ajoutées en fin de
 * liste, sinon l'export les viderait.
 */
export function exportConfig(config: BonjourrConfig): string {
  const defaults = JSON.parse(JSON.stringify(DEFAULTS)) as Record<string, unknown>;
  const data = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;

  for (const [key, value] of Object.entries(data)) {
    const fallback = defaults[key];
    defaults[key] = isObject(value) && isObject(fallback) ? { ...fallback, ...value } : value;
  }

  const keys = flattenKeys(defaults);

  const extras: string[] = [];
  const seen = new Set(keys);
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (isObject(value)) {
      for (const [key, sub] of Object.entries(value)) {
        if (!seen.has(key)) {
          seen.add(key);
          extras.push(key);
        }
        collect(sub);
      }
    }
  };
  collect(data);

  return JSON.stringify(data, [...keys, ...extras], 2);
}

/**
 * `parse` (parse.ts l.1-9) avec le repli base64 de `decodeExportFile`
 * (settings.ts l.1466-1483) : JSON.parse direct, puis décodage `atob` des
 * anciennes exportations. `undefined` sur chaîne indéchiffrable.
 */
export function parseConfig(text: string): Partial<BonjourrConfig> | undefined {
  try {
    return JSON.parse(atob(text)) as Partial<BonjourrConfig>;
  } catch {
    try {
      return JSON.parse(text) as Partial<BonjourrConfig>;
    } catch {
      return undefined;
    }
  }
}

/** Garde-fou de `loadImportFile` (settings.ts l.1500-1502) : au moins une clé des défauts. */
export function isImportable(parsed: unknown): parsed is Partial<BonjourrConfig> {
  return isObject(parsed) && Object.keys(DEFAULTS).some((key) => key in parsed);
}

/**
 * `filterData('import')` (apply.ts l.25-43) restreint au fork : comptes de
 * clés différents -> fusion profonde sur la config courante ; comptes
 * identiques -> remplacement (quirk de la source, conservé).
 */
export function mergeConfig(
  current: BonjourrConfig,
  imported: Partial<BonjourrConfig>,
): BonjourrConfig {
  if (Object.keys(imported).length !== Object.keys(current).length) {
    const base = JSON.parse(JSON.stringify(current)) as Record<string, unknown>;
    deepMerge(base, imported as Record<string, unknown>);
    return base as unknown as BonjourrConfig;
  }
  return JSON.parse(JSON.stringify(imported)) as BonjourrConfig;
}

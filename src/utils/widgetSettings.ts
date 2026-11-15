import { createId } from "@/utils/id";
import { normalizeUrl } from "@/utils/url";
import type { LinkItem, WeatherLocation } from "@/types/Widget";

export function normalizeLocation(raw: unknown): WeatherLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const location = raw as Record<string, unknown>;
  const { latitude, longitude } = location;

  if (
    typeof location.name !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return {
    name: location.name.slice(0, 80),
    detail: typeof location.detail === "string" ? location.detail.slice(0, 120) : "",
    latitude,
    longitude,
  };
}

export function normalizeLink(raw: unknown): LinkItem[] {
  if (!raw || typeof raw !== "object") return [];
  const link = raw as Record<string, unknown>;
  const url = typeof link.url === "string" ? normalizeUrl(link.url) : null;
  if (!url) return [];

  return [
    {
      id: typeof link.id === "string" ? link.id : createId(),
      title: typeof link.title === "string" ? link.title.slice(0, 40) : "",
      url,
    },
  ];
}

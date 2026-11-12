/// <reference types="vite/client" />
import type { MessageApi, NotificationApi } from "naive-ui";

declare global {
  interface Window {
    $message: MessageApi;
    $notification: NotificationApi;
  }
}

// Variables de thème propres au projet, lues via useThemeVars() (ex. hButton, prop `accent`)
declare module "naive-ui" {
  interface CustomThemeCommonVars {
    accentColor?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  // Facultatif : thèmes des photos Unsplash de Buroh (lib/unsplash.ts)
  readonly VITE_UNSPLASH_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

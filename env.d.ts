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
  readonly VITE_API_URL: string;
  readonly VITE_API_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

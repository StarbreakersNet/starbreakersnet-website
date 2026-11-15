/// <reference types="vite/client" />
import type { MessageApi, NotificationApi } from "naive-ui";

declare global {
  interface Window {
    $message: MessageApi;
    $notification: NotificationApi;
  }
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

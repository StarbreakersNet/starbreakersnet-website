/// <reference types="vite/client" />
import type { MessageApi, NotificationApi } from "naive-ui";

declare global {
  interface Window {
    $message: MessageApi;
    $notification: NotificationApi;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

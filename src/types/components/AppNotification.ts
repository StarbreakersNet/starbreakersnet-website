import type { VNodeChild } from "vue";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationOptions {
  title: string;
  content?: string | (() => VNodeChild);
  duration?: number;
  type?: NotificationType;
  closable?: boolean;
  keepAliveOnHover?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  clickIcon?: string;
  avatar?: () => VNodeChild;
  action?: () => VNodeChild;
}

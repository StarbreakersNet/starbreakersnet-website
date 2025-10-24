import type { VNodeChild } from "vue";

export type NotificationType = "info" | "success" | "warning" | "error" | "primary" | "accent" | undefined;
export type NaiveNotificationType = "info" | "success" | "warning" | "error" | "default" | undefined;

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
    style?: string;
}

export interface EventSourceDataType {
    type: "message" | "conversation";
    id: string;
    title: string;
    from: string;
    conversationType: string;
}

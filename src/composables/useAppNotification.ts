import hButton from "@/components/c/hButton.vue";
import hFlex from "@/components/c/hFlex.vue";
import { renderedFontAwesomeIcon } from "@/utils/naiveIcons";
import { CONTACT_EMAIL } from "@/utils/contact";
import type {
  NaiveNotificationType,
  NotificationOptions,
  NotificationType,
} from "@/types/components/AppNotification";
import { DateTime } from "luxon";
import type {
  NotificationApi,
  NotificationOptions as NaiveNotificationOptions,
  NotificationReactive,
} from "naive-ui";
import { h } from "vue";

type SentryWindow = Window & { Sentry?: { captureMessage: (message: string) => void } };

const ERROR_DESCRIPTION = `Si le problème persiste, écrivez-nous à ${CONTACT_EMAIL}`;

// Les stores ne sont pas sous le n-notification-provider : AppLayout transmet ici l'API du provider
let notificationApi: NotificationApi | undefined;

export function registerNotificationApi(api: NotificationApi) {
  notificationApi = api;
}

function getNotificationApi() {
  if (notificationApi) {
    return notificationApi;
  }
  throw new Error(
    "useAppNotification : l'API du n-notification-provider n'est pas encore enregistrée par AppLayout"
  );
}

function getNaiveType(type: NotificationType): NaiveNotificationType {
  switch (type) {
    case undefined:
      return undefined;
    case "primary":
      return "default";
    case "accent":
      return "default";
    default:
      return type as NaiveNotificationType;
  }
}

export function useAppNotification() {
  function custom(options: NotificationOptions): NotificationReactive {
    const clickIcon = options.clickIcon || "arrow-up-right-from-square";

    function getMinimalContent() {
      if (typeof options.content === "function") {
        return options.content();
      } else if (options.content) {
        return options.content;
      } else {
        return DateTime.now().toLocaleString(DateTime.DATETIME_MED);
      }
    }

    function getPreparedContent() {
      return h(hFlex, { justify: "space-between" }, () => [
        h(hFlex, { vertical: true }, getMinimalContent),
        options.onClick &&
          h(
            hButton,
            {
              circle: true,
              color: "default",
              secondary: true,
              onClick: options.onClick,
            },
            {
              icon: () => h(renderedFontAwesomeIcon(["fas", clickIcon])),
            }
          ),
      ]);
    }

    const notificationOptions: NaiveNotificationOptions = {
      title: () =>
        h(
          "div",
          {
            class: `notification-${options.type || "default"}`,
          },
          options.title
        ),
      content: getPreparedContent,
      type: getNaiveType(options.type) ?? "default",
      duration: options.duration || 2000,
      closable: options.closable ?? true,
      keepAliveOnHover: options.keepAliveOnHover ?? true,
      onClose: options.onClose,
      avatar: options.avatar,
      action: options.action,
    };

    return getNotificationApi().create(notificationOptions);
  }

  function success(message: string, duration = 2000): NotificationReactive {
    return custom({
      title: message,
      duration,
      type: "success",
    });
  }

  function error(message: string, error?: Error, duration = 10000): NotificationReactive | void {
    custom({
      title: message,
      content: ERROR_DESCRIPTION,
      duration,
      type: "error",
    });

    if (typeof window !== "undefined") {
      (window as SentryWindow).Sentry?.captureMessage(message);
    }

    if (error instanceof Error) {
      error.message = error.message + " (" + message + ")";
      throw error;
    } else {
      console.error(message);
    }
  }

  function warning(message: string, duration = 4000): NotificationReactive {
    return custom({
      title: message,
      duration,
      type: "warning",
    });
  }

  function info(message: string, duration = 3000): NotificationReactive {
    return custom({
      title: message,
      duration,
      type: "info",
    });
  }

  function message(
    title: string,
    content: string,
    url?: string,
    from?: string,
    duration = 6000
  ): NotificationReactive {
    const onClickAction = url
      ? () => {
          window.open(url, "_blank");
        }
      : undefined;

    return custom({
      title,
      content: () =>
        h(hFlex, { vertical: true }, () => [
          h("div", { class: "tw:font-medium" }, "De : " + from),
          h("div", {}, "Objet : " + content),
        ]),
      duration,
      type: "accent",
      avatar: renderedFontAwesomeIcon(["fas", "message"]),
      onClick: onClickAction,
      clickIcon: "arrow-up-right-from-square",
    });
  }

  return {
    custom,
    success,
    error,
    warning,
    info,
    message,
  };
}

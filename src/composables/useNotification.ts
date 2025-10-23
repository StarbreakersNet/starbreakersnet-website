import hButton from "@/components/c/hButton.vue";
import hFlex from "@/components/c/hFlex.vue";
import { renderedFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";
import type {
    NaiveNotificationType,
    NotificationOptions,
    NotificationType,
} from "@/types/components/AppNotification.ts";
import { AxiosError } from "axios";
import { DateTime } from "luxon";
import type { NotificationOptions as NaiveNotificationOptions, NotificationReactive } from "naive-ui";
import { computed, h } from "vue";

const ERROR_DESCRIPTION = "Si le problème persiste, veuillez contacter supporthermes@investissement.valority.com";

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

export function useNotification() {
    const notification = computed(() => window.$notification);

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
            return h(hFlex,
                { justify: "space-between" },
                () => [
                    h(hFlex, { vertical: true }, getMinimalContent),
                    options.onClick && h(hButton, {
                        circle: true,
                        color: "default",
                        secondary: true,
                        onClick: options.onClick,
                    }, {
                        icon: () => h(renderedFontAwesomeIcon(["fas", clickIcon])),
                    }),
                ],
            );
        }

        const notificationOptions: NaiveNotificationOptions = {
            title: () =>
                h("div",
                    {
                        class: `notification-${options.type || "default"}`,
                    },
                    options.title,
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

        return notification.value.create(notificationOptions);
    }

    function success(message: string, duration = 2000): NotificationReactive {
        return custom({
            title: message,
            duration,
            type: "success",
        });
    }

    function error(
        message: string,
        error?: Error | AxiosError,
        duration = 10000,
        disableWarning = false,
    ): NotificationReactive | void {
        if (error instanceof AxiosError && error.response?.status === 401 && !disableWarning) {
            const responseData = error.response.data;

            if (responseData?.mdp2Failed === true) {
                // MDP 2 timeout
                return custom({
                    title: "Votre accès sécurisé a expiré",
                    content: "Cliquer sur ce message pour recharger la page",
                    type: "warning",
                    duration: 0,
                    onClick: () => {
                        window.location.reload();
                    },
                });
            } else {
                // Session timeout
                let loginInterval: number | null = null;

                return custom({
                    title: "Votre connexion à Hermes a expiré",
                    content: "Cliquer sur ce message pour être redirigé vers la page de connexion",
                    type: "warning",
                    duration: 0,
                    onClick: async () => {
                        window.open("/v3/login?light", "_blank", "width=650,height=800");
                        loginInterval = setInterval(async () => {
                            try {
                                // Remplacez par votre méthode de vérification de session
                                const response = await fetch("/app/api/me");
                                if (response.ok) {
                                    notification.value.destroyAll();
                                    if (loginInterval) clearInterval(loginInterval);
                                }
                            } catch (err) {
                                console.error("Erreur lors de la vérification de session:", err);
                            }
                        }, 2000);
                    },
                    onClose: () => {
                        if (loginInterval) clearInterval(loginInterval);
                    },
                });
            }
        } else {
            custom({
                title: message,
                content: ERROR_DESCRIPTION,
                duration,
                type: "error",
            });

            // Sentry logging si disponible
            if (typeof window !== "undefined" && (window as any).Sentry) {
                (window as any).Sentry.captureMessage(message);
            }

            if (error instanceof Error) {
                error.message = error.message + " (" + message + ")";
                throw error;
            } else {
                console.error(message);
            }
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
        duration = 6000,
    ): NotificationReactive {
        const onClickAction = url ? () => {
            window.open(url, "_blank");
        } : undefined;

        return custom({
            title,
            content: () => h(hFlex, { vertical: true }, () => [
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

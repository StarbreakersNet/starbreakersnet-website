import { type MessageOptions, type MessageReactive } from "naive-ui";
import { computed, type VNodeChild } from "vue";

type MessageContent = string | (() => VNodeChild);

const DEFAULT_DURATIONS = {
  info: 3000,
  success: 2000,
  warning: 5000,
  error: 30000,
  loading: 0,
};

const DEFAULT_OPTIONS = {
  closable: false,
  keepAliveOnHover: true,
};

export function useMessage() {
  const message = computed(() => window.$message);

  function create(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.create(content, { ...DEFAULT_OPTIONS, ...options });
  }

  function info(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.info(content, {
      ...DEFAULT_OPTIONS,
      duration: DEFAULT_DURATIONS.info,
      ...options,
    });
  }

  function success(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.success(content, {
      ...DEFAULT_OPTIONS,
      duration: DEFAULT_DURATIONS.success,
      ...options,
    });
  }

  function warning(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.warning(content, {
      ...DEFAULT_OPTIONS,
      duration: DEFAULT_DURATIONS.warning,
      ...options,
    });
  }

  function error(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.error(content, {
      ...DEFAULT_OPTIONS,
      closable: true,
      duration: DEFAULT_DURATIONS.error,
      ...options,
    });
  }

  function loading(content: MessageContent, options?: MessageOptions): MessageReactive {
    return message.value.loading(content, {
      ...DEFAULT_OPTIONS,
      duration: DEFAULT_DURATIONS.loading,
      ...options,
    });
  }

  function destroyAll(): void {
    message.value.destroyAll();
  }

  return {
    create,
    info,
    success,
    warning,
    error,
    loading,
    destroyAll,
  };
}

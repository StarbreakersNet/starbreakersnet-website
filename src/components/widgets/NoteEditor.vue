<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from "vue";
import { EditorContent, useEditor, type Editor } from "@tiptap/vue-3";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HInput from "@/components/c/hInput.vue";
import { markdownExtensions } from "@/utils/markdown";
import { normalizeUrl } from "@/models/widgets";

// Éditeur du widget Note, sans Markdown à écrire (TipTap). Le texte reste enregistré en Markdown,
// comme avant : les notes existantes s'ouvrent telles quelles. Mêmes extensions que l'affichage
// du widget (utils/markdown.ts), pour que la note s'affiche comme on l'a écrite.

const props = defineProps({
  maxLength: {
    type: Number,
    required: true,
  },
});

const markdown = defineModel({
  type: String,
  required: true,
});

const length = ref(markdown.value.length);

const tooLong = computed(() => length.value > props.maxLength);

const editor = useEditor({
  content: markdown.value,
  contentType: "markdown",
  extensions: markdownExtensions(),
  editorProps: {
    attributes: {
      "aria-label": "Texte de la note",
      "aria-multiline": "true",
      "role": "textbox",
    },
  },
  onUpdate: ({ editor }) => {
    const next = editor.getMarkdown();

    length.value = next.length;

    // Au-delà de la limite, le texte n'est plus enregistré tant qu'il n'est pas raccourci
    if (next.length <= props.maxLength) {
      markdown.value = next;
    }
  },
});

interface Action {
  label: string;
  icon: string;
  active: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const ACTIONS: Action[] = [
  {
    label: "Titre",
    icon: "heading",
    active: editor => editor.isActive("heading"),
    run: editor => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "Gras",
    icon: "bold",
    active: editor => editor.isActive("bold"),
    run: editor => editor.chain().focus().toggleBold().run(),
  },
  {
    label: "Italique",
    icon: "italic",
    active: editor => editor.isActive("italic"),
    run: editor => editor.chain().focus().toggleItalic().run(),
  },
  {
    label: "Barré",
    icon: "strikethrough",
    active: editor => editor.isActive("strike"),
    run: editor => editor.chain().focus().toggleStrike().run(),
  },
  {
    label: "Liste à puces",
    icon: "list-ul",
    active: editor => editor.isActive("bulletList"),
    run: editor => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Liste numérotée",
    icon: "list-ol",
    active: editor => editor.isActive("orderedList"),
    run: editor => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Citation",
    icon: "quote-left",
    active: editor => editor.isActive("blockquote"),
    run: editor => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code",
    icon: "code",
    active: editor => editor.isActive("code"),
    run: editor => editor.chain().focus().toggleCode().run(),
  },
];

// --- Lien : adresse saisie sous la barre d'outils

const linkOpen = ref(false);
const linkUrl = ref("");
const linkInput = useTemplateRef<InstanceType<typeof HInput>>("linkInput");

const linkHref = computed(() => normalizeUrl(linkUrl.value));

const linkInvalid = computed(() => linkUrl.value.trim() !== "" && !linkHref.value);

const onLink = computed(() => editor.value?.isActive("link") ?? false);

const linkLabel = computed(() => (onLink.value ? "Retirer le lien" : "Lien"));

async function toggleLink() {
  if (onLink.value) {
    editor.value?.chain().focus().extendMarkRange("link").unsetLink().run();
  } else {
    linkUrl.value = "";
    linkOpen.value = true;

    await nextTick();
    linkInput.value?.focus();
  }
}

function applyLink() {
  const href = linkHref.value;
  const current = editor.value;

  if (href && current) {
    const chain = current.chain().focus();

    if (current.state.selection.empty) {
      // Sans texte sélectionné, l'adresse devient le texte du lien
      const mark = { type: "link", attrs: { href } };

      chain.insertContent({ type: "text", text: href, marks: [mark] });
    } else {
      chain.extendMarkRange("link").setLink({ href });
    }

    chain.run();
    linkOpen.value = false;
  }
}

function cancelLink() {
  linkOpen.value = false;
  editor.value?.commands.focus();
}

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div :class="{ invalid: tooLong }" class="note-editor">
    <h-flex v-if="editor" :size="2" aria-label="Mise en forme" class="toolbar" role="toolbar">
      <h-button
        v-for="action in ACTIONS"
        :key="action.label"
        :aria-label="action.label"
        :aria-pressed="action.active(editor)"
        :tooltip="action.label"
        :type="action.active(editor) ? 'primary' : 'default'"
        quaternary
        size="small"
        @click="action.run(editor)">
        <font-awesome-icon :icon="action.icon" />
      </h-button>
      <h-button
        :aria-label="linkLabel"
        :aria-pressed="onLink"
        :tooltip="linkLabel"
        :type="onLink || linkOpen ? 'primary' : 'default'"
        quaternary
        size="small"
        @click="toggleLink">
        <font-awesome-icon :icon="onLink ? 'link-slash' : 'link'" />
      </h-button>
    </h-flex>
    <h-flex v-if="linkOpen" :size="6" :wrap="false" class="link-row">
      <h-input
        ref="linkInput"
        v-model:value="linkUrl"
        :status="linkInvalid ? 'error' : undefined"
        placeholder="https://exemple.fr"
        size="small"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent.stop="cancelLink" />
      <h-button :disabled="!linkHref" size="small" type="primary" @click="applyLink">
        Ajouter
      </h-button>
      <h-button quaternary size="small" @click="cancelLink">Annuler</h-button>
    </h-flex>
    <editor-content :editor="editor" class="content" />
    <p :class="{ error: tooLong }" class="count">
      <template v-if="tooLong">Texte trop long : il n'est plus enregistré.</template>
      {{ length }} / {{ props.maxLength }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/markdown";

.note-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--glass-separator);
  border-radius: 12px;
  background: var(--glass-control);
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: rgb(10 132 255);
  }

  &.invalid {
    border-color: rgb(255 69 58);
  }
}

.toolbar,
.link-row {
  padding: 6px;
  border-bottom: 1px solid var(--glass-separator);
}

.content {
  min-height: 11rem;
  max-height: 22rem;
  padding: 12px 14px;
  overflow-y: auto;
  line-height: 1.45;
  overflow-wrap: anywhere;
  cursor: text;

  :deep(.ProseMirror) {
    min-height: 9rem;
    outline: none;
  }

  @include markdown.content;
}

.count {
  margin: 0;
  padding: 0 10px 6px;
  font-size: 0.75rem;
  text-align: right;
  opacity: 0.6;

  &.error {
    color: rgb(255 69 58);
    opacity: 1;
  }
}
</style>

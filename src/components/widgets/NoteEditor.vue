<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { EditorContent, useEditor, type Editor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { normalizeUrl } from "@/models/widgets";

// Éditeur du widget Note, sans Markdown à écrire (TipTap). Le texte reste enregistré en Markdown,
// comme avant : les notes existantes s'ouvrent telles quelles, et l'affichage du widget ne change
// pas (lib/markdown.ts). Chargé seulement à l'ouverture des réglages d'une note.

const props = defineProps<{
  maxLength: number;
}>();

const markdown = defineModel<string>({ required: true });

const length = ref(markdown.value.length);
const tooLong = computed(() => length.value > props.maxLength);

const editor = useEditor({
  content: markdown.value,
  contentType: "markdown",
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Pas de soulignement en Markdown
      underline: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
    }),
    // Retour à la ligne simple = saut de ligne, comme à l'affichage du widget
    Markdown.configure({ markedOptions: { breaks: true, gfm: true } }),
  ],
  editorProps: {
    attributes: { "aria-label": "Texte de la note", "aria-multiline": "true", "role": "textbox" },
  },
  onUpdate: ({ editor }) => {
    const next = editor.getMarkdown();
    length.value = next.length;
    // Au-delà de la limite, le texte n'est plus enregistré tant qu'il n'est pas raccourci
    if (next.length <= props.maxLength) markdown.value = next;
  },
});

onBeforeUnmount(() => editor.value?.destroy());

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
const linkInput = ref<{ focus: () => void } | null>(null);
const linkInvalid = computed(() => linkUrl.value.trim() !== "" && !normalizeUrl(linkUrl.value));

async function toggleLink() {
  const current = editor.value;
  if (!current) return;

  if (current.isActive("link")) {
    current.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  linkUrl.value = "";
  linkOpen.value = true;
  await nextTick();
  linkInput.value?.focus();
}

function applyLink() {
  const href = normalizeUrl(linkUrl.value);
  const current = editor.value;
  if (!href || !current) return;

  const chain = current.chain().focus();
  if (current.state.selection.empty) {
    // Sans texte sélectionné, l'adresse devient le texte du lien
    chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] });
  } else {
    chain.extendMarkRange("link").setLink({ href });
  }
  chain.run();
  linkOpen.value = false;
}

function cancelLink() {
  linkOpen.value = false;
  editor.value?.commands.focus();
}
</script>

<template>
  <div :class="{ invalid: tooLong }" class="note-editor">
    <div v-if="editor" aria-label="Mise en forme" class="toolbar" role="toolbar">
      <button
        v-for="action in ACTIONS"
        :key="action.label"
        :aria-label="action.label"
        :aria-pressed="action.active(editor)"
        :class="{ active: action.active(editor) }"
        :title="action.label"
        class="tool"
        type="button"
        @click="action.run(editor)">
        <font-awesome-icon :icon="action.icon" />
      </button>
      <button
        :aria-label="editor.isActive('link') ? 'Retirer le lien' : 'Lien'"
        :aria-pressed="editor.isActive('link')"
        :class="{ active: editor.isActive('link') || linkOpen }"
        :title="editor.isActive('link') ? 'Retirer le lien' : 'Lien'"
        class="tool"
        type="button"
        @click="toggleLink">
        <font-awesome-icon :icon="editor.isActive('link') ? 'link-slash' : 'link'" />
      </button>
    </div>

    <div v-if="linkOpen" class="link-row">
      <n-input
        ref="linkInput"
        v-model:value="linkUrl"
        :status="linkInvalid ? 'error' : undefined"
        placeholder="https://exemple.fr"
        size="small"
        @keydown.enter.prevent="applyLink"
        @keydown.esc.prevent.stop="cancelLink" />
      <n-button :disabled="!normalizeUrl(linkUrl)" size="small" type="primary" @click="applyLink">
        Ajouter
      </n-button>
      <n-button quaternary size="small" @click="cancelLink">Annuler</n-button>
    </div>

    <editor-content :editor="editor" class="content" />

    <p :class="{ error: tooLong }" class="count">
      <template v-if="tooLong">Texte trop long : il n'est plus enregistré.</template>
      {{ length }} / {{ props.maxLength }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/markdown" as *;

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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px;
  border-bottom: 1px solid var(--glass-separator);
}

.tool {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  color: inherit;
  opacity: 0.75;
  transition:
    background 0.15s ease,
    opacity 0.15s ease;

  &:hover {
    background: var(--glass-control-hover);
    opacity: 1;
  }

  &.active {
    background: var(--glass-control-hover);
    color: rgb(10 132 255);
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid rgb(10 132 255);
    outline-offset: 1px;
  }
}

.link-row {
  display: flex;
  gap: 6px;
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

  @include markdown-content;
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

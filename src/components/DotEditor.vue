<template>
  <div ref="editorContainer" class="dot-editor" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue"
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { oneDark } from "@codemirror/theme-one-dark"
import { dot } from "@viz-js/lang-dot"
import { getViz } from "../composables/useGraphviz.js"

const props = defineProps({
  modelValue: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

const editorContainer = ref(null)
let editorView = null
let ignoreNextChange = false

function extractDot(text) {
  const t = text.trim()
  // Case 1: Full JSON object {"dot": "..."}
  try {
    const obj = JSON.parse(t)
    if (typeof obj === "string") return obj
    if (obj.dot) return obj.dot
    if (obj.data) return obj.data
    return t
  } catch {}

  // Case 2: JSON fragment like "dot": "..."
  const m = t.match(/^"dot"\s*:\s*"([\s\S]*)"\s*[,}]?$/)
  if (m) {
    try { return JSON.parse('"' + m[1] + '"') } catch {}
  }

  // Case 3: Quoted JSON string "..."
  if (t.startsWith('"') && t.endsWith('"')) {
    try { return JSON.parse(t) } catch {}
  }

  // Case 4: Has escaped newlines — unescape in place
  if (t.includes("\\n") || t.includes('\\"') || t.includes("\\t")) {
    return t
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
  }

  return t
}

onMounted(() => {
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      dot(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !ignoreNextChange) {
          emit("update:modelValue", update.state.doc.toString())
        }
      }),
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" },
      }),
      EditorView.domEventHandlers({
        paste() {
          requestAnimationFrame(async () => {
            if (!editorView) return
            const raw = editorView.state.doc.toString()
            const cleaned = extractDot(raw)
            // If preprocessing changed the content, apply it first
            if (cleaned !== raw) {
              ignoreNextChange = true
              editorView.dispatch({
                changes: {
                  from: 0,
                  to: editorView.state.doc.length,
                  insert: cleaned,
                },
              })
              emit("update:modelValue", cleaned)
              ignoreNextChange = false
            }
            // Then try to format with graphviz
            try {
              const viz = await getViz()
              const result = viz.render(cleaned, { format: "dot" })
              if (result.status === "success" && result.output) {
                ignoreNextChange = true
                editorView.dispatch({
                  changes: {
                    from: 0,
                    to: editorView.state.doc.length,
                    insert: result.output,
                  },
                })
                emit("update:modelValue", result.output)
                ignoreNextChange = false
              }
            } catch {
              // syntax error etc, keep content as-is
            }
          })
        },
      }),
    ],
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value,
  })
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (!editorView) return
    const current = editorView.state.doc.toString()
    if (newVal !== current) {
      ignoreNextChange = true
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: newVal },
      })
      ignoreNextChange = false
    }
  },
)

onUnmounted(() => {
  editorView?.destroy()
})
</script>

<style scoped>
.dot-editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

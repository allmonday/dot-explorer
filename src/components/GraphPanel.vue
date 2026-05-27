<template>
  <div class="graph-panel">
    <div class="toolbar">
      <button class="toolbar-btn" @click="onResetZoom" title="Reset Zoom">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        Fit
      </button>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          :class="{ active: traverseMode === 'shallow' }"
          @click="setMode('shallow')"
        >1-Level</button>
        <button
          class="toggle-btn"
          :class="{ active: traverseMode === 'downstream' }"
          @click="setMode('downstream')"
        >Downstream</button>
        <button
          class="toggle-btn"
          :class="{ active: traverseMode === 'upstream' }"
          @click="setMode('upstream')"
        >Upstream</button>
      </div>
      <span v-if="error" class="error-badge" :title="error">{{ error.slice(0, 60) }}</span>
    </div>
    <div ref="graphContainer" class="graph-container" />
    <div v-if="error" class="error-overlay">
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue"
import { useGraphviz } from "../composables/useGraphviz.js"
import { useHighlight } from "../composables/useHighlight.js"

const props = defineProps({
  dotSource: { type: String, default: "" },
})

const graphContainer = ref(null)
const error = ref("")
const traverseMode = ref("shallow")

const { init, render, resetZoom } = useGraphviz()
const highlight = useHighlight()

function setMode(mode) {
  traverseMode.value = mode
  highlight.setTraverseMode(mode)
}

let debounceTimer = null

onMounted(async () => {
  await init(graphContainer.value)
  if (props.dotSource) {
    await renderDot(props.dotSource)
  }
})

watch(
  () => props.dotSource,
  (newVal) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => renderDot(newVal), 300)
  },
)

onUnmounted(() => {
  clearTimeout(debounceTimer)
})

async function renderDot(source) {
  if (!source.trim()) return
  error.value = ""
  try {
    const svg = await render(source)
    if (svg) {
      highlight.setupPostRender(svg)
    }
  } catch (err) {
    const msg = err?.message || err?.toString?.() || "Unknown render error"
    console.error("[dot-viewer] render error:", err)
    error.value = msg
  }
}

function onResetZoom() {
  resetZoom()
}
</script>

<style scoped>
.graph-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #ffffff;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  flex-shrink: 0;
  z-index: 10;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #3c3c3c;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: #4a4a4a;
  color: #fff;
  border-color: #007acc;
}

.toolbar-btn.active {
  background: #007acc;
  color: #fff;
  border-color: #007acc;
}

.toggle-group {
  display: inline-flex;
  border: 1px solid #555;
  border-radius: 4px;
  overflow: hidden;
}

.toggle-btn {
  padding: 4px 10px;
  background: #3c3c3c;
  color: #aaa;
  font-size: 11px;
  border: none;
  border-right: 1px solid #555;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:last-child {
  border-right: none;
}

.toggle-btn:hover {
  background: #4a4a4a;
  color: #fff;
}

.toggle-btn.active {
  background: #007acc;
  color: #fff;
}

.error-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #5a1d1d;
  color: #f48771;
  font-size: 11px;
  cursor: help;
}

.graph-container {
  flex: 1;
  overflow: hidden;
}

.graph-container :deep(svg) {
  display: block;
}

.graph-container :deep(path),
.graph-container :deep(polygon),
.graph-container :deep(ellipse),
.graph-container :deep(polyline) {
  vector-effect: non-scaling-stroke;
}

.graph-container :deep(text) {
  -webkit-user-select: none;
  user-select: none;
}

.error-overlay {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  max-height: 120px;
  overflow: auto;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #5a1d1d;
  border-radius: 6px;
  padding: 10px 14px;
  z-index: 20;
}

.error-overlay pre {
  margin: 0;
  color: #f48771;
  font-size: 12px;
  font-family: "Menlo", "Consolas", monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

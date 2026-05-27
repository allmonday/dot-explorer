<template>
  <div class="split-pane" ref="container">
    <div class="pane pane-left" :style="{ width: leftWidth + '%' }">
      <slot name="left" />
    </div>
    <div class="divider" @mousedown="onMouseDown" />
    <div class="pane pane-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const props = defineProps({
  defaultLeftWidth: { type: Number, default: 40 },
  storageKey: { type: String, default: "" },
})

const stored = props.storageKey
  ? parseFloat(localStorage.getItem(props.storageKey))
  : NaN
const leftWidth = ref(!isNaN(stored) ? stored : props.defaultLeftWidth)
const container = ref(null)
let dragging = false

function onMouseDown(e) {
  e.preventDefault()
  dragging = true
  document.body.style.cursor = "col-resize"
  document.body.style.userSelect = "none"
}

function onMouseMove(e) {
  if (!dragging || !container.value) return
  const rect = container.value.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  leftWidth.value = Math.min(80, Math.max(20, pct))
}

function onMouseUp() {
  if (!dragging) return
  dragging = false
  document.body.style.cursor = ""
  document.body.style.userSelect = ""
  if (props.storageKey) {
    localStorage.setItem(props.storageKey, leftWidth.value)
  }
}

onMounted(() => {
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove)
  document.removeEventListener("mouseup", onMouseUp)
})
</script>

<style scoped>
.split-pane {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pane {
  overflow: hidden;
  height: 100%;
}

.pane-left {
  min-width: 0;
}

.pane-right {
  flex: 1;
  min-width: 0;
}

.divider {
  width: 4px;
  cursor: col-resize;
  background: #3c3c3c;
  flex-shrink: 0;
  transition: background 0.15s;
}

.divider:hover {
  background: #007acc;
}
</style>

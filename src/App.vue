<template>
  <div class="app">
    <SplitPane :defaultLeftWidth="40" storageKey="dot-explorer-split">
      <template #left>
        <div class="editor-area">
          <div class="file-bar">
            <select v-model="activeId" class="file-select">
              <option v-for="f in files" :key="f.id" :value="f.id">
                {{ f.name || "untitled" }}
              </option>
            </select>
            <button class="bar-btn" @click="renameFile" title="Rename">&#9998;</button>
            <button class="add-btn" @click="addFile" title="Add new DOT file">+</button>
            <button
              v-if="files.length > 1"
              class="remove-btn"
              @click="removeFile"
              title="Delete current file"
            >&times;</button>
          </div>
          <DotEditor :modelValue="dotContent" @update:modelValue="updateContent" />
        </div>
      </template>
      <template #right>
        <GraphPanel :dotSource="dotContent" />
      </template>
    </SplitPane>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, toRaw } from "vue"
import SplitPane from "./components/SplitPane.vue"
import DotEditor from "./components/DotEditor.vue"
import GraphPanel from "./components/GraphPanel.vue"
import { DEFAULT_DOT } from "./utils/defaultDot.js"
import { get, set } from "idb-keyval"

const STORAGE_KEY = "dot-viewer-files"

const initId = "_init"
const files = ref([{ id: initId, name: undefined, content: "" }])
const activeId = ref(initId)

const activeFile = computed(() =>
  files.value.find((f) => f.id === activeId.value),
)
const dotContent = computed(() => activeFile.value?.content || "")

let saveTimer = null

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function addFile() {
  const name = prompt("File name (optional):")?.trim() || undefined
  const id = uid()
  files.value.push({ id, name, content: "" })
  activeId.value = id
}

function removeFile() {
  if (files.value.length <= 1) return
  const idx = files.value.findIndex((f) => f.id === activeId.value)
  files.value.splice(idx, 1)
  activeId.value = files.value[Math.min(idx, files.value.length - 1)].id
}

function renameFile() {
  if (!activeFile.value) return
  const newName = prompt("Rename:", activeFile.value.name || "")?.trim()
  if (newName !== undefined) {
    activeFile.value.name = newName || undefined
  }
}

function updateContent(val) {
  if (activeFile.value) {
    activeFile.value.content = val
  }
}

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const raw = {
      files: toRaw(files.value).map((f) => toRaw(f)),
      activeId: activeId.value,
    }
    set(STORAGE_KEY, raw)
  }, 300)
}

onMounted(async () => {
  let data = null
  try {
    data = await get(STORAGE_KEY)
  } catch (e) {
    console.warn("[dot-viewer] IndexedDB read failed:", e)
  }

  if (data?.files?.length) {
    files.value = data.files
    activeId.value = data.activeId || data.files[0].id
  } else {
    // Fallback: try legacy localStorage
    const legacy = localStorage.getItem("dot-viewer-content")
    if (legacy) {
      files.value[0].content = legacy
    }
  }

  watch([files, activeId], scheduleSave, { deep: true })
  scheduleSave()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.app {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.editor-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  flex-shrink: 0;
}

.file-select {
  flex: 1;
  padding: 3px 8px;
  background: #3c3c3c;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.file-select:hover {
  border-color: #007acc;
}

.add-btn,
.remove-btn,
.bar-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3c3c3c;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover,
.remove-btn:hover,
.bar-btn:hover {
  background: #4a4a4a;
  color: #fff;
  border-color: #007acc;
}

.remove-btn {
  color: #f48771;
}
</style>

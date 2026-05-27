<template>
  <div class="app">
    <SplitPane :defaultLeftWidth="40">
      <template #left>
        <DotEditor v-model="dotContent" />
      </template>
      <template #right>
        <GraphPanel :dotSource="dotContent" />
      </template>
    </SplitPane>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue"
import SplitPane from "./components/SplitPane.vue"
import DotEditor from "./components/DotEditor.vue"
import GraphPanel from "./components/GraphPanel.vue"
import { DEFAULT_DOT } from "./utils/defaultDot.js"

const STORAGE_KEY = "dot-viewer-content"

const dotContent = ref("")

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  dotContent.value = saved || DEFAULT_DOT
})

watch(dotContent, (val) => {
  localStorage.setItem(STORAGE_KEY, val)
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

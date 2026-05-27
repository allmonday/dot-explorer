<template>
  <div class="dot-explorer">
    <SplitPane :defaultLeftWidth="40" :storageKey="storageKey">
      <template #left>
        <DotEditor :modelValue="modelValue" @update:modelValue="onInput" />
      </template>
      <template #right>
        <GraphPanel :dotSource="modelValue" />
      </template>
    </SplitPane>
  </div>
</template>

<script setup>
import SplitPane from "../components/SplitPane.vue"
import DotEditor from "../components/DotEditor.vue"
import GraphPanel from "../components/GraphPanel.vue"

const props = defineProps({
  modelValue: { type: String, default: "" },
  storageKey: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

function onInput(val) {
  emit("update:modelValue", val)
}
</script>

<style scoped>
.dot-explorer {
  width: 100%;
  height: 100%;
}
</style>

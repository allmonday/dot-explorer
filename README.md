# DOT Explorer

A Vue 3 component for editing and interactively visualizing Graphviz DOT files. Left panel is a CodeMirror 6 editor with DOT syntax highlighting, right panel renders the graph with zoom, pan, and click-to-highlight.

## Install

```bash
npm install dot-explorer
```

## Usage

### All-in-one component

```vue
<template>
  <DotExplorer v-model="dotContent" />
</template>

<script setup>
import { ref } from "vue"
import { DotExplorer } from "dot-explorer"
import "dot-explorer/dist/lib/dot-explorer.css"

const dotContent = ref(`digraph G {
  A -> B
  B -> C
}`)
</script>
```

`DotExplorer` fills its container — make sure the parent has a defined width and height.

### Standalone components

Use `DotEditor` and `GraphPanel` independently:

```vue
<template>
  <div style="display: flex; height: 100vh">
    <DotEditor v-model="dot" style="width: 50%" />
    <GraphPanel :dotSource="dot" style="flex: 1" />
  </div>
</template>

<script setup>
import { ref } from "vue"
import { DotEditor, GraphPanel } from "dot-explorer"
import "dot-explorer/dist/lib/dot-explorer.css"

const dot = ref("digraph { A -> B }")
</script>
```

### Composables

Use the rendering and highlight logic directly:

```js
import { useGraphviz, useHighlight } from "dot-explorer"

const { init, render, resetZoom } = useGraphviz()
const { setupPostRender, setTraverseMode } = useHighlight()

await init(containerElement)
const svg = await render(dotSource)
setupPostRender(svg)
```

## API

### DotExplorer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `""` | DOT source content (v-model) |
| `storageKey` | `string` | `""` | localStorage key for split pane position |

### DotEditor

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `""` | DOT source content (v-model) |

Features: DOT syntax highlighting, auto-format on paste, JSON escape detection.

### GraphPanel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dotSource` | `string` | `""` | DOT source to render |

Toolbar: Fit button, highlight mode toggle (1-Level / Downstream / Upstream).

## Highlight Modes

| Mode | Behavior |
|------|----------|
| **1-Level** | Highlight directly connected nodes and edges (bidirectional) |
| **Downstream** | Recursively follow edge direction from clicked node |
| **Upstream** | Recursively follow reverse edge direction to clicked node |

## Standalone App

Clone and run as a standalone app with multi-file support:

```bash
git clone https://github.com/allmonday/dot-explorer.git
cd dot-explorer
npm install
npm run dev
```

The standalone app includes:
- Multi-file management (add, rename, delete)
- IndexedDB persistence
- Resizable split pane with position memory

## License

MIT

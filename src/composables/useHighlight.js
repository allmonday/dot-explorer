const HIGHLIGHT_COLOR = "#FF8C00"
const HIGHLIGHT_STROKE_WIDTH = "1.5"
const DIM_FILL = "#e0e0e0"
const DIM_STROKE = "#ccc"
const DIM_TEXT = "#bbb"

export function useHighlight() {
  let nodesByName = {}
  let edgesByName = {}
  let originalStyles = new Map()
  // traverseMode: "shallow" | "upstream" | "downstream"
  let traverseMode = "shallow"

  function setTraverseMode(mode) {
    traverseMode = mode
  }

  function setupPostRender(svg) {
    nodesByName = {}
    edgesByName = {}
    originalStyles.clear()

    // Index nodes
    svg.querySelectorAll(".node").forEach((el) => {
      const titleEl = el.querySelector("title")
      if (!titleEl) return
      const name = titleEl.textContent
      el.setAttribute("data-name", name)
      titleEl.remove()
      nodesByName[name] = el
      saveOriginalStyles(el)
    })

    // Index edges
    svg.querySelectorAll(".edge").forEach((el) => {
      const titleEl = el.querySelector("title")
      if (!titleEl) return
      const name = titleEl.textContent.replace(/:[nsew][ew]?/g, "")
      el.setAttribute("data-name", name)
      titleEl.remove()
      if (!edgesByName[name]) {
        edgesByName[name] = []
      }
      edgesByName[name].push(el)
      saveOriginalStyles(el)
    })

    bindClickHandlers(svg)
  }

  function saveOriginalStyles(el) {
    el.querySelectorAll("polygon, ellipse, path, polyline").forEach((shape) => {
      if (shape.getAttribute("data-graphviz-hitbox") === "true") return
      if (!originalStyles.has(shape)) {
        originalStyles.set(shape, {
          fill: shape.getAttribute("fill"),
          stroke: shape.getAttribute("stroke"),
          "stroke-width": shape.getAttribute("stroke-width"),
        })
      }
    })
    el.querySelectorAll("text").forEach((text) => {
      if (!originalStyles.has(text)) {
        originalStyles.set(text, {
          fill: text.getAttribute("fill") || "#000000",
          stroke: text.getAttribute("stroke"),
        })
      }
    })
  }

  function bindClickHandlers(svg) {
    // Node clicks
    for (const [name, nodeEl] of Object.entries(nodesByName)) {
      nodeEl.style.cursor = "pointer"
      nodeEl.addEventListener("click", (e) => {
        e.stopPropagation()
        highlightNode(name)
      })
    }

    // Edge clicks
    for (const [name, edgeEls] of Object.entries(edgesByName)) {
      edgeEls.forEach((edgeEl) => {
        edgeEl.style.cursor = "pointer"
        edgeEl.addEventListener("click", (e) => {
          e.stopPropagation()
          highlightEdge(name)
        })
      })
    }

    // Background click clears highlight
    svg.addEventListener("click", () => {
      clearHighlight()
    })
  }

  function highlightNode(nodeName) {
    clearHighlight()
    const activeSet = new Set()

    if (!nodesByName[nodeName]) return applyHighlight(activeSet)
    activeSet.add(nodesByName[nodeName])

    if (traverseMode === "shallow") {
      for (const [edgeName, edgeEls] of Object.entries(edgesByName)) {
        const parts = edgeName.split("->")
        const src = parts[0].split(":")[0]
        const tgt = parts[1] ? parts[1].split(":")[0] : null
        if (src === nodeName || tgt === nodeName) {
          edgeEls.forEach((el) => activeSet.add(el))
          if (tgt && nodesByName[tgt]) activeSet.add(nodesByName[tgt])
          if (nodesByName[src]) activeSet.add(nodesByName[src])
        }
      }
    } else {
      // Directional BFS
      const followSrc = traverseMode === "upstream"   // upstream: follow edges where node is target → go to source
      const visited = new Set([nodeName])
      const queue = [nodeName]

      while (queue.length > 0) {
        const current = queue.shift()
        for (const [edgeName, edgeEls] of Object.entries(edgesByName)) {
          const parts = edgeName.split("->")
          const src = parts[0].split(":")[0]
          const tgt = parts[1] ? parts[1].split(":")[0] : null
          let neighbor = null

          if (followSrc && tgt === current && src) {
            neighbor = src
          } else if (!followSrc && src === current && tgt) {
            neighbor = tgt
          }

          if (neighbor !== null) {
            edgeEls.forEach((el) => activeSet.add(el))
            if (nodesByName[neighbor]) activeSet.add(nodesByName[neighbor])
            if (!visited.has(neighbor)) {
              visited.add(neighbor)
              queue.push(neighbor)
            }
          }
        }
      }
    }

    applyHighlight(activeSet)
  }

  function highlightEdge(edgeName) {
    clearHighlight()
    const parts = edgeName.split("->")
    const src = parts[0].split(":")[0]
    const tgt = parts[1] ? parts[1].split(":")[0] : null

    const activeSet = new Set()

    if (edgesByName[edgeName]) {
      edgesByName[edgeName].forEach((el) => activeSet.add(el))
    }
    if (src && nodesByName[src]) activeSet.add(nodesByName[src])
    if (tgt && nodesByName[tgt]) activeSet.add(nodesByName[tgt])

    applyHighlight(activeSet)
  }

  function applyHighlight(activeSet) {
    const allElements = [
      ...Object.values(nodesByName),
      ...Object.values(edgesByName).flat(),
    ]

    for (const el of allElements) {
      if (activeSet.has(el)) {
        highlightElement(el)
      } else {
        dimElement(el)
      }
    }

    // Bring highlighted to front
    for (const el of activeSet) {
      el.parentNode.appendChild(el)
    }
  }

  function highlightElement(el) {
    const isNode = el.classList.contains("node")
    if (isNode) {
      // Only highlight the first shape (outer boundary).
      // Table nodes have many cell polygons as siblings — skip those.
      for (const child of el.children) {
        if (["polygon", "ellipse", "path", "polyline"].includes(child.tagName)) {
          child.setAttribute("stroke", HIGHLIGHT_COLOR)
          child.setAttribute("stroke-width", HIGHLIGHT_STROKE_WIDTH)
          break
        }
      }
    } else {
      el.querySelectorAll("polygon, ellipse, path, polyline").forEach((shape) => {
        if (shape.getAttribute("data-graphviz-hitbox") === "true") return
        shape.setAttribute("stroke", HIGHLIGHT_COLOR)
        shape.setAttribute("stroke-width", HIGHLIGHT_STROKE_WIDTH)
      })
    }
  }

  function dimElement(el) {
    el.querySelectorAll("polygon, ellipse, path, polyline").forEach((shape) => {
      if (shape.getAttribute("data-graphviz-hitbox") === "true") return
      const orig = originalStyles.get(shape)
      // Keep fill="none" as-is (edge paths), only dim filled shapes (node boxes, arrowheads)
      if (!orig || orig.fill !== "none") {
        shape.setAttribute("fill", DIM_FILL)
      }
      shape.setAttribute("stroke", DIM_STROKE)
    })
    el.querySelectorAll("text").forEach((text) => {
      text.setAttribute("fill", DIM_TEXT)
    })
  }

  function clearHighlight() {
    const allElements = [
      ...Object.values(nodesByName),
      ...Object.values(edgesByName).flat(),
    ]

    for (const el of allElements) {
      el.querySelectorAll("polygon, ellipse, path, polyline, text").forEach(
        (shape) => {
          const orig = originalStyles.get(shape)
          if (orig) {
            if (orig.fill) shape.setAttribute("fill", orig.fill)
            if (orig.stroke) shape.setAttribute("stroke", orig.stroke)
            if (orig["stroke-width"])
              shape.setAttribute("stroke-width", orig["stroke-width"])
          }
        },
      )
    }
  }

  return { setupPostRender, highlightNode, highlightEdge, clearHighlight, setTraverseMode }
}

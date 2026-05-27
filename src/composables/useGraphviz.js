import { instance } from "@viz-js/viz"
import { select } from "d3-selection"
import { zoom, zoomIdentity } from "d3-zoom"

let vizInstance = null

export async function getViz() {
  if (!vizInstance) {
    vizInstance = await instance()
  }
  return vizInstance
}

export function useGraphviz() {
  let containerEl = null
  let zoomBehavior = null
  let currentSvg = null
  let svgSelection = null
  let innerGroup = null

  async function init(el) {
    containerEl = el
    await getViz()
  }

  async function render(dotSource) {
    if (!vizInstance || !containerEl) return

    const svg = vizInstance.renderSVGElement(dotSource, { engine: "dot" })

    containerEl.innerHTML = ""
    containerEl.appendChild(svg)
    currentSvg = svg

    // Remove fixed width/height, let CSS fill the container
    svg.removeAttribute("width")
    svg.removeAttribute("height")
    svg.style.width = "100%"
    svg.style.height = "100%"
    svg.style.display = "block"

    // Wrap all children into a single <g> for d3-zoom transforms.
    // This preserves graphviz's internal transforms untouched.
    const wrapper = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    )
    while (svg.firstChild) {
      wrapper.appendChild(svg.firstChild)
    }
    svg.appendChild(wrapper)

    innerGroup = select(wrapper)
    svgSelection = select(svg)

    zoomBehavior = zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        innerGroup.attr("transform", event.transform)
      })

    svgSelection.call(zoomBehavior)

    // viewBox from graphviz already fits the content, identity = perfect fit
    svgSelection.call(zoomBehavior.transform, zoomIdentity)

    return svg
  }

  function fitToView() {
    if (!svgSelection || !zoomBehavior) return
    svgSelection.call(zoomBehavior.transform, zoomIdentity)
  }

  function resetZoom() {
    fitToView()
  }

  return { init, render, resetZoom }
}

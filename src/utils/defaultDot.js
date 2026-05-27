export const DEFAULT_DOT = `digraph G {
  rankdir=LR
  node [shape=box style=filled fillcolor="#f8f8f8"]

  A [label="Start"]
  B [label="Process A"]
  C [label="Process B"]
  D [label="Decision" shape=diamond]
  E [label="End"]

  A -> B
  A -> C
  B -> D
  C -> D
  D -> E
  D -> B [label="retry"]
}
`

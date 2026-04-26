// Lightweight mermaid flowchart parser + surgical mutators.
// We avoid full re-serialization to preserve user formatting and comments.

export const SHAPES = {
  rect:    { open: '[',  close: ']'  },
  round:   { open: '(',  close: ')'  },
  stadium: { open: '([', close: '])' },
  circle:  { open: '((', close: '))' },
  diamond: { open: '{',  close: '}'  },
  hex:     { open: '{{', close: '}}' },
}

const SHAPE_PATTERNS = [
  { shape: 'circle',  open: '((', close: '))' },
  { shape: 'stadium', open: '([', close: '])' },
  { shape: 'hex',     open: '{{', close: '}}' },
  { shape: 'rect',    open: '[',  close: ']'  },
  { shape: 'round',   open: '(',  close: ')'  },
  { shape: 'diamond', open: '{',  close: '}'  },
]

const ID_RE = /[A-Za-z_][\w-]*/

export function isFlowchart(code) {
  const first = code.trim().split('\n')[0].trim().toLowerCase()
  return first.startsWith('flowchart') || first.startsWith('graph ')
}

export function getDirection(code) {
  const m = code.trim().match(/^(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)/i)
  return m ? m[1].toUpperCase() : 'TD'
}

// Parse all node definitions and edges. Returns { nodes: Map<id,{shape,label}>, edges: [{source,target,label}] }
export function parseFlowchart(code) {
  const nodes = new Map()
  const edges = []
  const lines = code.split('\n')

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (i === 0) continue
    const stripped = line.replace(/%%.*$/, '').trim()
    if (!stripped) continue
    if (/^(subgraph|end|direction|click|style|classDef|class|linkStyle)\b/i.test(stripped)) continue

    // Walk tokens: each token is either an id with optional shape, or an edge connector.
    let cursor = 0
    let lastNodeId = null
    let pendingEdge = null // { kind, label }

    while (cursor < stripped.length) {
      // Skip whitespace
      while (cursor < stripped.length && /\s/.test(stripped[cursor])) cursor++
      if (cursor >= stripped.length) break

      // Try to read an edge connector
      const edge = readEdge(stripped, cursor)
      if (edge) {
        pendingEdge = { label: edge.label }
        cursor = edge.next
        continue
      }

      // Otherwise read a node ref
      const node = readNode(stripped, cursor)
      if (!node) { cursor++; continue }
      cursor = node.next

      if (node.shape) {
        if (!nodes.has(node.id)) {
          nodes.set(node.id, { shape: node.shape, label: node.label })
        } else {
          const existing = nodes.get(node.id)
          nodes.set(node.id, { shape: node.shape, label: node.label || existing.label })
        }
      } else if (!nodes.has(node.id)) {
        nodes.set(node.id, { shape: 'rect', label: node.id })
      }

      if (lastNodeId && pendingEdge) {
        edges.push({ source: lastNodeId, target: node.id, label: pendingEdge.label || '' })
        pendingEdge = null
      }
      lastNodeId = node.id
    }
  }

  return { nodes, edges, direction: getDirection(code) }
}

function readNode(text, start) {
  const idMatch = text.slice(start).match(new RegExp('^' + ID_RE.source))
  if (!idMatch) return null
  const id = idMatch[0]
  let pos = start + id.length

  for (const pat of SHAPE_PATTERNS) {
    if (text.startsWith(pat.open, pos)) {
      const closeIdx = text.indexOf(pat.close, pos + pat.open.length)
      if (closeIdx === -1) continue
      let label = text.slice(pos + pat.open.length, closeIdx)
      label = unquoteLabel(label)
      return { id, shape: pat.shape, label, next: closeIdx + pat.close.length }
    }
  }
  return { id, shape: null, label: id, next: pos }
}

function readEdge(text, start) {
  // Match: -->, --x, --o, ---, -.->, ==>, etc., with optional inline label
  // Forms:
  //   --> | --- | -.-> | ==>  (no label)
  //   -- text --> | == text ==> | -. text .->  (label between dashes)
  //   --|text|--> | -->|text| (label in pipes)
  const slice = text.slice(start)

  // Form: -- text --> ...
  let m = slice.match(/^(--+|==+|-\.+)\s*([^->|=][^|>]*?)\s*(--+>|==+>|\.->|--+|==+|\.-)/)
  if (m) {
    const labelText = m[2].trim()
    return { label: stripPipes(labelText), next: start + m[0].length }
  }

  // Form: -->|label| or --->|label|
  m = slice.match(/^(--+>|==+>|-\.->|--+|==+|-\.-)\s*\|([^|]*)\|/)
  if (m) {
    return { label: m[2].trim(), next: start + m[0].length }
  }

  // Form: plain connector
  m = slice.match(/^(--+>|==+>|-\.->|--+|==+|-\.-)/)
  if (m) {
    return { label: '', next: start + m[0].length }
  }

  return null
}

function unquoteLabel(s) {
  s = s.trim()
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1)
  return s
}

function stripPipes(s) {
  if (s.startsWith('|') && s.endsWith('|')) return s.slice(1, -1).trim()
  return s
}

export function nextNodeId(code) {
  const { nodes } = parseFlowchart(code)
  let i = 1
  while (nodes.has('N' + i)) i++
  return 'N' + i
}

function formatNode(id, shape, label) {
  const pat = SHAPES[shape] || SHAPES.rect
  const safeLabel = label.includes(' ') || /[^\w\s.-]/.test(label)
    ? `"${label.replace(/"/g, '\\"')}"`
    : label
  return `${id}${pat.open}${safeLabel}${pat.close}`
}

// Append a new standalone node line at the end of the code.
export function addNode(code, { id, shape = 'rect', label }) {
  const finalId = id || nextNodeId(code)
  const finalLabel = label || finalId
  const indent = '    '
  const nodeStr = formatNode(finalId, shape, finalLabel)
  return code.replace(/\s*$/, '') + '\n' + indent + nodeStr + '\n'
}

// Append a new edge between two existing nodes.
export function addEdge(code, { source, target, label = '' }) {
  const indent = '    '
  const edge = label
    ? `${source} -->|${label}| ${target}`
    : `${source} --> ${target}`
  return code.replace(/\s*$/, '') + '\n' + indent + edge + '\n'
}

// Remove a node: drops its standalone definition line(s) and any edge lines that mention it.
export function deleteNode(code, id) {
  const lines = code.split('\n')
  const result = []
  const idRe = new RegExp(`(^|[^\\w-])${escapeRe(id)}(?=$|[^\\w-])`)
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) { result.push(lines[i]); continue }
    if (!idRe.test(lines[i])) { result.push(lines[i]); continue }
    // Line mentions this id. Try to surgically remove just this id from edge chains;
    // otherwise drop the line entirely.
    const cleaned = removeIdFromLine(lines[i], id)
    if (cleaned !== null && cleaned.trim()) result.push(cleaned)
    // else drop
  }
  return result.join('\n')
}

// Try to remove a node id from a line that is purely a single edge "A --> B".
// Returns the cleaned line, or null to indicate "drop the line".
function removeIdFromLine(line, id) {
  const stripped = line.replace(/%%.*$/, '').trim()
  // Single node definition line e.g. "    A[Hello]"
  const single = stripped.match(new RegExp(`^${escapeRe(id)}(\\W|$)`))
  if (single && !/-->|---|==>|-\./.test(stripped)) return null

  // Simple two-node edge containing id: drop whole line.
  return null
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// Update the label of a node by rewriting its first definition site (or inserting one if it's only an inline ref).
export function renameLabel(code, id, newLabel) {
  const lines = code.split('\n')
  const idRe = new RegExp(`(^|[^\\w-])(${escapeRe(id)})(\\[\\(|\\(\\(|\\(\\[|\\{\\{|\\[|\\(|\\{)`)
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(idRe)
    if (!m) continue
    // Find the matching close to replace the label inside.
    const startOfShape = lines[i].indexOf(m[3], m.index + (m[1] ? m[1].length : 0) + m[2].length)
    if (startOfShape === -1) continue
    const open = m[3]
    const close = SHAPES_BY_OPEN[open]
    if (!close) continue
    const closeIdx = lines[i].indexOf(close, startOfShape + open.length)
    if (closeIdx === -1) continue
    const safe = needsQuotes(newLabel) ? `"${newLabel.replace(/"/g, '\\"')}"` : newLabel
    lines[i] = lines[i].slice(0, startOfShape + open.length) + safe + lines[i].slice(closeIdx)
    return lines.join('\n')
  }
  // No existing definition with shape — append a rect node line.
  return addNode(code, { id, shape: 'rect', label: newLabel })
}

const SHAPES_BY_OPEN = {
  '[(': ')]',
  '((': '))',
  '([': '])',
  '{{': '}}',
  '[':  ']',
  '(':  ')',
  '{':  '}',
}

function needsQuotes(label) {
  return /\s|[^\w.-]/.test(label)
}

// Best-effort delete an edge between source and target. Removes the first matching edge line.
export function deleteEdge(code, source, target) {
  const lines = code.split('\n')
  const re = new RegExp(`\\b${escapeRe(source)}\\b[^\\n]*?(?:--+>|==+>|-\\.->|--+|==+|-\\.-)[^\\n]*?\\b${escapeRe(target)}\\b`)
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) {
      lines.splice(i, 1)
      break
    }
  }
  return lines.join('\n')
}

export function setDirection(code, dir) {
  const lines = code.split('\n')
  if (lines.length === 0) return code
  const m = lines[0].match(/^(flowchart|graph)\s+(TB|TD|BT|RL|LR)/i)
  if (m) {
    lines[0] = lines[0].replace(/^(flowchart|graph)\s+(TB|TD|BT|RL|LR)/i, `${m[1]} ${dir}`)
  }
  return lines.join('\n')
}

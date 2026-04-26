export const DIAGRAM_TYPES = [
  { label: 'Flowchart', prefix: 'flowchart TD' },
  { label: 'Sequence',  prefix: 'sequenceDiagram' },
  { label: 'Class',     prefix: 'classDiagram' },
  { label: 'State',     prefix: 'stateDiagram-v2' },
  { label: 'ER',        prefix: 'erDiagram' },
  { label: 'Gantt',     prefix: 'gantt' },
  { label: 'Pie',       prefix: 'pie' },
  { label: 'Mind Map',  prefix: 'mindmap' },
  { label: 'Timeline',  prefix: 'timeline' },
  { label: 'Git Graph', prefix: 'gitGraph' },
  { label: 'Quadrant',  prefix: 'quadrantChart' },
  { label: 'XY Chart',  prefix: 'xychart-beta' },
  { label: 'Kanban',    prefix: 'kanban' },
  { label: 'Journey',   prefix: 'journey' },
  { label: 'ZenUML',    prefix: 'zenuml' },
  { label: 'Block',     prefix: 'block-beta' },
]

export function detectDiagramType(code) {
  const first = code.trim().split('\n')[0].trim().toLowerCase()
  if (first.startsWith('flowchart') || first.startsWith('graph ')) return 'Flowchart'
  if (first.startsWith('sequencediagram')) return 'Sequence'
  if (first.startsWith('classdiagram')) return 'Class'
  if (first.startsWith('statediagram')) return 'State'
  if (first.startsWith('erdiagram')) return 'ER'
  if (first.startsWith('gantt')) return 'Gantt'
  if (first.startsWith('pie')) return 'Pie'
  if (first.startsWith('mindmap')) return 'Mind Map'
  if (first.startsWith('timeline')) return 'Timeline'
  if (first.startsWith('gitgraph')) return 'Git Graph'
  if (first.startsWith('quadrantchart')) return 'Quadrant'
  if (first.startsWith('xychart')) return 'XY Chart'
  if (first.startsWith('kanban')) return 'Kanban'
  if (first.startsWith('journey')) return 'Journey'
  if (first.startsWith('zenuml')) return 'ZenUML'
  if (first.startsWith('block-beta')) return 'Block'
  return null
}

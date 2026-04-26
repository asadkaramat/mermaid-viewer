import { useEffect } from 'react'

export const TOOLS = [
  { id: 'select',  key: '1', label: 'Select',         hint: 'V or 1' },
  { id: 'pan',     key: '2', label: 'Pan',            hint: 'Hold Space' },
  { id: 'rect',    key: '3', label: 'Rectangle node', hint: 'Click empty canvas to add' },
  { id: 'diamond', key: '4', label: 'Diamond node',   hint: 'Click empty canvas to add' },
  { id: 'circle',  key: '5', label: 'Circle node',    hint: 'Click empty canvas to add' },
  { id: 'round',   key: '6', label: 'Rounded node',   hint: 'Click empty canvas to add' },
  { id: 'arrow',   key: '7', label: 'Arrow / edge',   hint: 'Click source then target node' },
  { id: 'text',    key: '8', label: 'Edit label',     hint: 'Click a node to rename' },
  { id: 'eraser',  key: '9', label: 'Eraser',         hint: 'Click a node or edge to delete' },
]

const ICONS = {
  select:  <path d="M5 3l11 7-4.5 1.5L9 17 5 3z" fill="currentColor" />,
  pan: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11V6.5a1.5 1.5 0 013 0V10" />
      <path d="M10 10V5.5a1.5 1.5 0 013 0V10" />
      <path d="M13 10V6.5a1.5 1.5 0 013 0V11" />
      <path d="M16 11V8a1.5 1.5 0 013 0v6.5a4.5 4.5 0 01-9 .5L7.5 12c-.5-.8-2-1-2.5 0-.4.7 0 1.3.5 2L9 18.5" />
    </g>
  ),
  rect:    <rect x="4" y="6" width="14" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  diamond: <path d="M11 4l8 7-8 7-8-7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
  circle:  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  round:   <rect x="4" y="6" width="14" height="10" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />,
  arrow:   <path d="M3 11h13m-3-4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  text:    <path d="M5 5h12M11 5v12M8 17h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  eraser:  <path d="M14 4l6 6-9 9H6l-3-3 11-12zm-5 12l-3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
}

function ToolIcon({ id }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {ICONS[id]}
    </svg>
  )
}

export default function CanvasToolbar({ tool, onToolChange, hint }) {
  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable) return
      const t = TOOLS.find((x) => x.key === e.key)
      if (t) { e.preventDefault(); onToolChange(t.id) }
      else if (e.key.toLowerCase() === 'v') { e.preventDefault(); onToolChange('select') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onToolChange])

  const active = TOOLS.find((t) => t.id === tool)

  return (
    <div className="canvas-toolbar-wrap">
      <div className="canvas-toolbar" role="toolbar" aria-label="Diagram tools">
        {TOOLS.map((t, i) => (
          <button
            key={t.id}
            className={`tool-btn${tool === t.id ? ' active' : ''}`}
            onClick={() => onToolChange(t.id)}
            title={`${t.label} (${t.key})`}
          >
            <ToolIcon id={t.id} />
            <span className="tool-key">{t.key}</span>
          </button>
        ))}
      </div>
      <div className="canvas-hint">
        {hint || (active ? active.hint : '')}
      </div>
    </div>
  )
}

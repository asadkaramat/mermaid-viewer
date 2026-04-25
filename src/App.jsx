import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import TabBar from './components/TabBar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { SAMPLES } from './data/samples'

const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

const DIAGRAM_TYPES = [
  { label: 'Flowchart',  prefix: 'flowchart TD' },
  { label: 'Sequence',   prefix: 'sequenceDiagram' },
  { label: 'Class',      prefix: 'classDiagram' },
  { label: 'State',      prefix: 'stateDiagram-v2' },
  { label: 'ER',         prefix: 'erDiagram' },
  { label: 'Gantt',      prefix: 'gantt' },
  { label: 'Pie',        prefix: 'pie' },
  { label: 'Mind Map',   prefix: 'mindmap' },
  { label: 'Timeline',   prefix: 'timeline' },
  { label: 'Git Graph',  prefix: 'gitGraph' },
  { label: 'Quadrant',   prefix: 'quadrantChart' },
  { label: 'XY Chart',   prefix: 'xychart-beta' },
  { label: 'Kanban',     prefix: 'kanban' },
  { label: 'Journey',    prefix: 'journey' },
  { label: 'ZenUML',     prefix: 'zenuml' },
  { label: 'Block',      prefix: 'block-beta' },
]

function detectDiagramType(code) {
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

function makeTab(name) {
  return { id: crypto.randomUUID(), name, code: DEFAULT_CODE }
}

const INITIAL_TABS = [makeTab('Diagram 1')]

function encodeState(tabs, activeTabId) {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ tabs, activeTabId }))))
}

function decodeHash(hash) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(hash))))
    if (Array.isArray(data.tabs) && data.tabs.length) return data
  } catch {}
  return null
}

export default function App() {
  const [tabs, setTabs] = useLocalStorage('mermaid-tabs', INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useLocalStorage('mermaid-active-tab', INITIAL_TABS[0].id)
  const [pageTitle, setPageTitle] = useLocalStorage('mermaid-page-title', 'Mermaid Viewer')
  const [uiTheme, setUiTheme] = useLocalStorage('mermaid-ui-theme', 'light')
  const [diagramConfig, setDiagramConfig] = useLocalStorage('mermaid-diagram-config', { theme: 'default', look: 'classic' })
  const [splitDir, setSplitDir] = useLocalStorage('mermaid-split-dir', 'h')
  const [bgColor, setBgColor] = useLocalStorage('mermaid-bg-color', '#ffffff')
  const [splitPercent, setSplitPercent] = useState(50)
  const [copied, setCopied] = useState(false)
  const [errorLine, setErrorLine] = useState(null)
  const [presentationMode, setPresentationMode] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)

  const isDragging = useRef(false)
  const workspaceRef = useRef(null)
  const actionsRef = useRef({})
  const importWorkspaceRef = useRef(null)
  const splitDirRef = useRef(splitDir)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const diagramType = detectDiagramType(activeTab.code)

  useEffect(() => { document.title = pageTitle }, [pageTitle])
  useEffect(() => { document.documentElement.setAttribute('data-theme', uiTheme) }, [uiTheme])
  useEffect(() => { splitDirRef.current = splitDir }, [splitDir])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const state = decodeHash(hash)
    if (!state) return
    setTabs(state.tabs)
    setActiveTabId(state.activeTabId || state.tabs[0].id)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const updateCode = useCallback((code) => {
    setTabs((prev) => prev.map((t) => t.id === activeTab.id ? { ...t, code } : t))
  }, [activeTab?.id, setTabs])

  function addTab() {
    const newTab = makeTab(`Diagram ${tabs.length + 1}`)
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  function removeTab(id) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeTabId === id) {
        const idx = prev.findIndex((t) => t.id === id)
        setActiveTabId(next[Math.max(0, idx - 1)].id)
      }
      return next
    })
  }

  function renameTab(id, name) {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, name } : t))
  }

  function share() {
    const encoded = encodeState(tabs, activeTab.id)
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function formatCode() {
    const lines = activeTab.code.split('\n').map((l) => l.trimEnd())
    while (lines.length > 0 && !lines[0].trim()) lines.shift()
    while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop()
    const result = []
    let prevBlank = false
    for (const line of lines) {
      const blank = !line.trim()
      if (blank && prevBlank) continue
      result.push(line)
      prevBlank = blank
    }
    updateCode(result.join('\n'))
  }

  function changeDiagramType(prefix) {
    const lines = activeTab.code.split('\n')
    lines[0] = prefix
    updateCode(lines.join('\n'))
  }

  function exportWorkspace() {
    const data = JSON.stringify({ tabs, activeTabId: activeTab.id, diagramConfig, pageTitle }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    a.download = `${pageTitle || 'workspace'}.json`
    a.click()
  }

  function importWorkspace(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data.tabs) && data.tabs.length) {
          setTabs(data.tabs)
          setActiveTabId(data.activeTabId || data.tabs[0].id)
          if (data.pageTitle) setPageTitle(data.pageTitle)
          if (data.diagramConfig) setDiagramConfig(data.diagramConfig)
        }
      } catch {}
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  actionsRef.current = {
    addTab,
    removeActiveTab: () => tabs.length > 1 && removeTab(activeTab.id),
    formatCode,
  }

  useEffect(() => {
    function onKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 't') { e.preventDefault(); actionsRef.current.addTab() }
      if (e.key === 'w' && e.shiftKey) { e.preventDefault(); actionsRef.current.removeActiveTab() }
      if (e.key === 'f' && e.shiftKey) { e.preventDefault(); actionsRef.current.formatCode() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function onDragStart(e) { isDragging.current = true; e.preventDefault() }

  function onMouseMove(e) {
    if (!isDragging.current || !workspaceRef.current) return
    const rect = workspaceRef.current.getBoundingClientRect()
    if (splitDirRef.current === 'h') {
      setSplitPercent(Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100)))
    } else {
      setSplitPercent(Math.min(80, Math.max(20, ((e.clientY - rect.top) / rect.height) * 100)))
    }
  }

  function onMouseUp() { isDragging.current = false }

  function updateDiagramConfig(key, value) {
    setDiagramConfig((prev) => ({ ...prev, [key]: value }))
  }

  const editorStyle = splitDir === 'h'
    ? { width: `${splitPercent}%` }
    : { height: `${splitPercent}%`, width: '100%' }

  const previewStyle = presentationMode
    ? { flex: 1, minWidth: 0, width: '100%' }
    : splitDir === 'h'
      ? { width: `${100 - splitPercent}%` }
      : { height: `${100 - splitPercent}%`, width: '100%' }

  const currentTypePrefix = DIAGRAM_TYPES.find((t) => t.label === diagramType)?.prefix ?? ''

  return (
    <div className="app" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <header className="app-header">
        <span className="app-logo">⬡</span>
        <EditableTitle value={pageTitle} onChange={setPageTitle} />
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setUiTheme((t) => t === 'light' ? 'dark' : 'light')}
            title={uiTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {uiTheme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="icon-btn"
            onClick={() => setPresentationMode((p) => !p)}
            title={presentationMode ? 'Exit presentation mode' : 'Presentation mode'}
          >
            {presentationMode ? '⊠' : '⛶'}
          </button>
          <button className="icon-btn" onClick={() => setEmbedOpen(true)} title="Get embed code">
            {'</>'}
          </button>
          <button
            className="icon-btn"
            onClick={() => importWorkspaceRef.current?.click()}
            title="Import workspace (.json)"
          >
            ⬆
          </button>
          <button className="icon-btn" onClick={exportWorkspace} title="Export workspace (.json)">
            ⬇
          </button>
          <input
            ref={importWorkspaceRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importWorkspace}
          />
          <button className="share-btn" onClick={share}>
            {copied ? '✓ Copied!' : 'Share'}
          </button>
        </div>
      </header>

      <div className="options-bar">
        <label className="options-label">Theme</label>
        <select
          className="options-select"
          value={diagramConfig.theme}
          onChange={(e) => updateDiagramConfig('theme', e.target.value)}
        >
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="forest">Forest</option>
          <option value="neutral">Neutral</option>
          <option value="base">Base</option>
        </select>

        <label className="options-label">Look</label>
        <select
          className="options-select"
          value={diagramConfig.look}
          onChange={(e) => updateDiagramConfig('look', e.target.value)}
        >
          <option value="classic">Classic</option>
          <option value="handDrawn">Hand Drawn</option>
        </select>

        <label className="options-label">Type</label>
        <select
          className="options-select"
          value={currentTypePrefix}
          onChange={(e) => { if (e.target.value) changeDiagramType(e.target.value) }}
        >
          {!diagramType && <option value="">Unknown</option>}
          {DIAGRAM_TYPES.map((t) => (
            <option key={t.label} value={t.prefix}>{t.label}</option>
          ))}
        </select>

        <label className="options-label">Layout</label>
        <button
          className="icon-btn layout-btn"
          onClick={() => setSplitDir((d) => d === 'h' ? 'v' : 'h')}
          title={splitDir === 'h' ? 'Switch to vertical split' : 'Switch to horizontal split'}
        >
          {splitDir === 'h' ? '⬛' : '▬'}
        </button>

        <div className="options-sep" />

        <button className="toolbar-btn" onClick={formatCode} title="Format code (⌘⇧F)">
          Format
        </button>

        <label className="options-label">Sample</label>
        <select
          className="options-select"
          value=""
          onChange={(e) => { if (e.target.value) { updateCode(e.target.value); e.target.value = '' } }}
        >
          <option value="">Load example…</option>
          {SAMPLES.map((s) => (
            <option key={s.label} value={s.code}>{s.label}</option>
          ))}
        </select>

        <div className="options-hint">
          <kbd>⌘T</kbd> new &nbsp;·&nbsp; <kbd>⌘⇧W</kbd> close &nbsp;·&nbsp; <kbd>⌘⇧F</kbd> format
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTab.id}
        onSelect={setActiveTabId}
        onAdd={addTab}
        onRemove={removeTab}
        onRename={renameTab}
      />

      <div className={`workspace${splitDir === 'v' ? ' vertical' : ''}`} ref={workspaceRef}>
        {!presentationMode && (
          <>
            <div className="pane-wrapper" style={editorStyle}>
              <Editor
                key={activeTab.id}
                code={activeTab.code}
                onChange={updateCode}
                errorLine={errorLine}
                darkMode={uiTheme === 'dark'}
                onDropFile={updateCode}
              />
            </div>
            <div
              className={`resize-handle${splitDir === 'v' ? ' vertical' : ''}`}
              onMouseDown={onDragStart}
            />
          </>
        )}
        <div className="pane-wrapper" style={previewStyle}>
          <Preview
            key={activeTab.id + '-preview'}
            code={activeTab.code}
            tabId={activeTab.id}
            tabName={activeTab.name}
            pageTitle={pageTitle}
            config={diagramConfig}
            onError={setErrorLine}
            bgColor={bgColor}
            onBgColorChange={setBgColor}
            presentationMode={presentationMode}
            onExitPresentation={() => setPresentationMode(false)}
          />
        </div>
      </div>

      {embedOpen && (
        <EmbedModal
          tabs={tabs}
          activeTab={activeTab}
          onClose={() => setEmbedOpen(false)}
        />
      )}
    </div>
  )
}

function EmbedModal({ tabs, activeTab, onClose }) {
  const encoded = encodeState(tabs, activeTab.id)
  const url = `${window.location.origin}${window.location.pathname}#${encoded}`
  const iframeCode = `<iframe\n  src="${url}"\n  width="800"\n  height="600"\n  frameborder="0"\n  allowfullscreen\n></iframe>`
  const [copied, setCopied] = useState('')

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Embed Diagram</div>

        <div className="modal-label">HTML iframe</div>
        <pre className="modal-code">{iframeCode}</pre>
        <div className="modal-row" style={{ marginBottom: 16 }}>
          <button className="toolbar-btn" onClick={() => copy(iframeCode, 'iframe')}>
            {copied === 'iframe' ? '✓ Copied!' : 'Copy iframe'}
          </button>
        </div>

        <div className="modal-label">Direct link</div>
        <pre className="modal-code modal-code-url">{url}</pre>
        <div className="modal-row">
          <button className="toolbar-btn" onClick={() => copy(url, 'url')}>
            {copied === 'url' ? '✓ Copied!' : 'Copy link'}
          </button>
          <button className="export-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function EditableTitle({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  function commit() { onChange(draft.trim() || value); setEditing(false) }

  function onKeyDown(e) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="page-title-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <span className="page-title" onClick={() => { setDraft(value); setEditing(true) }} title="Click to rename">
      {value}
      <span className="page-title-edit-icon">✎</span>
    </span>
  )
}

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
  const [splitPercent, setSplitPercent] = useState(50)
  const [copied, setCopied] = useState(false)
  const [errorLine, setErrorLine] = useState(null)
  const isDragging = useRef(false)
  const workspaceRef = useRef(null)
  const actionsRef = useRef({})

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  useEffect(() => { document.title = pageTitle }, [pageTitle])
  useEffect(() => { document.documentElement.setAttribute('data-theme', uiTheme) }, [uiTheme])

  // Load shared state from URL hash
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

  // Keep actionsRef current so keyboard handler doesn't need re-registration
  actionsRef.current = {
    addTab,
    removeActiveTab: () => tabs.length > 1 && removeTab(activeTab.id),
  }

  useEffect(() => {
    function onKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 't') { e.preventDefault(); actionsRef.current.addTab() }
      if (e.key === 'w' && e.shiftKey) { e.preventDefault(); actionsRef.current.removeActiveTab() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function onDragStart(e) { isDragging.current = true; e.preventDefault() }

  function onMouseMove(e) {
    if (!isDragging.current || !workspaceRef.current) return
    const rect = workspaceRef.current.getBoundingClientRect()
    setSplitPercent(Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100)))
  }

  function onMouseUp() { isDragging.current = false }

  function updateDiagramConfig(key, value) {
    setDiagramConfig((prev) => ({ ...prev, [key]: value }))
  }

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

        <div className="options-sep" />

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
          <kbd>⌘T</kbd> new tab &nbsp;·&nbsp; <kbd>⌘⇧W</kbd> close tab
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

      <div className="workspace" ref={workspaceRef}>
        <div className="pane-wrapper" style={{ width: `${splitPercent}%` }}>
          <Editor
            key={activeTab.id}
            code={activeTab.code}
            onChange={updateCode}
            errorLine={errorLine}
            darkMode={uiTheme === 'dark'}
          />
        </div>
        <div className="resize-handle" onMouseDown={onDragStart} />
        <div className="pane-wrapper" style={{ width: `${100 - splitPercent}%` }}>
          <Preview
            key={activeTab.id + '-preview'}
            code={activeTab.code}
            tabId={activeTab.id}
            tabName={activeTab.name}
            pageTitle={pageTitle}
            config={diagramConfig}
            onError={setErrorLine}
          />
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

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import TabBar from './components/TabBar'
import Editor from './components/Editor'
import Preview from './components/Preview'

const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

function makeTab(name) {
  return { id: crypto.randomUUID(), name, code: DEFAULT_CODE }
}

const INITIAL_TABS = [makeTab('Diagram 1')]

export default function App() {
  const [tabs, setTabs] = useLocalStorage('mermaid-tabs', INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useLocalStorage('mermaid-active-tab', INITIAL_TABS[0].id)
  const [pageTitle, setPageTitle] = useLocalStorage('mermaid-page-title', 'Mermaid Viewer')
  const [splitPercent, setSplitPercent] = useState(50)
  const isDragging = useRef(false)
  const workspaceRef = useRef(null)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  useEffect(() => { document.title = pageTitle }, [pageTitle])

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

  function onDragStart(e) {
    isDragging.current = true
    e.preventDefault()
  }

  function onMouseMove(e) {
    if (!isDragging.current || !workspaceRef.current) return
    const rect = workspaceRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setSplitPercent(Math.min(80, Math.max(20, pct)))
  }

  function onMouseUp() {
    isDragging.current = false
  }

  return (
    <div
      className="app"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <header className="app-header">
        <span className="app-logo">⬡</span>
        <EditableTitle value={pageTitle} onChange={setPageTitle} />
      </header>
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
          <Editor key={activeTab.id} code={activeTab.code} onChange={updateCode} />
        </div>
        <div className="resize-handle" onMouseDown={onDragStart} />
        <div className="pane-wrapper" style={{ width: `${100 - splitPercent}%` }}>
          <Preview key={activeTab.id + '-preview'} code={activeTab.code} tabId={activeTab.id} />
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
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    const trimmed = draft.trim()
    onChange(trimmed || value)
    setEditing(false)
  }

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
    <span className="page-title" onClick={startEdit} title="Click to rename">
      {value}
      <span className="page-title-edit-icon">✎</span>
    </span>
  )
}

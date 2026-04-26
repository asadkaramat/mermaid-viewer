import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Header from './components/Header'
import OptionsBar from './components/OptionsBar'
import TabBar from './components/TabBar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import EmbedModal from './components/EmbedModal'
import { detectDiagramType } from './utils/diagrams'
import { encodeState, decodeHash } from './utils/share'
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

export default function App() {
  const [tabs, setTabs] = useLocalStorage('mermaid-tabs', INITIAL_TABS)
  const [activeTabId, setActiveTabId] = useLocalStorage('mermaid-active-tab', INITIAL_TABS[0].id)
  const [pageTitle, setPageTitle] = useLocalStorage('mermaid-page-title', 'Mermaid Viewer')
  const [uiTheme, setUiTheme] = useLocalStorage('mermaid-ui-theme', 'light')
  const [diagramConfig, setDiagramConfig] = useLocalStorage('mermaid-diagram-config', { theme: 'default', look: 'classic' })
  const [splitDir, setSplitDir] = useLocalStorage('mermaid-split-dir', 'h')
  const [bgColor, setBgColor] = useLocalStorage('mermaid-bg-color', '#ffffff')
  const [splitPercent, setSplitPercent] = useState(50)
  const [shareLabel, setShareLabel] = useState('Share')
  const [errorLine, setErrorLine] = useState(null)
  const [presentationMode, setPresentationMode] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)

  const isDragging = useRef(false)
  const workspaceRef = useRef(null)
  const actionsRef = useRef({})
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
      setShareLabel('✓ Copied!')
      setTimeout(() => setShareLabel('Share'), 2000)
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

  actionsRef.current = { addTab, removeActiveTab: () => tabs.length > 1 && removeTab(activeTab.id), formatCode }

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

  const editorStyle = splitDir === 'h'
    ? { width: `${splitPercent}%` }
    : { height: `${splitPercent}%`, width: '100%' }

  const previewStyle = presentationMode
    ? { flex: 1, minWidth: 0, width: '100%' }
    : splitDir === 'h'
      ? { width: `${100 - splitPercent}%` }
      : { height: `${100 - splitPercent}%`, width: '100%' }

  return (
    <div className="app" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <Header
        pageTitle={pageTitle}
        onPageTitleChange={setPageTitle}
        uiTheme={uiTheme}
        onUiThemeToggle={() => setUiTheme((t) => t === 'light' ? 'dark' : 'light')}
        presentationMode={presentationMode}
        onPresentationToggle={() => setPresentationMode((p) => !p)}
        onEmbedOpen={() => setEmbedOpen(true)}
        onImportWorkspace={importWorkspace}
        onExportWorkspace={exportWorkspace}
        shareLabel={shareLabel}
        onShare={share}
      />

      <OptionsBar
        diagramConfig={diagramConfig}
        onDiagramConfigChange={(key, val) => setDiagramConfig((prev) => ({ ...prev, [key]: val }))}
        diagramType={diagramType}
        onDiagramTypeChange={changeDiagramType}
        splitDir={splitDir}
        onSplitDirToggle={() => setSplitDir((d) => d === 'h' ? 'v' : 'h')}
        onFormat={formatCode}
        onLoadSample={updateCode}
        samples={SAMPLES}
      />

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
        <EmbedModal tabs={tabs} activeTab={activeTab} onClose={() => setEmbedOpen(false)} />
      )}
    </div>
  )
}

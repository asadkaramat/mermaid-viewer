import { useRef } from 'react'
import EditableTitle from './EditableTitle'

export default function Header({
  pageTitle, onPageTitleChange,
  uiTheme, onUiThemeToggle,
  presentationMode, onPresentationToggle,
  onEmbedOpen,
  onImportWorkspace,
  onExportWorkspace,
  shareLabel, onShare,
}) {
  const importRef = useRef(null)

  return (
    <header className="app-header">
      <span className="app-logo">⬡</span>
      <EditableTitle value={pageTitle} onChange={onPageTitleChange} />
      <div className="header-actions">
        <button
          className="icon-btn"
          onClick={onUiThemeToggle}
          title={uiTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {uiTheme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          className="icon-btn"
          onClick={onPresentationToggle}
          title={presentationMode ? 'Exit presentation mode' : 'Presentation mode'}
        >
          {presentationMode ? '⊠' : '⛶'}
        </button>
        <button className="icon-btn" onClick={onEmbedOpen} title="Get embed code">
          {'</>'}
        </button>
        <button
          className="icon-btn"
          onClick={() => importRef.current?.click()}
          title="Import workspace (.json)"
        >
          ⬆
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={onImportWorkspace}
        />
        <button className="icon-btn" onClick={onExportWorkspace} title="Export workspace (.json)">
          ⬇
        </button>
        <button className="share-btn" onClick={onShare}>{shareLabel}</button>
      </div>
    </header>
  )
}

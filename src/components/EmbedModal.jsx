import { useState } from 'react'
import { encodeState } from '../utils/share'

export default function EmbedModal({ tabs, activeTab, onClose }) {
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

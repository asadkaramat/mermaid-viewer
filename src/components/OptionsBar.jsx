import { DIAGRAM_TYPES } from '../utils/diagrams'

export default function OptionsBar({
  diagramConfig, onDiagramConfigChange,
  diagramType, onDiagramTypeChange,
  splitDir, onSplitDirToggle,
  onFormat,
  onLoadSample,
  samples,
}) {
  const currentTypePrefix = DIAGRAM_TYPES.find((t) => t.label === diagramType)?.prefix ?? ''

  return (
    <div className="options-bar">
      <label className="options-label">Theme</label>
      <select
        className="options-select"
        value={diagramConfig.theme}
        onChange={(e) => onDiagramConfigChange('theme', e.target.value)}
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
        onChange={(e) => onDiagramConfigChange('look', e.target.value)}
      >
        <option value="classic">Classic</option>
        <option value="handDrawn">Hand Drawn</option>
      </select>

      <label className="options-label">Type</label>
      <select
        className="options-select"
        value={currentTypePrefix}
        onChange={(e) => { if (e.target.value) onDiagramTypeChange(e.target.value) }}
      >
        {!diagramType && <option value="">Unknown</option>}
        {DIAGRAM_TYPES.map((t) => (
          <option key={t.label} value={t.prefix}>{t.label}</option>
        ))}
      </select>

      <label className="options-label">Layout</label>
      <button
        className="icon-btn layout-btn"
        onClick={onSplitDirToggle}
        title={splitDir === 'h' ? 'Switch to vertical split' : 'Switch to horizontal split'}
      >
        {splitDir === 'h' ? '⬛' : '▬'}
      </button>

      <div className="options-sep" />

      <button className="toolbar-btn" onClick={onFormat} title="Format code (⌘⇧F)">
        Format
      </button>

      <label className="options-label">Sample</label>
      <select
        className="options-select"
        value=""
        onChange={(e) => { if (e.target.value) { onLoadSample(e.target.value); e.target.value = '' } }}
      >
        <option value="">Load example…</option>
        {samples.map((s) => (
          <option key={s.label} value={s.code}>{s.label}</option>
        ))}
      </select>

      <div className="options-hint">
        <kbd>⌘T</kbd> new &nbsp;·&nbsp; <kbd>⌘⇧W</kbd> close &nbsp;·&nbsp; <kbd>⌘⇧F</kbd> format
      </div>
    </div>
  )
}

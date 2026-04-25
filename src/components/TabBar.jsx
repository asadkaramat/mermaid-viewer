import { useState, useRef, useEffect } from 'react'

export default function TabBar({ tabs, activeTabId, onSelect, onAdd, onRemove, onRename }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  function startEdit(tab, e) {
    e.stopPropagation()
    setEditingId(tab.id)
    setEditValue(tab.name)
  }

  function commitEdit() {
    if (editingId) {
      const trimmed = editValue.trim()
      if (trimmed) onRename(editingId, trimmed)
      setEditingId(null)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditingId(null)
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'tab-active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {editingId === tab.id ? (
            <input
              ref={inputRef}
              className="tab-name-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="tab-name">{tab.name}</span>
              <button
                className="tab-rename"
                onClick={(e) => startEdit(tab, e)}
                title="Rename tab"
              >
                ✎
              </button>
            </>
          )}
          {tabs.length > 1 && (
            <button
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); onRemove(tab.id) }}
              title="Close tab"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className="tab-add" onClick={onAdd} title="New diagram">+</button>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

export default function EditableTitle({ value, onChange }) {
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

import { useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { mermaid } from 'codemirror-lang-mermaid'
import { oneDark } from '@codemirror/theme-one-dark'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

const setErrorLine = StateEffect.define()

const errorLineField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        if (e.value == null) return Decoration.none
        try {
          const line = tr.state.doc.line(e.value)
          return Decoration.set([Decoration.line({ class: 'cm-error-line' }).range(line.from)])
        } catch {
          return Decoration.none
        }
      }
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

const extensions = [mermaid(), errorLineField]

export default function Editor({ code, onChange, errorLine, darkMode, onDropFile }) {
  const viewRef = useRef(null)

  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({ effects: setErrorLine.of(errorLine ?? null) })
  }, [errorLine])

  function onDragOver(e) {
    e.preventDefault()
  }

  function onDrop(e) {
    e.preventDefault()
    const file = [...e.dataTransfer.files].find((f) => /\.(mmd|txt|md)$/i.test(f.name))
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onDropFile?.(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="editor-pane" onDragOver={onDragOver} onDrop={onDrop}>
      <CodeMirror
        value={code}
        height="100%"
        theme={darkMode ? oneDark : 'light'}
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={(view) => {
          viewRef.current = view
          if (errorLine != null) {
            view.dispatch({ effects: setErrorLine.of(errorLine) })
          }
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
        }}
      />
    </div>
  )
}

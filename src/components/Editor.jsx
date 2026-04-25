import CodeMirror from '@uiw/react-codemirror'
import { mermaid } from 'codemirror-lang-mermaid'
import { oneDark } from '@codemirror/theme-one-dark'

const extensions = [mermaid()]

export default function Editor({ code, onChange }) {
  return (
    <div className="editor-pane">
      <CodeMirror
        value={code}
        height="100%"
        theme={oneDark}
        extensions={extensions}
        onChange={onChange}
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

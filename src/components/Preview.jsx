import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import CanvasToolbar from './CanvasToolbar'
import {
  isFlowchart, parseFlowchart, addNode, addEdge,
  deleteNode, deleteEdge, renameLabel, nextNodeId,
} from '../utils/flowchart'

let idCounter = 0
const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.2
const ZOOM_MAX = 10
const DRAG_THRESHOLD = 5

function parseErrorLine(msg) {
  const m = msg.match(/line (\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

// Mermaid renders node g elements with id like
//   "{diagramId}-flowchart-{originalId}-{vertexCounter}"
// where diagramId may contain additional hyphens. We strip any leading prefix.
function nodeIdFromEl(el) {
  if (!el) return null
  const raw = el.id || ''
  const m = raw.match(/(?:^|-)flowchart-(.+)-\d+$/)
  if (m) return m[1]
  return el.getAttribute('data-id') || null
}

// Mermaid edges are path elements with class "flowchart-link" and a data-id like "L_A_B_0".
// The full id is "{diagramId}-L_{src}_{tgt}_{idx}".
function edgeIdsFromEl(el) {
  if (!el) return null
  const dataId = el.getAttribute?.('data-id')
  const raw = dataId || el.id || ''
  const m = raw.match(/(?:^|-)L_(.+?)_(.+?)_\d+$/)
  if (m) return { source: m[1], target: m[2] }
  return null
}

export default function Preview({
  code, tabId, tabName, pageTitle, config, onError, onCodeChange,
  bgColor, onBgColorChange, presentationMode, onExitPresentation,
}) {
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const overlayRef = useRef(null)
  const zoomRef = useRef(1)
  const hasAutoFitted = useRef(false)
  const lastPinchDist = useRef(0)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [copyLabel, setCopyLabel] = useState('Copy SVG')
  const [copyPngLabel, setCopyPngLabel] = useState('Copy PNG')

  const flowchart = isFlowchart(code)
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [pendingSource, setPendingSource] = useState(null)
  const [editingNode, setEditingNode] = useState(null) // { id, x, y, w, h, value }
  const [hint, setHint] = useState('')
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const toolRef = useRef(tool)
  const codeRef = useRef(code)
  const selectedRef = useRef(selectedId)
  const pendingSourceRef = useRef(pendingSource)
  const editingRef = useRef(editingNode)
  const lastCommitAt = useRef(0)
  const panRef = useRef(pan)
  const stageRef = useRef(null)
  const intrinsicRef = useRef(null)
  toolRef.current = tool
  codeRef.current = code
  selectedRef.current = selectedId
  pendingSourceRef.current = pendingSource
  editingRef.current = editingNode
  zoomRef.current = zoom
  panRef.current = pan

  // Reset visual editing state when switching tabs / leaving flowchart mode.
  useEffect(() => {
    setSelectedId(null)
    setPendingSource(null)
    setEditingNode(null)
  }, [tabId, flowchart])

  // Apply the current zoom by sizing the SVG element directly. This keeps vector
  // rendering crisp at any zoom (CSS transform scale would rasterize and blur).
  function applySvgSize() {
    const svgEl = getSvgEl()
    const size = intrinsicRef.current
    if (!svgEl || !size) return
    svgEl.setAttribute('width', size.w * zoomRef.current)
    svgEl.setAttribute('height', size.h * zoomRef.current)
    svgEl.style.maxWidth = 'none'
  }

  useEffect(() => { applySvgSize() }, [zoom])

  function getSvgIntrinsicSize() {
    const svgEl = getSvgEl()
    if (!svgEl) return null
    const viewBox = svgEl.viewBox?.baseVal
    let w = parseFloat(svgEl.getAttribute('width')) || viewBox?.width || 0
    let h = parseFloat(svgEl.getAttribute('height')) || viewBox?.height || 0
    if (!w || !h) {
      const rect = svgEl.getBoundingClientRect()
      const z = zoomRef.current || 1
      w = rect.width / z
      h = rect.height / z
    }
    return w && h ? { w, h } : null
  }

  function fitToView() {
    const scrollEl = scrollRef.current
    const size = getSvgIntrinsicSize()
    if (!scrollEl || !size) return

    const pad = 48
    const fitZoom = Math.min(
      (scrollEl.clientWidth - pad) / size.w,
      (scrollEl.clientHeight - pad) / size.h,
      1.5,
    )
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat(fitZoom.toFixed(2))))
    const newPan = {
      x: (scrollEl.clientWidth - size.w * newZoom) / 2,
      y: (scrollEl.clientHeight - size.h * newZoom) / 2,
    }
    setZoom(newZoom)
    setPan(newPan)
  }

  function resetZoom() {
    const scrollEl = scrollRef.current
    const size = getSvgIntrinsicSize()
    if (!scrollEl || !size) { setZoom(1); return }
    setZoom(1)
    setPan({
      x: (scrollEl.clientWidth - size.w) / 2,
      y: (scrollEl.clientHeight - size.h) / 2,
    })
  }

  // ---------- transform-based pan, wheel zoom, pinch ----------
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let dragging = false
    let didDrag = false
    let startX = 0, startY = 0, startPanX = 0, startPanY = 0

    function shouldPan(e) {
      const t = toolRef.current
      if (t === 'pan') return true
      if (t !== 'select') return false
      return !e.target.closest('g.node') && !e.target.closest('path.flowchart-link') && !e.target.closest('.node-edit-input')
    }

    function zoomAt(clientX, clientY, delta) {
      const rect = el.getBoundingClientRect()
      const cx = clientX - rect.left
      const cy = clientY - rect.top
      const oldZoom = zoomRef.current
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((oldZoom + delta).toFixed(2))))
      if (newZoom === oldZoom) return
      const k = newZoom / oldZoom
      const p = panRef.current
      setPan({ x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k })
      setZoom(newZoom)
    }

    function onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      zoomAt(e.clientX, e.clientY, delta)
    }

    function onMouseDown(e) {
      if (e.button !== 0) return
      didDrag = false
      if (!shouldPan(e)) return
      dragging = true
      startX = e.clientX
      startY = e.clientY
      const p = panRef.current
      startPanX = p.x
      startPanY = p.y
      el.classList.add('is-dragging')
    }

    function onMouseMove(e) {
      if (!dragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) didDrag = true
      setPan({ x: startPanX + dx, y: startPanY + dy })
    }

    function onMouseUp() {
      dragging = false
      el.classList.remove('is-dragging')
      el.dataset.didDrag = didDrag ? '1' : '0'
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
      }
    }

    function onTouchMove(e) {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = (dist - lastPinchDist.current) / 200
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        zoomAt(cx, cy, delta)
        lastPinchDist.current = dist
      }
    }

    function onKeyDown(e) {
      const STEP = 60
      if (e.key === 'ArrowLeft')  { setPan((p) => ({ ...p, x: p.x + STEP })); e.preventDefault() }
      else if (e.key === 'ArrowRight') { setPan((p) => ({ ...p, x: p.x - STEP })); e.preventDefault() }
      else if (e.key === 'ArrowUp')    { setPan((p) => ({ ...p, y: p.y + STEP })); e.preventDefault() }
      else if (e.key === 'ArrowDown')  { setPan((p) => ({ ...p, y: p.y - STEP })); e.preventDefault() }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ---------- mermaid render ----------
  useEffect(() => {
    if (!containerRef.current || !code.trim()) {
      setError(null)
      onError?.(null)
      if (containerRef.current) containerRef.current.innerHTML = ''
      return
    }

    let cancelled = false
    const diagramId = `mermaid-${tabId}-${++idCounter}`

    async function render() {
      mermaid.initialize({
        startOnLoad: false,
        theme: config?.theme ?? 'default',
        look: config?.look ?? 'classic',
        securityLevel: 'loose',
      })

      try {
        const { svg } = await mermaid.render(diagramId, code)
        if (!cancelled) {
          containerRef.current.innerHTML = svg
          setError(null)
          onError?.(null)
          // Capture the intrinsic SVG size from viewBox or attrs once per render.
          const svgEl = getSvgEl()
          if (svgEl) {
            const vb = svgEl.viewBox?.baseVal
            const w = vb?.width || parseFloat(svgEl.getAttribute('width')) || 0
            const h = vb?.height || parseFloat(svgEl.getAttribute('height')) || 0
            if (w && h) intrinsicRef.current = { w, h }
            applySvgSize()
          }
          if (!hasAutoFitted.current) {
            hasAutoFitted.current = true
            requestAnimationFrame(fitToView)
          }
          // Re-apply selection / pending highlights on the freshly rendered SVG.
          requestAnimationFrame(applyHighlights)
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err.message || 'Invalid diagram syntax'
          setError(msg)
          onError?.(parseErrorLine(msg))
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [code, tabId, config?.theme, config?.look])

  // ---------- highlight helpers ----------
  function clearHighlights() {
    const svg = getSvgEl()
    if (!svg) return
    svg.querySelectorAll('g.node.is-selected, g.node.is-pending-source').forEach((n) => {
      n.classList.remove('is-selected', 'is-pending-source')
    })
  }

  function applyHighlights() {
    const svg = getSvgEl()
    if (!svg) return
    clearHighlights()
    if (selectedRef.current) {
      const el = findNodeEl(selectedRef.current)
      el?.classList.add('is-selected')
    }
    if (pendingSourceRef.current) {
      const el = findNodeEl(pendingSourceRef.current)
      el?.classList.add('is-pending-source')
    }
  }

  function findNodeEl(id) {
    const svg = getSvgEl()
    if (!svg) return null
    // The id has variable diagramId prefix, so iterate and match by parsed id.
    const nodes = svg.querySelectorAll('g.node')
    for (const n of nodes) if (nodeIdFromEl(n) === id) return n
    return null
  }

  useEffect(() => { applyHighlights() }, [selectedId, pendingSource])

  // ---------- click dispatch ----------
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function onClick(e) {
      if (el.dataset.didDrag === '1') { el.dataset.didDrag = '0'; return }
      if (editingRef.current) return // ignore clicks while editing
      // Swallow the click that closed an inline edit (mousedown blurred the input first).
      if (Date.now() - lastCommitAt.current < 250) return
      if (!flowchart) return

      const nodeEl = e.target.closest('g.node')
      const edgeEl = e.target.closest('path.flowchart-link')
      const t = toolRef.current

      if (nodeEl) {
        const id = nodeIdFromEl(nodeEl)
        if (!id) return
        handleNodeClick(id, nodeEl, e)
      } else if (edgeEl) {
        const ids = edgeIdsFromEl(edgeEl)
        if (ids) handleEdgeClick(ids.source, ids.target, e)
      } else {
        handleCanvasClick(e)
      }
    }

    function onDblClick(e) {
      if (!flowchart) return
      const nodeEl = e.target.closest('g.node')
      if (!nodeEl) return
      const id = nodeIdFromEl(nodeEl)
      if (id) startEdit(id)
    }

    el.addEventListener('click', onClick)
    el.addEventListener('dblclick', onDblClick)
    return () => {
      el.removeEventListener('click', onClick)
      el.removeEventListener('dblclick', onDblClick)
    }
  }, [flowchart])

  // ---------- keyboard for delete + escape ----------
  useEffect(() => {
    function onKey(e) {
      if (!flowchart) return
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.isContentEditable) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRef.current) {
        e.preventDefault()
        commitCode(deleteNode(codeRef.current, selectedRef.current))
        setSelectedId(null)
      } else if (e.key === 'Escape') {
        setSelectedId(null)
        setPendingSource(null)
        setEditingNode(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flowchart])

  // ---------- actions ----------
  function commitCode(next) {
    if (next !== codeRef.current) onCodeChange?.(next)
  }

  function handleNodeClick(id, nodeEl, e) {
    const t = toolRef.current
    if (t === 'select') {
      setSelectedId(id)
      setPendingSource(null)
    } else if (t === 'arrow') {
      if (!pendingSourceRef.current) {
        setPendingSource(id)
        setHint(`Source: ${id} — click target node to connect`)
      } else if (pendingSourceRef.current === id) {
        setPendingSource(null)
        setHint('')
      } else {
        const src = pendingSourceRef.current
        commitCode(addEdge(codeRef.current, { source: src, target: id }))
        setPendingSource(null)
        setHint('')
      }
    } else if (t === 'text') {
      startEdit(id)
    } else if (t === 'eraser') {
      commitCode(deleteNode(codeRef.current, id))
      if (selectedRef.current === id) setSelectedId(null)
    }
  }

  function handleEdgeClick(source, target, e) {
    const t = toolRef.current
    if (t === 'eraser') {
      commitCode(deleteEdge(codeRef.current, source, target))
    }
  }

  function handleCanvasClick(e) {
    const t = toolRef.current
    if (t === 'select' || t === 'pan' || t === 'arrow' || t === 'eraser' || t === 'text') {
      // Empty click clears selection / pending edge
      if (selectedRef.current) setSelectedId(null)
      if (pendingSourceRef.current) { setPendingSource(null); setHint('') }
      return
    }
    if (['rect', 'diamond', 'circle', 'round'].includes(t)) {
      const id = nextNodeId(codeRef.current)
      commitCode(addNode(codeRef.current, { id, shape: t, label: id }))
      // Auto-select the new node so the next action targets it.
      setSelectedId(id)
    }
  }

  function startEdit(id) {
    const nodeEl = findNodeEl(id)
    const stageEl = stageRef.current
    if (!nodeEl || !stageEl) return
    const nodeRect = nodeEl.getBoundingClientRect()
    const stageRect = stageEl.getBoundingClientRect()
    const parsed = parseFlowchart(codeRef.current).nodes.get(id)
    setEditingNode({
      id,
      x: nodeRect.left - stageRect.left,
      y: nodeRect.top - stageRect.top,
      w: nodeRect.width,
      h: nodeRect.height,
      value: parsed?.label ?? id,
    })
  }

  function commitEdit() {
    const ed = editingRef.current
    if (!ed) return
    const trimmed = ed.value.trim()
    if (trimmed && trimmed !== ed.id) {
      commitCode(renameLabel(codeRef.current, ed.id, trimmed))
    }
    setEditingNode(null)
    lastCommitAt.current = Date.now()
  }

  // ---------- existing copy/export below ----------
  function zoomIn() { setZoom((z) => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2)))) }
  function zoomOut() { setZoom((z) => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2)))) }

  function getSvgEl() { return containerRef.current?.querySelector('svg') }

  function getSvgDimensions(svgEl) {
    const viewBox = svgEl.viewBox?.baseVal
    let w = parseFloat(svgEl.getAttribute('width')) || viewBox?.width || 0
    let h = parseFloat(svgEl.getAttribute('height')) || viewBox?.height || 0
    if (!w || !h) {
      const rect = svgEl.getBoundingClientRect()
      w = Math.round(rect.width / zoom)
      h = Math.round(rect.height / zoom)
    }
    return { w, h }
  }

  function buildCanvas(svgEl) {
    return new Promise((resolve) => {
      const { w, h } = getSvgDimensions(svgEl)
      if (!w || !h) { resolve(null); return }

      const clone = svgEl.cloneNode(true)
      clone.setAttribute('width', w)
      clone.setAttribute('height', h)
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.style.maxWidth = ''

      const svgStr = new XMLSerializer().serializeToString(clone)
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)

      const img = new Image()
      img.onload = () => {
        const scale = 2
        const label = pageTitle || tabName
        const titleH = label ? 36 : 0
        const pad = 20
        const canvasW = Math.max(w, 200)
        const canvasH = h + titleH + pad * 2

        const canvas = document.createElement('canvas')
        canvas.width = canvasW * scale
        canvas.height = canvasH * scale
        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)
        ctx.fillStyle = bgColor || '#ffffff'
        ctx.fillRect(0, 0, canvasW, canvasH)

        if (label) {
          ctx.fillStyle = '#1c1c1e'
          ctx.font = 'bold 14px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(label, canvasW / 2, titleH / 2 + 5)
        }

        ctx.drawImage(img, (canvasW - w) / 2, titleH + pad, w, h)
        resolve(canvas)
      }
      img.src = dataUrl
    })
  }

  async function copySvg() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    await navigator.clipboard.writeText(new XMLSerializer().serializeToString(svgEl))
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy SVG'), 2000)
  }

  async function copyPng() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    const canvas = await buildCanvas(svgEl)
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopyPngLabel('Copied!')
      } catch {
        setCopyPngLabel('Failed')
      }
      setTimeout(() => setCopyPngLabel('Copy PNG'), 2000)
    })
  }

  async function exportSvg() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    const svgStr = new XMLSerializer().serializeToString(svgEl)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }))
    a.download = `${tabName || 'diagram'}.svg`
    a.click()
  }

  async function exportPng() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    const canvas = await buildCanvas(svgEl)
    if (!canvas) return
    canvas.toBlob((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${tabName || 'diagram'}.png`
      a.click()
    })
  }

  function exportPdf() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    const svgStr = new XMLSerializer().serializeToString(svgEl)
    const title = pageTitle || tabName || 'Diagram'
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:20mm}body{margin:0;padding:16px;font-family:system-ui}h1{font-size:16px;margin:0 0 16px}svg{max-width:100%;height:auto}</style></head><body><h1>${title}</h1>${svgStr}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  const disabled = !!error || !code.trim()
  const cursorClass = `tool-cursor-${tool}`

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        {presentationMode && (
          <button className="toolbar-btn" onClick={onExitPresentation} style={{ color: 'var(--accent)', marginRight: 4 }}>
            ← Exit
          </button>
        )}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">−</button>
          <button className="zoom-label" onClick={resetZoom} title="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button className="zoom-btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">+</button>
          <button className="zoom-btn" onClick={fitToView} disabled={disabled} title="Fit to view">⊡</button>
        </div>
        <div className="toolbar-sep" />
        <label className="bg-color-swatch" title="Export background color">
          <span className="bg-color-preview" style={{ background: bgColor || '#ffffff' }} />
          <input type="color" value={bgColor || '#ffffff'} onChange={(e) => onBgColorChange?.(e.target.value)} />
        </label>
        <button className="toolbar-btn" onClick={copySvg} disabled={disabled}>{copyLabel}</button>
        <button className="toolbar-btn" onClick={copyPng} disabled={disabled}>{copyPngLabel}</button>
        <button className="toolbar-btn" onClick={exportSvg} disabled={disabled}>SVG ↓</button>
        <button className="toolbar-btn" onClick={exportPng} disabled={disabled}>PNG ↓</button>
        <button className="export-btn" onClick={exportPdf} disabled={disabled}>PDF ↓</button>
      </div>

      {flowchart && !presentationMode && (
        <CanvasToolbar
          tool={tool}
          onToolChange={setTool}
          hint={
            pendingSource
              ? `Source: ${pendingSource} — click target node to connect`
              : selectedId
                ? `Selected: ${selectedId} — Delete to remove • double-click to rename`
                : hint
          }
        />
      )}

      {error ? (
        <div className="preview-error"><pre>{error}</pre></div>
      ) : (
        <div className={`preview-scroll ${cursorClass}`} ref={scrollRef} tabIndex={0}>
          <div
            className="preview-stage"
            ref={stageRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: '0 0',
            }}
          >
            <div ref={containerRef} />
            {editingNode && (
              <input
                className="node-edit-input"
                autoFocus
                value={editingNode.value}
                onChange={(e) => setEditingNode((ed) => ed && { ...ed, value: e.target.value })}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                  else if (e.key === 'Escape') { e.preventDefault(); setEditingNode(null) }
                }}
                style={{
                  position: 'absolute',
                  left: editingNode.x,
                  top: editingNode.y,
                  width: editingNode.w,
                  height: editingNode.h,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

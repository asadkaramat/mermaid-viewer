import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })

let idCounter = 0
const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.2
const ZOOM_MAX = 4

export default function Preview({ code, tabId }) {
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let dragging = false
    let startX = 0, startY = 0, startScrollLeft = 0, startScrollTop = 0

    function onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((z + delta).toFixed(2)))))
    }

    function onMouseDown(e) {
      if (e.button !== 0) return
      dragging = true
      startX = e.clientX
      startY = e.clientY
      startScrollLeft = el.scrollLeft
      startScrollTop = el.scrollTop
      el.classList.add('is-dragging')
    }

    function onMouseMove(e) {
      if (!dragging) return
      el.scrollLeft = startScrollLeft - (e.clientX - startX)
      el.scrollTop = startScrollTop - (e.clientY - startY)
    }

    function onMouseUp() {
      dragging = false
      el.classList.remove('is-dragging')
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || !code.trim()) {
      setError(null)
      if (containerRef.current) containerRef.current.innerHTML = ''
      return
    }

    let cancelled = false
    const diagramId = `mermaid-${tabId}-${++idCounter}`

    async function render() {
      try {
        const { svg } = await mermaid.render(diagramId, code)
        if (!cancelled) {
          containerRef.current.innerHTML = svg
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Invalid diagram syntax')
      }
    }

    render()
    return () => { cancelled = true }
  }, [code, tabId])

  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2))))
  }

  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2))))
  }

  async function exportPng() {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return

    // Derive natural pixel dimensions from viewBox or getBoundingClientRect (un-zoomed)
    const viewBox = svgEl.viewBox?.baseVal
    let w = parseFloat(svgEl.getAttribute('width')) || viewBox?.width || 0
    let h = parseFloat(svgEl.getAttribute('height')) || viewBox?.height || 0
    if (!w || !h) {
      const rect = svgEl.getBoundingClientRect()
      w = Math.round(rect.width / zoom)
      h = Math.round(rect.height / zoom)
    }
    if (!w || !h) return

    // Clone and set explicit dimensions so the browser knows the canvas size
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('width', w)
    clone.setAttribute('height', h)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.style.maxWidth = ''

    const svgStr = new XMLSerializer().serializeToString(clone)
    // Data URL is more reliable than blob URL for SVG→canvas rendering
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)

    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'diagram.png'
        a.click()
      })
    }
    img.src = dataUrl
  }

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">−</button>
          <button className="zoom-label" onClick={() => setZoom(1)} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button className="zoom-btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">+</button>
        </div>
        <div className="toolbar-sep" />
        <button className="export-btn" onClick={exportPng} disabled={!!error || !code.trim()}>
          Export PNG
        </button>
      </div>
      {error ? (
        <div className="preview-error">
          <pre>{error}</pre>
        </div>
      ) : (
        <div className="preview-scroll" ref={scrollRef}>
          <div className="preview-center">
            <div ref={containerRef} style={{ zoom }} />
          </div>
        </div>
      )}
    </div>
  )
}

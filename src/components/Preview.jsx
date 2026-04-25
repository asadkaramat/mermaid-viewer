import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

let idCounter = 0
const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.2
const ZOOM_MAX = 4

function parseErrorLine(msg) {
  const m = msg.match(/line (\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

export default function Preview({ code, tabId, tabName, pageTitle, config, onError }) {
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [copyLabel, setCopyLabel] = useState('Copy SVG')

  // Wheel zoom + mouse drag
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

  // Render diagram
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

  async function copySvg() {
    const svgEl = getSvgEl()
    if (!svgEl) return
    await navigator.clipboard.writeText(new XMLSerializer().serializeToString(svgEl))
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy SVG'), 2000)
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

    const { w, h } = getSvgDimensions(svgEl)
    if (!w || !h) return

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

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasW, canvasH)

      if (label) {
        ctx.fillStyle = '#1c1c1e'
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, canvasW / 2, titleH / 2 + 5)
      }

      ctx.drawImage(img, (canvasW - w) / 2, titleH + pad, w, h)

      canvas.toBlob((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${tabName || 'diagram'}.png`
        a.click()
      })
    }
    img.src = dataUrl
  }

  const disabled = !!error || !code.trim()

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">−</button>
          <button className="zoom-label" onClick={() => setZoom(1)} title="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button className="zoom-btn" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">+</button>
        </div>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" onClick={copySvg} disabled={disabled}>{copyLabel}</button>
        <button className="toolbar-btn" onClick={exportSvg} disabled={disabled}>SVG ↓</button>
        <button className="export-btn" onClick={exportPng} disabled={disabled}>PNG ↓</button>
      </div>
      {error ? (
        <div className="preview-error"><pre>{error}</pre></div>
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

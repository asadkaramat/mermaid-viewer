# Mermaid Viewer

A lightweight, client-side Mermaid diagram viewer with a live code editor. View and edit multiple diagrams simultaneously in a split-pane interface — no account or backend required.

## Features

### Editor
- **Live preview** — syntax-highlighted editor with instant diagram rendering
- **Multiple tabs** — create, rename, and close diagram tabs (`⌘T` / `⌘⇧W`)
- **Auto-format** — clean up code whitespace with one click or `⌘⇧F`
- **Diagram type switcher** — change the diagram type from the options bar
- **Drag-and-drop** — drop a `.mmd` or `.txt` file onto the editor to load it
- **Error highlighting** — error line is highlighted in red in the editor

### Preview
- **Zoom** — toolbar buttons, two-finger scroll, or pinch-to-zoom on touch devices
- **Pan** — click-and-drag or use arrow keys (click preview first to focus)
- **Fit to view** — auto-fit button scales diagram to fill the pane
- **Resizable split** — drag the divider; supports both horizontal and vertical layouts

### Export
- **Copy SVG** — copy raw SVG markup to clipboard
- **Copy PNG** — copy a high-resolution PNG directly to clipboard
- **Export SVG** — download as `.svg`
- **Export PNG** — download as high-resolution `.png` with optional title
- **Export PDF** — open a print-ready window to save as PDF
- **Background color** — pick the background color used for PNG/PDF exports

### Sharing & Persistence
- **Shareable URLs** — encode all tabs into a single link to share with anyone
- **Embed code** — generate an `<iframe>` snippet or direct link for embedding
- **Export workspace** — save all tabs and settings as a `.json` file
- **Import workspace** — restore a previously exported workspace
- **Persistent** — all diagrams and settings are saved to localStorage

### Customization
- **Dark / light mode** — toggle in the header
- **Diagram themes** — Default, Dark, Forest, Neutral, Base
- **Look** — Classic or Hand Drawn style
- **Presentation mode** — hide the editor and view diagrams full-screen
- **Vertical split** — switch between side-by-side and top-bottom layouts
- **Custom page title** — click the title in the header to rename it

### Diagram Types
Flowchart, Sequence, Class, State, ER, Gantt, Pie, Mind Map, Timeline, Git Graph, Quadrant Chart, XY Chart, Kanban, User Journey, ZenUML, Block — with built-in samples for each.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘T` | New tab |
| `⌘⇧W` | Close active tab |
| `⌘⇧F` | Format code |
| `⌘F` | Find in editor |
| Arrow keys | Pan diagram (focus preview first) |

## Usage

| Action | How |
|---|---|
| New tab | Click **+** in the tab bar or `⌘T` |
| Rename tab | Click **✎** on a tab |
| Close tab | Click **×** on a tab |
| Zoom | Toolbar buttons, scroll wheel, or pinch |
| Pan | Click-drag or arrow keys |
| Resize split | Drag the divider |
| Layout direction | Click the Layout toggle in the options bar |
| Presentation mode | Click **⛶** in the header |
| Export | PNG ↓ / SVG ↓ / PDF ↓ in the preview toolbar |
| Copy to clipboard | Copy SVG or Copy PNG buttons |
| Share | Click **Share** — copies a URL with all tabs encoded |
| Embed | Click **</>** in the header |
| Export workspace | Click **⬇** in the header |
| Import workspace | Click **⬆** in the header |
| Drop a diagram file | Drag a `.mmd` file onto the editor |

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Mermaid.js](https://mermaid.js.org/)
- [CodeMirror 6](https://codemirror.net/) with [codemirror-lang-mermaid](https://github.com/Yash-Singh1/codemirror-lang-mermaid)

## Deployment

This is a fully static site — deploy to any static hosting provider:

- **Vercel**: connect your GitHub repo, zero config needed
- **Netlify**: same as Vercel
- **GitHub Pages**: set `base` in `vite.config.js` to your repo name

## License

[MIT](./LICENSE)

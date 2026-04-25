# Mermaid Viewer

A lightweight, client-side Mermaid diagram viewer with a live code editor. View and edit multiple diagrams simultaneously in a split-pane interface — no account or backend required.

## Features

- **Live editor** — syntax-highlighted code editor with instant diagram preview
- **Multiple tabs** — create, rename, and close diagram tabs
- **Zoom controls** — zoom in/out with toolbar buttons or two-finger scroll
- **Pan** — click and drag to pan around the diagram
- **Resizable split** — drag the divider to adjust editor/preview width
- **Export PNG** — export any diagram as a high-resolution PNG
- **Persistent** — diagrams are saved to localStorage across sessions
- **Custom page title** — click the title in the header to rename it

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

## Usage

| Action | How |
|---|---|
| New tab | Click **+** in the tab bar |
| Rename tab | Click the **✎** icon on a tab |
| Close tab | Click **×** on a tab |
| Zoom in/out | Toolbar buttons or two-finger scroll |
| Pan diagram | Click and drag |
| Resize split | Drag the divider between editor and preview |
| Export PNG | Click **Export PNG** in the preview toolbar |
| Rename page title | Click the title in the header |

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

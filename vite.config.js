import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mermaid-vendor': ['mermaid'],
          'codemirror-vendor': [
            '@uiw/react-codemirror',
            '@codemirror/theme-one-dark',
            'codemirror-lang-mermaid',
          ],
        },
      },
    },
  },
})

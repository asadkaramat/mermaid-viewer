export function encodeState(tabs, activeTabId) {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ tabs, activeTabId }))))
}

export function decodeHash(hash) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(hash))))
    if (Array.isArray(data.tabs) && data.tabs.length) return data
  } catch {}
  return null
}

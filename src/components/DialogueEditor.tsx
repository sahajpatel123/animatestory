"use client"
import { useState } from 'react'

export default function DialogueEditor({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false)

  async function regenerate() {
    setBusy(true)
    try {
      await fetch('/api/generate/dialogue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
      alert('Dialogue regenerated')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-black/20 rounded-lg p-4 bg-black/5">
      <div className="text-lg font-medium mb-3">Dialogue</div>
      <button disabled={busy} onClick={regenerate} className="px-5 py-3 bg-black text-white rounded-md disabled:opacity-50">{busy ? 'Working...' : 'Regenerate Dialogue'}</button>
    </div>
  )
}



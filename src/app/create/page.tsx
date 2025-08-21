"use client"
import { useState } from 'react'
import Reveal from '@/components/Reveal'
import { useRouter } from 'next/navigation'

export default function CreateProjectPage() {
  const [title, setTitle] = useState('My Story')
  const [prompt, setPrompt] = useState('A quiet city at dawn, a courier races the sunrise to deliver hope.')
  const [targetSec, setTargetSec] = useState(240)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
      const res = await fetch('/api/project', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ title, prompt, targetSec, style: 'default' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create project')
      router.push(`/project/${data.id}`)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <Reveal>
        <div>
          <h1 className="text-5xl font-semibold tracking-[0.5px]">Create a project</h1>
          <p className="text-black/70 mt-2 text-2xl">Start with a prompt — we handle outline, scenes, and renders.</p>
        </div>
      </Reveal>

      <form onSubmit={submit} className="rounded-xl border border-black/20 bg-white p-6 space-y-5 max-w-3xl">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full px-4 py-3 rounded-md bg-black text-white placeholder-white/60 border border-black" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Prompt</label>
          <textarea className="w-full px-4 py-3 rounded-md bg-black text-white placeholder-white/60 border border-black" rows={6} value={prompt} onChange={e=>setPrompt(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Target duration (seconds)</label>
          <input type="number" className="w-40 px-4 py-2 rounded-md bg-black text-white border border-black" value={targetSec} onChange={e=>setTargetSec(parseInt(e.target.value)||240)} />
        </div>
        <button disabled={busy} className="px-6 py-3 bg-black text-white rounded-md">{busy? 'Creating...' : 'Create project'}</button>
      </form>
    </div>
  )
}



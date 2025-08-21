"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PromptForm() {
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('My Story')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, prompt, targetSec: 240, style: 'default' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create project')
      router.push(`/project/${data.id}`)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-md bg-black text-white placeholder-white/60 border border-black" placeholder="Title" />
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full px-4 py-3 rounded-md bg-black text-white placeholder-white/60 border border-black" rows={6} placeholder="Describe your story prompt..." />
      <button disabled={loading} className="px-6 py-3 bg-black text-white rounded-md disabled:opacity-50">{loading ? 'Creating...' : 'Create project'}</button>
    </form>
  )
}



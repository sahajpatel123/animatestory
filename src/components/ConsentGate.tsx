"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'animatestory_consent_v1'

export default function ConsentGate() {
  const [show, setShow] = useState(false)
  const [agree, setAgree] = useState(false)

  useEffect(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (!val) {
        setShow(true)
        // lock scroll while gate is visible
        document.documentElement.style.overflow = 'hidden'
      }
    } catch {}
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])

  function accept() {
    if (!agree) return
    try {
      localStorage.setItem(STORAGE_KEY, '1')
      document.cookie = `${STORAGE_KEY}=1; path=/; max-age=31536000; samesite=lax`
    } catch {}
    setShow(false)
    document.documentElement.style.overflow = ''
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-sm grid place-items-center px-5">
      <div className="max-w-2xl w-full border border-black/20 rounded-2xl bg-white p-6">
        <div className="text-2xl mb-2">Privacy & Cookies</div>
        <p className="text-black/80 leading-relaxed">
          We use essential cookies to operate this site and may process your prompts to generate content. By
          continuing, you agree to our <Link className="underline" href="/terms">Terms</Link>, <Link className="underline" href="/privacy">Privacy Policy</Link>, and <Link className="underline" href="/cookies">Cookies Policy</Link>.
        </p>
        <label className="flex items-center gap-2 mt-5 text-black/80">
          <input type="checkbox" className="accent-black h-4 w-4" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
          I have read and agree to the Terms and Privacy Policy.
        </label>
        <div className="mt-6 flex items-center gap-3">
          <button
            disabled={!agree}
            onClick={accept}
            className={`px-5 py-2.5 rounded-md ${agree ? 'bg-black text-white' : 'bg-black/10 text-black/50 cursor-not-allowed'}`}
          >
            Accept and continue
          </button>
          <Link href="/privacy" className="px-5 py-2.5 rounded-md border border-black/15 hover:bg-black/5">Review policies</Link>
        </div>
      </div>
    </div>
  )
}



import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-black/10 bg-white text-black">
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <div className="text-3xl font-semibold tracking-tight">AnimateStory</div>
            <p className="mt-3 text-black/70 leading-relaxed max-w-sm">Minimal animation studio for pixel‑perfect stories. Outline, scenes, dialogue, and renders in minutes.</p>
            <div className="mt-5 flex gap-3 text-black/70">
              <a href="#" aria-label="Twitter" className="p-2 rounded border border-black/15 hover:bg-black/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 5.9c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.5.7-2.3.9-.7-.7-1.7-1.1-2.8-1.1-2.1 0-3.8 1.7-3.8 3.8 0 .3 0 .6.1.8-3.2-.2-6.1-1.7-8.1-4-.3.5-.4 1.1-.4 1.7 0 1.3.7 2.5 1.8 3.2-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.8 3.7 2.8-1.4 1.1-3.2 1.7-5 1.7h-1c1.8 1.1 4 1.7 6.2 1.7 7.4 0 11.5-6.1 11.5-11.5v-.5c.8-.5 1.4-1.2 1.9-2z"/></svg>
              </a>
              <a href="#" aria-label="GitHub" className="p-2 rounded border border-black/15 hover:bg-black/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9.1 7.6 10.6.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 .1.8 1.6 2.8 1.1.1-.8.4-1.3.7-1.6-2.5-.3-5.2-1.2-5.2-5.7 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.6.2 2.8.1 3.1.8.9 1.2 2 1.2 3.3 0 4.5-2.7 5.4-5.2 5.7.4.3.7.9.7 1.8v2.7c0 .3.2.7.8.6 4.4-1.5 7.6-5.7 7.6-10.6C23.1 5.3 18.3.5 12 .5z" clipRule="evenodd"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="p-2 rounded border border-black/15 hover:bg-black/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.6 3 12 3 12 3s-6.6 0-8.7.4A4 4 0 0 0 .5 6.2 41.8 41.8 0 0 0 0 12c0 1.9.2 3.8.5 5.8a4 4 0 0 0 2.8 2.8C5.4 21 12 21 12 21s6.6 0 8.7-.4a4 4 0 0 0 2.8-2.8c.3-2 .5-3.9.5-5.8 0-1.9-.2-3.8-.5-5.8zM9.6 15.5V8.5l6.5 3.5-6.5 3.5z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <div className="text-lg font-medium">Product</div>
            <ul className="mt-3 space-y-2 text-black/80">
              <li><a className="hover:underline" href="/animate">Animate</a></li>
              <li><a className="hover:underline" href="/pricing">Pricing</a></li>
              <li><a className="hover:underline" href="/about">About</a></li>
            </ul>
          </div>

          <div>
            <div className="text-lg font-medium">Resources</div>
            <ul className="mt-3 space-y-2 text-black/80">
              <li><Link className="hover:underline" href="/docs">Docs</Link></li>
              <li><Link className="hover:underline" href="/api-docs">API</Link></li>
              <li><Link className="hover:underline" href="/status">Status</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-lg font-medium">Legal</div>
            <ul className="mt-3 space-y-2 text-black/80">
              <li><Link className="hover:underline" href="/terms">Terms</Link></li>
              <li><Link className="hover:underline" href="/privacy">Privacy</Link></li>
              <li><Link className="hover:underline" href="/cookies">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-black/60">
          <div>© {new Date().getFullYear()} AnimateStory. All rights reserved.</div>
          <div className="flex gap-4">
            <Link className="hover:text-black" href="/terms">Terms</Link>
            <Link className="hover:text-black" href="/privacy">Privacy</Link>
            <Link className="hover:text-black" href="/about">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}



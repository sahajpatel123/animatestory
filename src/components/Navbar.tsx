"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/animate', label: 'Animate' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-black/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-4xl leading-none">
          <span className="text-black">AnimateStory</span>
        </Link>
        <ul className="flex items-center gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={`px-4 py-2.5 rounded-md text-xl transition-colors ${pathname === l.href ? 'text-white bg-black' : 'text-black hover:bg-black/5'}`}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}



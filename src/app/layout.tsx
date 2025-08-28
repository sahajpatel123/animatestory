import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { SAFE_MODE } from '@/lib/safe'

export const metadata: Metadata = {
  title: 'AnimateStory',
  description: 'Turn prompts into animated stories',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (SAFE_MODE) {
    return (
      <html lang="en">
        <body>
          <main>{children}</main>
        </body>
      </html>
    )
  }
  const Navbar = require('@/components/Navbar').default
  const Footer = require('@/components/Footer').default
  const AnimatedBackdrop = require('@/components/AnimatedBackdrop').default
  const { Pixelify_Sans } = require('next/font/google')
  const pixel = Pixelify_Sans({ subsets: ['latin'], weight: ['400','700'] })
  return (
    <html lang="en">
      <body className={`min-h-screen bg-white text-black antialiased ${pixel.className}`}>
        <AnimatedBackdrop />
        {React.createElement(Navbar)}
        <main className="max-w-7xl mx-auto px-5 py-12">{children}</main>
        {React.createElement(Footer)}
      </body>
    </html>
  )
}



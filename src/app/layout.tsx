import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { SAFE_MODE } from '@/lib/safe'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import { Pixelify_Sans } from 'next/font/google'
  
export const metadata: Metadata = {
  title: 'AnimateStory',
  description: 'Turn prompts into animated stories',
}

// Font loaders must be called at module scope
const pixel = Pixelify_Sans({ subsets: ['latin'], weight: ['400','700'] })

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
  return (
    <html lang="en">
      <body className={`min-h-screen bg-white text-black antialiased ${pixel.className}`}>
        <AnimatedBackdrop />
        <Navbar />
        <main className="max-w-7xl mx-auto px-5 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  )
}



import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimatedBackdrop from '@/components/AnimatedBackdrop'
import { Pixelify_Sans } from 'next/font/google'
import ConsentGate from '@/components/ConsentGate'

export const metadata: Metadata = {
  title: 'AnimateStory',
  description: 'Turn prompts into animated stories',
}

const pixel = Pixelify_Sans({ subsets: ['latin'], weight: ['400','700'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-white text-black antialiased ${pixel.className}`}>
        <AnimatedBackdrop />
        <ConsentGate />
        {/* removed extra decorative gradients for a cleaner, mature look */}
        <Navbar />
        <main className="max-w-7xl mx-auto px-5 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  )
}



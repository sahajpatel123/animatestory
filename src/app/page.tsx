import Link from 'next/link'
import HeroVisual from '@/components/HeroVisual'
import FilmMarquee from '@/components/FilmMarquee'
import Reveal from '@/components/Reveal'
import Testimonials from '@/components/Testimonials'

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <div>
            <h1 className="text-[64px] leading-[1.02] tracking-[1px]">
              Minimal animation studio for pixel-perfect stories
            </h1>
            <p className="text-black/70 mt-6 max-w-xl text-2xl leading-relaxed tracking-[0.2px]">
              Write a prompt. We generate a 3-act storyboard with scenes, shots, dialogue, and a clean render.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/animate" className="px-6 py-3 rounded-md bg-black text-white text-lg">Start animating</Link>
              <Link href="/pricing" className="px-6 py-3 rounded-md border border-black/15 text-lg hover:bg-black/5">Pricing</Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}><HeroVisual /></Reveal>
      </section>

      <Reveal>
        <Testimonials />
      </Reveal>

      <FilmMarquee />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[{
          t: '3 Acts', d: 'Structure with setup, confrontation, and resolution.'
        },{
          t: 'Scenes & Shots', d: '10–14 scenes, 30–45 shots with runtime fitting.'
        },{
          t: 'Audio + Render', d: 'Clean mixes, captions, MP4 and HLS output.'
        }].map((c, i) => (
          <Reveal key={c.t} delay={i * 80}>
            <div className="rounded-xl border border-black/20 bg-white p-6 tilt">
              <div className="text-2xl mb-2">{c.t}</div>
              <div className="text-black/70 text-lg leading-relaxed">{c.d}</div>
            </div>
          </Reveal>
        ))}
      </section>

      

      <section className="rounded-xl border border-black/20 bg-black/5 p-6">
        <div className="text-2xl mb-4">How it works</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { n: 1, t: 'Prompt', d: 'Describe your idea.' },
            { n: 2, t: 'Outline', d: 'We build a 3-act beat sheet.' },
            { n: 3, t: 'Scenes', d: 'Expand into shots and timing.' },
            { n: 4, t: 'Dialogue', d: 'Concise lines and captions.' },
            { n: 5, t: 'Render', d: 'MP4 + HLS output ready to share.' },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 80}>
              <div className="rounded-lg border border-black/20 bg-white p-5 h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-full bg-black text-white grid place-items-center text-lg">{s.n}</div>
                  <div className="text-xl">{s.t}</div>
                </div>
                <div className="text-black/70 text-lg leading-relaxed">{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}



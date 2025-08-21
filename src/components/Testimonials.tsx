type T = { name: string; role: string; quote: string }

const TESTIMONIALS: T[] = [
  { name: 'Maya', role: 'Indie Game Dev', quote: 'I draft cutscenes in hours, not weeks. The runtime fitting is spot on.' },
  { name: 'Leo', role: 'YouTuber', quote: 'Perfect for 3–5 minute shorts. The dialogue rules keep it tight and natural.' },
  { name: 'Ava', role: 'Educator', quote: 'Lesson intros look pro. HLS streams are crisp and reliable.' },
]

export default function Testimonials() {
  return (
    <section className="rounded-xl border border-black/20 bg-white p-6">
      <div className="text-2xl mb-4">What creators say</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => {
          const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(t.name)}&size=80&backgroundType=gradientLinear&backgroundColor=ffffff`
          return (
            <div key={t.name} className="card rounded-lg border border-black/20 bg-black/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src={avatar} alt={t.name} className="h-10 w-10 rounded-full border border-black/20 bg-white" />
                <div>
                  <div className="text-base font-medium">{t.name}</div>
                  <div className="text-xs text-black/60">{t.role}</div>
                </div>
              </div>
              <div className="text-lg leading-relaxed text-black/80">“{t.quote}”</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}



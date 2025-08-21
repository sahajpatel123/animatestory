type Style = { name: string; tag: string; pattern: string }

const STYLES: Style[] = [
  { name: 'Noir', tag: 'Monochrome', pattern: 'repeating-linear-gradient(135deg, #000 0 2px, #111 2px 4px)' },
  { name: 'Retro Pixel', tag: 'Pixel', pattern: 'repeating-linear-gradient(0deg, #000 0 1px, #111 1px 8px), repeating-linear-gradient(90deg, #000 0 1px, #111 1px 8px)' },
  { name: 'Ink', tag: 'Sketch', pattern: 'repeating-linear-gradient(45deg, #000 0 3px, #111 3px 6px)' },
  { name: 'Minimal Line', tag: 'Clean', pattern: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 6px)' },
  { name: 'Watercolor', tag: 'Soft', pattern: 'radial-gradient(circle at 30% 30%, #000 0, transparent 55%), radial-gradient(circle at 70% 60%, #000 0, transparent 45%)' },
  { name: 'Blueprint', tag: 'Grid', pattern: 'repeating-linear-gradient(0deg, #000 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 10px)' },
]

export default function StyleShowcase() {
  return (
    <section>
      <div className="text-2xl mb-4">Style packs</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STYLES.map((s) => (
          <div key={s.name} className="group rounded-xl border border-black/20 bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
            <div className="h-40 relative" style={{ background: s.pattern }}>
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 8px)'
              }} />
            </div>
            <div className="p-5 flex items-center justify-between">
              <div className="text-xl">{s.name}</div>
              <span className="text-xs px-2 py-1 rounded-full border border-black/20">{s.tag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}



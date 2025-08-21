export default function HeroVisual() {
  return (
    <div className="relative aspect-[16/10] rounded-xl border border-black bg-white overflow-hidden">
      {/* layered frames */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[78%] h-[68%]">
          <div className="absolute inset-0 -translate-x-4 -translate-y-4 rounded-md border-2 border-black bg-black/5 animate-float [animation-delay:0ms]" />
          <div className="absolute inset-0 translate-x-4 -translate-y-2 rounded-md border-2 border-black bg-black/10 animate-float [animation-delay:200ms]" />
          <div className="absolute inset-0 translate-y-3 rounded-md border-2 border-black bg-black/15 animate-float [animation-delay:400ms]" />

          <div className="absolute inset-0 rounded-md border border-black bg-black/90 overflow-hidden">
            {/* pixel grid */}
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 8px)'
            }} />
            {/* framing text */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-white text-2xl tracking-[1px]">
                <span className="inline-block animate-fadein [animation-delay:120ms]">Storyboard</span>
                <span className="inline-block mx-2 opacity-60">•</span>
                <span className="inline-block animate-fadein [animation-delay:240ms]">Scenes</span>
                <span className="inline-block mx-2 opacity-60">•</span>
                <span className="inline-block animate-fadein [animation-delay:360ms]">Shots</span>
              </div>
            </div>
            {/* film edge */}
            <div className="absolute left-0 top-0 h-full w-2 bg-[repeating-linear-gradient(transparent,transparent_10px,rgba(255,255,255,.15)_10px,rgba(255,255,255,.15)_12px)]" />
            {/* noise overlay */}
            <div className="noise-pointer-events-none absolute inset-0 opacity-[0.08]" />
          </div>
        </div>
      </div>

      {/* subtle vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(80% 80% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.12) 100%)'
      }} />
    </div>
  )
}



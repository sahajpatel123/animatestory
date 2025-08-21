const KEYWORDS = [
  '3 Acts', 'Scene Board', 'Dialogue', 'Runtime Fit', 'HLS', '1080p', 'FFmpeg', 'Voices', 'SFX', 'Style Pack', 'Redis Queue', 'Postgres'
]

export default function FilmMarquee() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-black/20 bg-white">
      {/* film body */}
      <div className="relative bg-black text-white">
        {/* perforations */}
        <div className="absolute inset-x-0 top-0 h-3">
          <div className="h-full w-full bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,white_46%,transparent_48%)] bg-[length:22px_8px] bg-repeat-x" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3">
          <div className="h-full w-full bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,white_46%,transparent_48%)] bg-[length:22px_8px] bg-repeat-x" />
        </div>

        {/* marquee with duplicated content for seamless scroll */}
        <div className="marquee relative mx-4 py-4">
          <div className="marquee__track">
            {[...KEYWORDS, ...KEYWORDS].map((k, i) => (
              <span key={`${k}-${i}`} className="px-6 text-lg tracking-[0.5px] whitespace-nowrap opacity-90">{k}</span>
            ))}
          </div>
          {/* gradient masks */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black to-transparent" />
        </div>
      </div>
    </div>
  )
}



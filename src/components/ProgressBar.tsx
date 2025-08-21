export default function ProgressBar({ pct, state }: { pct: number; state: string }) {
  return (
    <div className="w-full bg-black/10 rounded h-3 overflow-hidden">
      <div className="bg-black h-3 transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      <div className="text-sm text-black/70 mt-2">{state} {pct}%</div>
    </div>
  )
}



export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-red-600 text-[11px] font-extrabold text-white">
            LM
          </div>
          <div>
            <p className="text-xs font-extrabold text-text leading-none">n2nd</p>
            <p className="text-[8px] text-muted leading-none">Xolvon Intelligence System</p>
          </div>
        </div>

        <span className="rounded border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[9px] font-extrabold text-red-400 tracking-widest uppercase">
          BPS Statistik Indonesia 2025 · v2.0
        </span>
      </div>
    </nav>
  )
}

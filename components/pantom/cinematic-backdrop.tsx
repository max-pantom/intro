export function CinematicBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-16 top-20 h-44 w-44 rotate-12 rounded-[28px] border border-[#1f1a16]/20 bg-[#d7c1aa]/75 dark:border-[#e8dfd3]/20 dark:bg-[#6b5c4d]/35" />
      <div className="absolute right-6 top-40 h-64 w-28 -rotate-6 rounded-[20px] border border-[#1f1a16]/20 bg-[#b29a84]/65 dark:border-[#e8dfd3]/20 dark:bg-[#7b624f]/40" />
      <div className="absolute left-[25%] top-[52%] h-36 w-36 -rotate-8 rounded-full border border-[#1f1a16]/20 bg-[#d8cab8]/60 dark:border-[#e8dfd3]/20 dark:bg-[#5e5147]/45" />
      <div className="absolute right-[28%] top-[18%] h-20 w-20 rotate-12 rounded-full border border-[#1f1a16]/20 bg-[#8f7a63]/55 dark:border-[#e8dfd3]/20 dark:bg-[#9a7f65]/35" />
    </div>
  )
}
